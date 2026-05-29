import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useManagerCreateEmployeeTaskBatch } from "@/queries/useEmployeeTask";
import {
  CreateEmployeeTaskBatchBodySchema,
  type CreateEmployeeTaskBatchBodyType,
} from "@/schemaValidatation/employeeTask";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import type { z } from "zod";

// Schema có `.default("normal")` cho priority → z.input có priority optional,
// z.output có priority required. RHF lưu giá trị raw (input), submit handler
// nhận giá trị đã transform (output).
type FormInputValues = z.input<typeof CreateEmployeeTaskBatchBodySchema>;
type FormItemInput = FormInputValues["tasks"][number];

const emptyDraft = (): FormItemInput => ({
  title: "",
  description: null,
  priority: "normal",
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestoneId: string;
  onCreated: () => void;
}

function ManualCreateTasksDialog({
  open,
  onOpenChange,
  milestoneId,
  onCreated,
}: Props) {
  const createBatch = useManagerCreateEmployeeTaskBatch(milestoneId);

  const form = useForm<
    FormInputValues,
    unknown,
    CreateEmployeeTaskBatchBodyType
  >({
    resolver: zodResolver(CreateEmployeeTaskBatchBodySchema),
    defaultValues: { tasks: [emptyDraft()] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tasks",
  });

  const handleSubmit = (data: CreateEmployeeTaskBatchBodyType) => {
    const payload = data.tasks.map((t) => ({
      title: t.title.trim(),
      description: t.description?.trim() || null,
      priority: t.priority,
    }));

    createBatch.mutate(
      { tasks: payload },
      {
        onSuccess: () => {
          onOpenChange(false);
          onCreated();
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"
        key={String(open)}
      >
        <DialogHeader>
          <DialogTitle>Thêm nhiệm vụ tay</DialogTitle>
          <DialogDescription>
            Nhập tên và mức ưu tiên cho từng nhiệm vụ. Có thể thêm nhiều nhiệm
            vụ cùng lúc.
          </DialogDescription>
        </DialogHeader>

        <form
          id="manual-create-tasks-form"
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-3"
        >
          {fields.map((field, idx) => (
            <div
              key={field.id}
              className="rounded-md border p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">Nhiệm vụ {idx + 1}</p>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => remove(idx)}
                    aria-label={`Xóa nhiệm vụ ${idx + 1}`}
                  >
                    <Trash2
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <Controller
                  control={form.control}
                  name={`tasks.${idx}.title`}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Tiêu đề *</FieldLabel>
                      <Input
                        {...field}
                        placeholder="vd: Tưới nước buổi sáng"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name={`tasks.${idx}.description`}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Mô tả</FieldLabel>
                      <Textarea
                        {...field}
                        value={field.value ?? ""}
                        rows={2}
                        placeholder="Mô tả chi tiết công việc (không bắt buộc)"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name={`tasks.${idx}.priority`}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Mức ưu tiên</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Mức ưu tiên" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Thấp</SelectItem>
                          <SelectItem value="normal">Bình thường</SelectItem>
                          <SelectItem value="high">Cao</SelectItem>
                          <SelectItem value="urgent">Khẩn cấp</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append(emptyDraft())}
          >
            <Plus
              className="mr-1 h-4 w-4"
              aria-hidden="true"
            />
            Thêm nhiệm vụ
          </Button>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={createBatch.isPending}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            form="manual-create-tasks-form"
            disabled={createBatch.isPending}
          >
            {createBatch.isPending
              ? "Đang lưu..."
              : `Lưu ${fields.length} nhiệm vụ`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ManualCreateTasksDialog;
