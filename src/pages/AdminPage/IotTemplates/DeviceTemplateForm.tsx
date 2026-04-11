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
import { ArrowLeft, Plus, Trash2, Loader2, Cpu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useAdminCreateIotDeviceTemplate,
  useAdminUpdateIotDeviceTemplate,
} from "@/queries/useIotTemplate";
import {
  IotDeviceTemplateTypeSchema,
  FarmTypeForTemplateSchema,
  type IotDeviceTemplateResType,
  type CreateIotDeviceTemplateBodyType,
  type UpdateIotDeviceTemplateBodyType,
} from "@/schemaValidatation/iotTemplate";

const DeviceItemFormSchema = z
  .object({
    deviceName: z.string().min(1, "Tên thiết bị là bắt buộc").max(255),
  })
  .strict();

const DeviceTemplateFormSchema = z.object({
  name: z.string().min(1, "Tên template là bắt buộc").max(255),
  description: z.string().max(5000).nullable().optional(),
  type: IotDeviceTemplateTypeSchema,
  farmType: FarmTypeForTemplateSchema,
  isActive: z.boolean(),
  items: z.array(DeviceItemFormSchema),
});

type DeviceTemplateFormSchemaType = z.infer<typeof DeviceTemplateFormSchema>;
import { isApiErrorUnprocessableEntityResponse } from "@/lib/utils";
import { handleApiErrorUnprocessentity } from "@/lib/axios";

interface DeviceTemplateFormProps {
  template?: IotDeviceTemplateResType;
  onBack: () => void;
}

const DEVICE_TYPE_LABEL: Record<string, string> = {
  board_module: "Mô-đun bo mạch",
  wifi_module: "Mô-đun WiFi",
  lora_module: "Mô-đun LoRa",
};

export default function DeviceTemplateForm({
  template,
  onBack,
}: DeviceTemplateFormProps) {
  const isEdit = !!template;

  const [show, setShow] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const pendingDataRef = useRef<DeviceTemplateFormSchemaType | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const form = useForm<DeviceTemplateFormSchemaType>({
    resolver: zodResolver(DeviceTemplateFormSchema),
    defaultValues: {
      name: template?.name ?? "",
      description: template?.description ?? "",
      type: template?.type ?? "board_module",
      farmType: template?.farmType ?? "cultivation",
      isActive: template?.isActive ?? true,
      items: template?.items.map((item) => ({
        deviceName: item.deviceName,
      })) ?? [{ deviceName: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { mutateAsync: createAsync, isPending: isCreating } =
    useAdminCreateIotDeviceTemplate();
  const { mutateAsync: updateAsync, isPending: isUpdating } =
    useAdminUpdateIotDeviceTemplate();
  const isSaving = isCreating || isUpdating;

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const doSave = async (data: DeviceTemplateFormSchemaType) => {
    const itemPayload = (data.items ?? []).map(({ deviceName }) => ({
      deviceName,
    }));

    try {
      if (isEdit && template) {
        const body: UpdateIotDeviceTemplateBodyType = {
          name: data.name,
          description: data.description || null,
          type: data.type,
          farmType: data.farmType,
          isActive: data.isActive,
          items: itemPayload,
        };
        await updateAsync({ id: template.id, body });
      } else {
        const body: CreateIotDeviceTemplateBodyType = {
          ...data,
          description: data.description || null,
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

  const onValidSubmit = (data: DeviceTemplateFormSchemaType) => {
    if (isEdit) {
      pendingDataRef.current = data;
      setConfirmSave(true);
    } else {
      void doSave(data);
    }
  };

  const type = form.watch("type");

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
              ? "Chỉnh sửa template thiết bị"
              : "Tạo template thiết bị mới"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Chuẩn hóa module phần cứng cho hạ tầng IoT theo từng farm profile.
          </p>
        </div>
        <Badge
          variant="secondary"
          className="gap-1"
        >
          <Cpu className="h-3 w-3" />
          {DEVICE_TYPE_LABEL[type] ?? type}
        </Badge>
      </div>

      <form onSubmit={form.handleSubmit(onValidSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
            <CardDescription>
              Định nghĩa tên, loại và mô tả cho template thiết bị IoT.
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
                        placeholder="Ví dụ: Bộ điều khiển nhà kính"
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
                      <FieldLabel>Loại thiết bị</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Loại thiết bị" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="board_module">
                            Mô-đun bo mạch
                          </SelectItem>
                          <SelectItem value="wifi_module">
                            Mô-đun WiFi
                          </SelectItem>
                          <SelectItem value="lora_module">
                            Mô-đun LoRa
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
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
                      placeholder="Mô tả phạm vi sử dụng và tiêu chuẩn cấu hình cho template này"
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
                <CardTitle>Danh sách thiết bị</CardTitle>
                <CardDescription>
                  Thêm các thiết bị mặc định cho template này.
                </CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => append({ deviceName: "" })}
              >
                <Plus className="mr-1 h-4 w-4" />
                Thêm thiết bị
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
                  <p className="text-sm font-medium">Thiết bị #{index + 1}</p>
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
                  <Controller
                    name={`items.${index}.deviceName`}
                    control={form.control}
                    render={({ field: itemField, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Tên thiết bị *</FieldLabel>
                        <Input
                          {...itemField}
                          placeholder="Ví dụ: Bộ điều khiển chính"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
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
        title="Cập nhật template thiết bị IoT?"
        description="Thay đổi template sẽ ảnh hưởng đến hệ thống cấu hình IoT."
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
