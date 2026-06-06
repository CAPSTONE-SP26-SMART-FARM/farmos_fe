import { zodResolver } from "@hookform/resolvers/zod";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import {
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
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
import { ArrowLeft, Loader2, Milestone, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
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
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
  MilestoneTemplateFormSchema,
  type MilestoneTemplateFormValues,
  createDefaultItem,
  buildDefaultValues,
  StageCardContent,
  SortableStageItem,
} from "./components/MilestoneStageItem";

interface MilestoneTemplateFormProps {
  template?: MilestoneTemplateResType;
  onBack: () => void;
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
  useClearServerFieldErrors(form);

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
      if (!form.formState.isDirty || isSaving) return;
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
        const body: UpdateMilestoneTemplateBodyType = { ...basePayload };
        await updateAsync({ id: template.id, data: body });
        toast.success("Đã cập nhật mẫu cột mốc");
      } else {
        const body: CreateMilestoneTemplateBodyType = {
          ...basePayload,
          type: "crop_season",
        };
        await createAsync(body);
        toast.success("Đã tạo mẫu cột mốc mới");
      }

      form.reset(values);
      closeForm();
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse(error)) {
        handleApiErrorUnprocessentity<MilestoneTemplateFormValues>(
          error.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }

      if (isApiErrorResponse(error)) {
        toast.error(
          error.response?.data.message || "Không thể lưu mẫu cột mốc",
        );
        return;
      }

      toast.error("Không thể lưu mẫu cột mốc");
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
        <Button type="button" variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold tracking-tight">
            {isEdit ? "Chỉnh sửa mẫu cột mốc" : "Tạo mẫu cột mốc"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Thiết lập các giai đoạn mốc chuẩn để quản lý áp dụng khi lập kế
            hoạch.
          </p>
        </div>

        <Badge variant="secondary" className="gap-1">
          <Milestone className="h-3 w-3" />
          Mùa vụ
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
                      <FieldLabel>Tên mẫu *</FieldLabel>
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
                      placeholder="Mô tả phạm vi áp dụng của mẫu cột mốc"
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : (
                      <FieldDescription>
                        Mô tả ngắn giúp quản lý chọn đúng mẫu khi tạo mùa vụ.
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
              Tổng {fields.length} giai đoạn. Kéo thả để thay đổi thứ tự các
              giai đoạn.
            </p>
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
        title="Cập nhật mẫu cột mốc?"
        description="Thao tác này sẽ ghi đè danh sách giai đoạn hiện có."
        confirmLabel="Cập nhật"
        cancelLabel="Hủy"
        onCancel={() => {
          setConfirmSave(false);
          setPendingData(null);
        }}
        onConfirm={() => {
          if (!pendingData) return;
          setConfirmSave(false);
          void save(pendingData);
        }}
      />
    </div>
  );
}
