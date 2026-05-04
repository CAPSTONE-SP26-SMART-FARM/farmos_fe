import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Trash2 } from "lucide-react";
import { Controller } from "react-hook-form";
import type { Control } from "react-hook-form";
import type { SensorTemplateFormType } from "../sensorTemplateSchemas";
import { toNum } from "../sensorTemplateSchemas";

interface SensorItemCardProps {
  index: number;
  control: Control<SensorTemplateFormType>;
  canRemove: boolean;
  onRemove: () => void;
}

export function SensorItemCard({
  index,
  control,
  canRemove,
  onRemove,
}: SensorItemCardProps) {
  return (
    <div className="rounded-lg border border-border/80 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium">Cảm biến #{index + 1}</p>
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
        <div className="grid gap-3 md:grid-cols-1">
          <Controller
            name={`items.${index}.sensorModelName`}
            control={control}
            render={({ field: itemField, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Tên model cảm biến</FieldLabel>
                <Input
                  {...itemField}
                  value={itemField.value ?? ""}
                  placeholder="Ví dụ: Cảm biến độ ẩm đất điện dung V2.0"
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
            control={control}
            render={({ field: itemField, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Giá trị thấp nhất có thể đo được</FieldLabel>
                <Input
                  type="number"
                  placeholder="VD: 0"
                  value={itemField.value ?? ""}
                  onChange={(e) => itemField.onChange(toNum(e.target.value))}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name={`items.${index}.maxValue`}
            control={control}
            render={({ field: itemField, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Giá trị cao nhất có thể đo được</FieldLabel>
                <Input
                  type="number"
                  placeholder="VD: 100"
                  value={itemField.value ?? ""}
                  onChange={(e) => itemField.onChange(toNum(e.target.value))}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name={`items.${index}.optimalMin`}
            control={control}
            render={({ field: itemField, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Ngưỡng báo động thấp nhất</FieldLabel>
                <Input
                  type="number"
                  placeholder="VD: 20"
                  value={itemField.value ?? ""}
                  onChange={(e) => itemField.onChange(toNum(e.target.value))}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name={`items.${index}.optimalMax`}
            control={control}
            render={({ field: itemField, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Ngưỡng báo động cao nhất</FieldLabel>
                <Input
                  type="number"
                  placeholder="VD: 80"
                  value={itemField.value ?? ""}
                  onChange={(e) => itemField.onChange(toNum(e.target.value))}
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
  );
}
