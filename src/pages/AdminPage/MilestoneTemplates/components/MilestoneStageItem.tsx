import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, Trash2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import type { MilestoneTemplateResType } from "@/schemaValidatation/milestoneTemplate";

export const MilestoneStageSchema = z.object({
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

export const MilestoneTemplateFormSchema = z.object({
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

export type MilestoneTemplateFormValues = z.infer<typeof MilestoneTemplateFormSchema>;

export const createDefaultItem = (): MilestoneTemplateFormValues["items"][number] => ({
  stageName: "",
  daysBetween: null,
});

export const buildDefaultValues = (
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
    items:
      template.items
        .slice()
        .sort((left, right) => left.milestoneOrder - right.milestoneOrder)
        .map((item) => ({
          stageName: item.stageName,
          daysBetween: item.daysBetween,
        })) ?? [createDefaultItem()],
  };
};

interface StageCardContentProps {
  index: number;
  values?: { stageName: string; daysBetween: number | null };
  isOverlay?: boolean;
}

export function StageCardContent({ index, values, isOverlay }: StageCardContentProps) {
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

interface SortableStageItemProps {
  id: string;
  index: number;
  control: ReturnType<typeof useForm<MilestoneTemplateFormValues>>["control"];
  canRemove: boolean;
  onRemove: () => void;
}

export function SortableStageItem({
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
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 0 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
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
                <Input {...stageField} placeholder="Ví dụ: Nảy mầm" />
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
