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
import { Activity, ArrowLeft, Plus, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useAdminCreateSensorTemplate,
  useAdminUpdateSensorTemplate,
} from "@/queries/useIotTemplate";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import type {
  SensorTemplateResType,
  CreateSensorTemplateBodyType,
  UpdateSensorTemplateBodyType,
} from "@/schemaValidatation/iotTemplate";
import { isApiErrorUnprocessableEntityResponse } from "@/lib/utils";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import {
  SensorTemplateFormSchema,
  type SensorTemplateFormType,
  SENSOR_TYPE_LABEL,
} from "./sensorTemplateSchemas";
import { SensorItemCard } from "./components/SensorItemCard";

interface SensorTemplateFormProps {
  template?: SensorTemplateResType;
  onBack: () => void;
}

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
        sensorModelName: item.sensorModelName ?? "",
        minValue: item.minValue ?? 0,
        maxValue: item.maxValue ?? 0,
        optimalMin: item.optimalMin ?? 0,
        optimalMax: item.optimalMax ?? 0,
      })) ?? [
        {
          sensorModelName: "",
          minValue: 0,
          maxValue: 0,
          optimalMin: 0,
          optimalMax: 0,
        },
      ],
    },
  });

  useClearServerFieldErrors(form);

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
      sensorModelName: item.sensorModelName,
      minValue: item.minValue,
      maxValue: item.maxValue,
      optimalMin: item.optimalMin,
      optimalMax: item.optimalMax,
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
          { getValues: form.getValues },
        );
        return;
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
        <Button variant="ghost" size="icon" onClick={handleBack}>
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
        <Badge variant="secondary" className="gap-1">
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
                              <SelectItem key={val} value={val}>
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
                          <SelectItem value="cultivation">Trồng trọt</SelectItem>
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
                    sensorModelName: "",
                    minValue: 0,
                    maxValue: 0,
                    optimalMin: 0,
                    optimalMax: 0,
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
              <SensorItemCard
                key={field.id}
                index={index}
                control={form.control}
                canRemove={fields.length > 1}
                onRemove={() => remove(index)}
              />
            ))}
          </CardContent>
        </Card>

        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleBack}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSaving}>
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
