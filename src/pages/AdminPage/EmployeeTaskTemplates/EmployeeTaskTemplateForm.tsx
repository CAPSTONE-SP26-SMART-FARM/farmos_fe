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
import { ArrowLeft, Plus, Trash2, Loader2, ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useAdminCreateEmployeeTaskTemplate,
  useAdminUpdateEmployeeTaskTemplate,
} from "@/queries/useEmployeeTaskTemplate";
import {
  EmployeeTaskTemplateTypeSchema,
  FarmTypeForTaskTemplateSchema,
  EmployeeTaskItemPrioritySchema,
  type EmployeeTaskTemplateResType,
  type CreateEmployeeTaskTemplateBodyType,
  type UpdateEmployeeTaskTemplateBodyType,
} from "@/schemaValidatation/employeeTaskTemplate";
import { isApiErrorUnprocessableEntityResponse } from "@/lib/utils";
import { handleApiErrorUnprocessentity } from "@/lib/axios";

const TaskItemFormSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc").max(255),
  description: z.string().max(5000).nullable().optional(),
  priority: EmployeeTaskItemPrioritySchema,
});

const EmployeeTaskTemplateFormSchema = z.object({
  name: z.string().min(1, "Tên template là bắt buộc").max(255),
  description: z.string().max(5000).nullable().optional(),
  type: EmployeeTaskTemplateTypeSchema,
  farmType: FarmTypeForTaskTemplateSchema,
  isActive: z.boolean(),
  items: z.array(TaskItemFormSchema),
});

type EmployeeTaskTemplateFormSchemaType = z.infer<
  typeof EmployeeTaskTemplateFormSchema
>;

const PRIORITY_LABEL: Record<string, string> = {
  low: "Thấp",
  normal: "Bình thường",
  high: "Cao",
  urgent: "Khẩn cấp",
};

interface EmployeeTaskTemplateFormProps {
  template?: EmployeeTaskTemplateResType;
  onBack: () => void;
}

export default function EmployeeTaskTemplateForm({
  template,
  onBack,
}: EmployeeTaskTemplateFormProps) {
  const isEdit = !!template;

  const [show, setShow] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [pendingData, setPendingData] =
    useState<EmployeeTaskTemplateFormSchemaType | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const form = useForm<EmployeeTaskTemplateFormSchemaType>({
    resolver: zodResolver(EmployeeTaskTemplateFormSchema),
    defaultValues: {
      name: template?.name ?? "",
      description: template?.description ?? "",
      type: template?.type ?? "task",
      farmType: template?.farmType ?? "cultivation",
      isActive: template?.isActive ?? true,
      items: template?.items.map((item) => ({
        title: item.title,
        description: item.description ?? "",
        priority: item.priority,
      })) ?? [{ title: "", description: "", priority: "normal" as const }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { mutateAsync: createAsync, isPending: isCreating } =
    useAdminCreateEmployeeTaskTemplate();
  const { mutateAsync: updateAsync, isPending: isUpdating } =
    useAdminUpdateEmployeeTaskTemplate();
  const isSaving = isCreating || isUpdating;

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const doSave = async (data: EmployeeTaskTemplateFormSchemaType) => {
    const itemPayload = (data.items ?? []).map(
      ({ title, description, priority }) => ({
        title,
        description: description || null,
        priority,
      }),
    );

    try {
      if (isEdit && template) {
        const body: UpdateEmployeeTaskTemplateBodyType = {
          name: data.name,
          description: data.description || null,
          type: data.type,
          farmType: data.farmType,
          isActive: data.isActive,
          items: itemPayload,
        };
        await updateAsync({ id: template.id, body });
      } else {
        const body: CreateEmployeeTaskTemplateBodyType = {
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

  const onValidSubmit = (data: EmployeeTaskTemplateFormSchemaType) => {
    if (isEdit) {
      setPendingData(data);
      setConfirmSave(true);
    } else {
      void doSave(data);
    }
  };

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
              ? "Chỉnh sửa template nhiệm vụ"
              : "Tạo template nhiệm vụ mới"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Chuẩn hóa bộ nhiệm vụ mặc định giao cho nhân viên nông trại.
          </p>
        </div>
        <Badge
          variant="secondary"
          className="gap-1"
        >
          <ClipboardList className="h-3 w-3" />
          Nhiệm vụ
        </Badge>
      </div>

      <form onSubmit={form.handleSubmit(onValidSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
            <CardDescription>
              Định nghĩa tên, loại trang trại và mô tả cho template nhiệm vụ.
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
                        placeholder="Ví dụ: Nhiệm vụ chăm sóc rau hàng ngày"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
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
              </div>

              <div className="grid gap-3 md:grid-cols-2">
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
                      placeholder="Mô tả phạm vi sử dụng và mục tiêu của bộ nhiệm vụ này"
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
                <CardTitle>Danh sách nhiệm vụ</CardTitle>
                <CardDescription>
                  Thêm các nhiệm vụ mặc định cho template này.
                </CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  append({
                    title: "",
                    description: "",
                    priority: "normal",
                  })
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                Thêm nhiệm vụ
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
                  <p className="text-sm font-medium">Nhiệm vụ #{index + 1}</p>
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
                  <div className="grid gap-3 md:grid-cols-2">
                    <Controller
                      name={`items.${index}.title`}
                      control={form.control}
                      render={({ field: itemField, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Tiêu đề *</FieldLabel>
                          <Input
                            {...itemField}
                            placeholder="Ví dụ: Tưới nước buổi sáng"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name={`items.${index}.priority`}
                      control={form.control}
                      render={({ field: itemField, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Mức ưu tiên</FieldLabel>
                          <Select
                            value={itemField.value}
                            onValueChange={itemField.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Mức ưu tiên" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(PRIORITY_LABEL).map(
                                ([value, label]) => (
                                  <SelectItem
                                    key={value}
                                    value={value}
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
                  <Controller
                    name={`items.${index}.description`}
                    control={form.control}
                    render={({ field: itemField, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Mô tả nhiệm vụ</FieldLabel>
                        <Textarea
                          {...itemField}
                          value={itemField.value ?? ""}
                          placeholder="Chi tiết cách thực hiện, lưu ý quan trọng..."
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
        title="Cập nhật template nhiệm vụ?"
        description="Thay đổi template sẽ ảnh hưởng đến các nhiệm vụ được tạo từ template này."
        confirmLabel="Cập nhật"
        cancelLabel="Hủy"
        onCancel={() => setConfirmSave(false)}
        onConfirm={() => {
          setConfirmSave(false);
          if (pendingData) {
            void doSave(pendingData);
          }
        }}
      />
    </div>
  );
}
