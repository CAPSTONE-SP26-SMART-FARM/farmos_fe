import { zodResolver } from "@hookform/resolvers/zod";
import { getErrorMessage } from "@/lib/queryClient";
import { isAxiosError } from "@/lib/utils";
import {
  useAdminCreateMilestoneTemplate,
  useAdminUpdateMilestoneTemplate,
} from "@/queries/useAdmin";
import type {
  CreateMilestoneTemplateBodyType,
  FarmTypeType,
  MilestoneTemplateResType,
  UpdateMilestoneTemplateBodyType,
} from "@/schemaValidatation/milestoneTemplate";
import type { ApiErrorUnprocessableEntityResponse } from "@/types/api";
import { z } from "zod";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  GripVertical,
  Loader2,
  Milestone,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Controller, useFieldArray, useForm, type Path } from "react-hook-form";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const MilestoneStageSchema = z.object({
  stageName: z
    .string()
    .trim()
    .min(1, "Tên giai đoạn là bắt buộc")
    .max(100, "Tên giai đoạn tối đa 100 ký tự"),
  daysBetween: z
    .number({ message: "Số ngày phải là số" })
    .int("Số ngày phải là số nguyên")
    .min(0, "Số ngày phải lớn hơn hoặc bằng 0")
    .nullable(),
});

const MilestoneTemplateFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tên template là bắt buộc")
    .max(255, "Tên template tối đa 255 ký tự"),
  description: z.string().max(5000, "Mô tả tối đa 5000 ký tự").optional(),
  farmType: z.enum(["cultivation"]),
  isActive: z.boolean(),
  items: z
    .array(MilestoneStageSchema)
    .min(1, "Cần ít nhất 1 giai đoạn milestone"),
});

type MilestoneTemplateFormValues = z.infer<typeof MilestoneTemplateFormSchema>;

interface MilestoneTemplateFormProps {
  template?: MilestoneTemplateResType;
  onBack: () => void;
}

const createDefaultItem = (): MilestoneTemplateFormValues["items"][number] => ({
  stageName: "",
  daysBetween: null,
});

const buildDefaultValues = (
  template?: MilestoneTemplateResType,
): MilestoneTemplateFormValues => {
  if (!template) {
    return {
      name: "",
      description: "",
      farmType: "cultivation",
      isActive: true,
      items: [createDefaultItem()],
    };
  }

  return {
    name: template.name,
    description: template.description ?? "",
    farmType: template.farmType,
    isActive: template.isActive,
    items: template.items
      .slice()
      .sort((left, right) => left.milestoneOrder - right.milestoneOrder)
      .map((item) => ({
        stageName: item.stageName,
        daysBetween: item.daysBetween,
      })) ?? [createDefaultItem()],
  };
};

// ─── Static card preview (used in DragOverlay) ─────────────────
interface StageCardContentProps {
  index: number;
  values?: { stageName: string; daysBetween: number | null };
  isOverlay?: boolean;
}

