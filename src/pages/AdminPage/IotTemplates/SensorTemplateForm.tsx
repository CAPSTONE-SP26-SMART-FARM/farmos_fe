import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Activity, ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useAdminCreateSensorTemplate,
  useAdminUpdateSensorTemplate,
} from "@/queries/useIotTemplate";
import {
  SensorTemplateItemConfigSchema,
  SensorTemplateTypeSchema,
  FarmTypeForTemplateSchema,
  type SensorTemplateResType,
  type CreateSensorTemplateBodyType,
  type UpdateSensorTemplateBodyType,
} from "@/schemaValidatation/iotTemplate";
import { isApiErrorUnprocessableEntityResponse } from "@/lib/utils";
import { handleApiErrorUnprocessentity } from "@/lib/axios";

// Item schema with cross-field threshold validation
const SensorItemFormSchema = SensorTemplateItemConfigSchema.superRefine(
  (item, ctx) => {
    if (
      item.minValue != null &&
      item.maxValue != null &&
      item.minValue > item.maxValue
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Giá trị thấp nhất không được lớn hơn giá trị cao nhất",
        path: ["maxValue"],
      });
    }
    if (
      item.optimalMin != null &&
      item.optimalMax != null &&
      item.optimalMin > item.optimalMax
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Ngưỡng báo động thấp nhất không được lớn hơn ngưỡng báo động cao nhất",
        path: ["optimalMax"],
      });
    }
    if (
      item.optimalMin != null &&
      item.minValue != null &&
      item.optimalMin < item.minValue
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ngưỡng báo động phải nằm trong khoảng giá trị đo được",
        path: ["optimalMin"],
      });
    }
    if (
      item.optimalMax != null &&
      item.maxValue != null &&
      item.optimalMax > item.maxValue
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ngưỡng báo động phải nằm trong khoảng giá trị đo được",
        path: ["optimalMax"],
      });
    }
  },
);

// Standalone form schema — no .default() to avoid z.input / z.output mismatch with zodResolver
const SensorTemplateFormSchema = z.object({
  name: z.string().min(1, "Tên template là bắt buộc").max(255),
  description: z.string().max(5000).nullable().optional(),
  type: SensorTemplateTypeSchema,
  farmType: FarmTypeForTemplateSchema,
  version: z
    .number({ error: "Phiên bản không hợp lệ" })
    .int()
    .positive("Phiên bản phải lớn hơn 0"),
  isActive: z.boolean(),
  items: z.array(SensorItemFormSchema),
});

type SensorTemplateFormType = z.infer<typeof SensorTemplateFormSchema>;

interface SensorTemplateFormProps {
  template?: SensorTemplateResType;
  onBack: () => void;
}

const SENSOR_TYPE_LABEL: Record<string, string> = {
  soil_moisture_sensor: "Độ ẩm đất",
  light_intensity_sensor: "Cường độ ánh sáng",
  air_humidity_sensor: "Độ ẩm không khí",
  air_temperature_sensor: "Nhiệt độ không khí",
} as const;