function StageCardContent({ index, values, isOverlay }: StageCardContentProps) {
  return (
    <div
      className={`rounded-lg border bg-card p-3 ${
        isOverlay
          ? "shadow-lg ring-2 ring-primary/30 rotate-[1.5deg] scale-[1.02]"
          : ""
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-sm font-medium">Giai đoạn #{index + 1}</p>
      </div>
      <div className="space-y-1 pl-6 text-sm text-muted-foreground">
        <p>
          {values?.stageName || <span className="italic">Chưa nhập tên</span>}
        </p>
        {values?.daysBetween != null && (
          <p className="text-xs">
            Cách giai đoạn trước: {values.daysBetween} ngày
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Sortable wrapper for each stage item ──────────────────────
interface SortableStageItemProps {
  id: string;
  index: number;
  control: ReturnType<typeof useForm<MilestoneTemplateFormValues>>["control"];
  canRemove: boolean;
  onRemove: () => void;
}

function SortableStageItem({
  id,
  index,
  control,
  canRemove,
  onRemove,
}: SortableStageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    // When isDragging, the DragOverlay follows the cursor.
    // The original item stays in place as a faded placeholder.
    // Non-dragged items use the transform for layout-shift animation.
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 0 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      <div className="rounded-lg border border-border/80 p-3 transition-colors">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              ref={setActivatorNodeRef}
              {...listeners}
              className="cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent active:cursor-grabbing"
              tabIndex={-1}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <p className="text-sm font-medium">Giai đoạn #{index + 1}</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={!canRemove}
            onClick={onRemove}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Xóa
          </Button>
        </div>

        <FieldGroup>
          <Controller
            name={`items.${index}.stageName`}
            control={control}
            render={({ field: stageField, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Tên giai đoạn *</FieldLabel>
                <Input
                  {...stageField}
                  placeholder="Ví dụ: Nảy mầm"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name={`items.${index}.daysBetween`}
            control={control}
            render={({ field: daysField, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Số ngày cách giai đoạn trước</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={daysField.value ?? ""}
                  onChange={(event) => {
                    if (event.target.value === "") {
                      daysField.onChange(null);
                      return;
                    }
                    const nextValue = Number(event.target.value);
                    daysField.onChange(
                      Number.isNaN(nextValue) ? null : nextValue,
                    );
                  }}
                  placeholder="Để trống nếu không áp dụng"
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>
                    Dùng để ước tính timeline triển khai milestone.
                  </FieldDescription>
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </div>
    </div>
  );
}

export default function MilestoneTemplateForm({
  template,
  onBack,
}: MilestoneTemplateFormProps) {
  const isEdit = !!template;

  const [show, setShow] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [pendingData, setPendingData] =
    useState<MilestoneTemplateFormValues | null>(null);

  const form = useForm<MilestoneTemplateFormValues>({
    resolver: zodResolver(MilestoneTemplateFormSchema),
    defaultValues: buildDefaultValues(template),
  });

  useEffect(() => {
    form.reset(buildDefaultValues(template));
  }, [form, template]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { mutateAsync: createAsync, isPending: isCreating } =
    useAdminCreateMilestoneTemplate();
  const { mutateAsync: updateAsync, isPending: isUpdating } =
    useAdminUpdateMilestoneTemplate();

  const isSaving = isCreating || isUpdating;

  // ─── Drag-and-drop ──────────────────────────────────────────
  const [activeDragSnapshot, setActiveDragSnapshot] = useState<{
    index: number;
    values: MilestoneTemplateFormValues["items"][number];
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const dragId = String(event.active.id);
      const idx = fields.findIndex((f) => f.id === dragId);
      if (idx >= 0) {
        setActiveDragSnapshot({
          index: idx,
          values: form.getValues("items")[idx],
        });
      }
    },
    [fields, form],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragSnapshot(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        move(oldIndex, newIndex);
      }
    },
    [fields, move],
  );

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!form.formState.isDirty || isSaving) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form.formState.isDirty, isSaving]);

  const closeForm = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const handleBack = () => {
    if (form.formState.isDirty && !isSaving) {
      setConfirmDiscard(true);
      return;
    }

    closeForm();
  };

  const applyServerFieldErrors = (error: unknown) => {
    if (!isAxiosError(error) || error.response?.status !== 422) {
      return;
    }

    const responseData = error.response
      .data as ApiErrorUnprocessableEntityResponse<MilestoneTemplateFormValues>;

    if (!Array.isArray(responseData.errors)) {
      return;
    }

    responseData.errors.forEach(({ field, message }) => {
      const fieldPath = String(field) as Path<MilestoneTemplateFormValues>;
      form.setError(fieldPath, { message });
    });
  };

  const save = async (values: MilestoneTemplateFormValues) => {
    const normalizedItems = values.items.map((item, index) => ({
      stageName: item.stageName.trim(),
      milestoneOrder: index + 1,
      daysBetween: item.daysBetween,
    }));

    const basePayload = {
      name: values.name.trim(),
      description: values.description?.trim() || null,
      farmType: values.farmType,
      isActive: values.isActive,
      items: normalizedItems,
    };

    try {
      if (isEdit && template) {
        const body: UpdateMilestoneTemplateBodyType = {
          ...basePayload,
        };

        await updateAsync({
          id: template.id,
          data: body,
        });

        toast.success("Đã cập nhật milestone template.");
      } else {
        const body: CreateMilestoneTemplateBodyType = {
          ...basePayload,
          type: "crop_season",
        };

        await createAsync(body);
        toast.success("Đã tạo milestone template mới.");
      }

      form.reset(values);
      closeForm();
    } catch (error) {
      applyServerFieldErrors(error);
      toast.error(getErrorMessage(error));
    }
  };

  const onValidSubmit = (values: MilestoneTemplateFormValues) => {
    if (isEdit) {
      setPendingData(values);
      setConfirmSave(true);
      return;
    }

    void save(values);
  };

  const addStage = () => {
    append(createDefaultItem());
  };

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        show ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
      }`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold tracking-tight">
            {isEdit ? "Chỉnh sửa milestone template" : "Tạo milestone template"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Thiết lập các giai đoạn mốc chuẩn để manager áp dụng khi lập kế
            hoạch.
          </p>
        </div>

        <Badge
          variant="secondary"
          className="gap-1"
        >
          <Milestone className="h-3 w-3" />
          Crop season
        </Badge>
      </div>

      <form onSubmit={form.handleSubmit(onValidSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
            <CardDescription>
              Xác định tên, loại trang trại và trạng thái sử dụng của template.
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
                        placeholder="Ví dụ: Quy trình canh tác rau ăn lá"
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
                      <FieldLabel>Loại nông trại</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) =>
                          field.onChange(value as FarmTypeType)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại nông trại" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cultivation">Canh tác</SelectItem>
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
                        onValueChange={(value) =>
                          field.onChange(value === "true")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Đang hoạt động</SelectItem>
                          <SelectItem value="false">Tạm tắt</SelectItem>
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
                      placeholder="Mô tả phạm vi áp dụng của milestone template"
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : (
                      <FieldDescription>
                        Mô tả ngắn giúp manager chọn đúng template khi tạo crop
                        season.
                      </FieldDescription>
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>Danh sách giai đoạn</CardTitle>
                <CardDescription>
                  Kéo thả để sắp xếp thứ tự. Thứ tự được tính tự động theo vị
                  trí trong danh sách.
                </CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addStage}
              >
                <Plus className="mr-1 h-4 w-4" />
                Thêm giai đoạn
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                {fields.map((field, index) => (
                  <SortableStageItem
                    key={field.id}
                    id={field.id}
                    index={index}
                    control={form.control}
                    canRemove={fields.length > 1}
                    onRemove={() => remove(index)}
                  />
                ))}
              </SortableContext>

              <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
                {activeDragSnapshot ? (
                  <StageCardContent
                    index={activeDragSnapshot.index}
                    values={activeDragSnapshot.values}
                    isOverlay
                  />
                ) : null}
              </DragOverlay>
            </DndContext>

            <Separator />

            <p className="text-xs text-muted-foreground">
              Tổng {fields.length} giai đoạn. Kéo thả để thay đổi thứ tự
              milestone.
            </p>
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
        open={confirmDiscard}
        title="Hủy thay đổi chưa lưu?"
        description="Các chỉnh sửa hiện tại sẽ bị mất nếu bạn rời khỏi màn hình này."
        confirmLabel="Rời khỏi"
        cancelLabel="Tiếp tục chỉnh sửa"
        variant="destructive"
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => {
          setConfirmDiscard(false);
          closeForm();
        }}
      />

      <ConfirmDialog
        open={confirmSave}
        title="Cập nhật milestone template?"
        description="Thao tác này sẽ ghi đè danh sách giai đoạn milestone hiện có."
        confirmLabel="Cập nhật"
        cancelLabel="Hủy"
        onCancel={() => {
          setConfirmSave(false);
          setPendingData(null);
        }}
        onConfirm={() => {
          if (!pendingData) {
            return;
          }

          setConfirmSave(false);
          void save(pendingData);
        }}
      />
    </div>
  );
}