const toNum = (v: string): number | null => {
  if (v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

export default function SensorTemplateForm({
  template,
  onBack,
}: SensorTemplateFormProps) {
  const isEdit = !!template;

  const [show, setShow] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const pendingDataRef = useRef<SensorTemplateFormType | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const form = useForm<SensorTemplateFormType>({
    resolver: zodResolver(SensorTemplateFormSchema),
    defaultValues: {
      name: template?.name ?? "",
      description: template?.description ?? "",
      type: template?.type ?? "soil_moisture_sensor",
      farmType: template?.farmType ?? "cultivation",
      version: template?.version ?? 1,
      isActive: template?.isActive ?? true,
      items: template?.items.map((item) => ({
        sensorType: item.sensorType,
        sensorModel: item.sensorModel ?? "",
        gpioPin: item.gpioPin ?? "",
        calibrationOffset: item.calibrationOffset ?? null,
        stageName: item.stageName ?? "",
        minValue: item.minValue ?? null,
        maxValue: item.maxValue ?? null,
        optimalMin: item.optimalMin ?? null,
        optimalMax: item.optimalMax ?? null,
      })) ?? [
        {
          sensorType: "soil_moisture_sensor" as const,
          sensorModel: "",
          gpioPin: "",
          calibrationOffset: null,
          stageName: "",
          minValue: null,
          maxValue: null,
          optimalMin: null,
          optimalMax: null,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { mutateAsync: createAsync, isPending: isCreating } =
    useAdminCreateSensorTemplate();
  const { mutateAsync: updateAsync, isPending: isUpdating } =
    useAdminUpdateSensorTemplate();
  const isSaving = isCreating || isUpdating;

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const doSave = async (data: SensorTemplateFormType) => {
    const itemPayload = data.items.map((item) => ({
      sensorType: item.sensorType,
      sensorModel: item.sensorModel || null,
      gpioPin: item.gpioPin || null,
      calibrationOffset: item.calibrationOffset ?? null,
      stageName: item.stageName || null,
      minValue: item.minValue ?? null,
      maxValue: item.maxValue ?? null,
      optimalMin: item.optimalMin ?? null,
      optimalMax: item.optimalMax ?? null,
    }));

    try {
      if (isEdit && template) {
        const body: UpdateSensorTemplateBodyType = {
          name: data.name,
          description: data.description || null,
          type: data.type,
          farmType: data.farmType,
          version: data.version,
          isActive: data.isActive,
          items: itemPayload,
        };
        await updateAsync({ id: template.id, body });
      } else {
        const body: CreateSensorTemplateBodyType = {
          name: data.name,
          description: data.description || null,
          type: data.type,
          farmType: data.farmType,
          version: data.version,
          isActive: data.isActive,
          items: itemPayload,
        };
        await createAsync(body);
      }
      handleBack();
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse(error)) {
        handleApiErrorUnprocessentity(
          error.response!.data.errors,
          form.setError,
        );
      }
    }
  };

  const onValidSubmit = (data: SensorTemplateFormType) => {
    if (isEdit) {
      pendingDataRef.current = data;
      setConfirmSave(true);
    } else {
      void doSave(data);
    }
  };

  const currentType = form.watch("type");

  return (
    <div
      className={`transition-all duration-300 ease-out ${show ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"}`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold tracking-tight">
            {isEdit
              ? "Chỉnh sửa template cảm biến"
              : "Tạo template cảm biến mới"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Thiết lập thông số ngưỡng chuẩn để vận hành hệ thống theo từng cảm
            biến.
          </p>
        </div>
        <Badge
          variant="secondary"
          className="gap-1"
        >
          <Activity className="h-3 w-3" />
          {SENSOR_TYPE_LABEL[currentType] ?? currentType}
        </Badge>
      </div>

      <form onSubmit={form.handleSubmit(onValidSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
            <CardDescription>
              Định nghĩa tên, loại cảm biến và phiên bản cho template.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup>
              <div className="grid gap-3 md:grid-cols-2">
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Tên template *</FieldLabel>
                      <Input
                        {...field}
                        placeholder="Ví dụ: Gói cảm biến nhà màng"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="type"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Loại cảm biến chính</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Loại cảm biến" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(SENSOR_TYPE_LABEL).map(
                            ([val, label]) => (
                              <SelectItem
                                key={val}
                                value={val}
                              >
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <Controller
                  name="farmType"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Loại trang trại</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Loại trang trại" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cultivation">
                            Trồng trọt
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="version"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Phiên bản</FieldLabel>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Phiên bản *"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? 1 : Number(val));
                        }}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="isActive"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Trạng thái</FieldLabel>
                      <Select
                        value={String(field.value)}
                        onValueChange={(v) => field.onChange(v === "true")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Hoạt động</SelectItem>
                          <SelectItem value="false">Tắt</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Mô tả</FieldLabel>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Mô tả phạm vi áp dụng, chiến lược cảnh báo và lưu ý hiệu chuẩn"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Danh sách cảm biến</CardTitle>
                <CardDescription>
                  Cấu hình ngưỡng min/max, optimal cho từng cảm biến.
                </CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  append({
                    sensorType: currentType,
                    sensorModel: "",
                    gpioPin: "",
                    calibrationOffset: null,
                    stageName: "",
                    minValue: null,
                    maxValue: null,
                    optimalMin: null,
                    optimalMax: null,
                  })
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                Thêm cảm biến
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-lg border border-border/80 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium">Cảm biến #{index + 1}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Xóa
                  </Button>
                </div>

                <FieldGroup>
                  <div className="grid gap-3 md:grid-cols-3">
                    <Controller
                      name={`items.${index}.sensorType`}
                      control={form.control}
                      render={({ field: itemField, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Loại cảm biến</FieldLabel>
                          <Select
                            value={itemField.value}
                            onValueChange={itemField.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Loại cảm biến" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(SENSOR_TYPE_LABEL).map(
                                ([val, label]) => (
                                  <SelectItem
                                    key={val}
                                    value={val}
                                  >
                                    {label}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name={`items.${index}.sensorModel`}
                      control={form.control}
                      render={({ field: itemField, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Model</FieldLabel>
                          <Input
                            {...itemField}
                            value={itemField.value ?? ""}
                            placeholder="Ví dụ: DHT11"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name={`items.${index}.gpioPin`}
                      control={form.control}
                      render={({ field: itemField, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>GPIO Pin</FieldLabel>
                          <Input
                            {...itemField}
                            value={itemField.value ?? ""}
                            placeholder="Ví dụ: D4"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Controller
                      name={`items.${index}.stageName`}
                      control={form.control}
                      render={({ field: itemField, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Giai đoạn</FieldLabel>
                          <Input
                            {...itemField}
                            value={itemField.value ?? ""}
                            placeholder="Ví dụ: Ươm cây"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name={`items.${index}.calibrationOffset`}
                      control={form.control}
                      render={({ field: itemField, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Calibration Offset</FieldLabel>
                          <Input
                            type="number"
                            placeholder="0"
                            value={itemField.value ?? ""}
                            onChange={(e) =>
                              itemField.onChange(toNum(e.target.value))
                            }
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Controller
                      name={`items.${index}.minValue`}
                      control={form.control}
                      render={({ field: itemField, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>
                            Giá trị thấp nhất có thể đo được
                          </FieldLabel>
                          <Input
                            type="number"
                            placeholder="VD: 0"
                            value={itemField.value ?? ""}
                            onChange={(e) =>
                              itemField.onChange(toNum(e.target.value))
                            }
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name={`items.${index}.maxValue`}
                      control={form.control}
                      render={({ field: itemField, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>
                            Giá trị cao nhất có thể đo được
                          </FieldLabel>
                          <Input
                            type="number"
                            placeholder="VD: 100"
                            value={itemField.value ?? ""}
                            onChange={(e) =>
                              itemField.onChange(toNum(e.target.value))
                            }
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name={`items.${index}.optimalMin`}
                      control={form.control}
                      render={({ field: itemField, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Ngưỡng báo động thấp nhất</FieldLabel>
                          <Input
                            type="number"
                            placeholder="VD: 20"
                            value={itemField.value ?? ""}
                            onChange={(e) =>
                              itemField.onChange(toNum(e.target.value))
                            }
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name={`items.${index}.optimalMax`}
                      control={form.control}
                      render={({ field: itemField, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Ngưỡng báo động cao nhất</FieldLabel>
                          <Input
                            type="number"
                            placeholder="VD: 80"
                            value={itemField.value ?? ""}
                            onChange={(e) =>
                              itemField.onChange(toNum(e.target.value))
                            }
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                </FieldGroup>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Cập nhật" : "Tạo mới"}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmSave}
        title="Cập nhật template cảm biến?"
        description="Thay đổi ngưỡng cảm biến sẽ ảnh hưởng đến hệ thống cảnh báo IoT."
        confirmLabel="Cập nhật"
        cancelLabel="Hủy"
        onCancel={() => setConfirmSave(false)}
        onConfirm={() => {
          setConfirmSave(false);
          if (pendingDataRef.current) {
            void doSave(pendingDataRef.current);
          }
        }}
      />
    </div>
  );
}
