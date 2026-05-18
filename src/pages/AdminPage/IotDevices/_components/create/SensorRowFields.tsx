import { Controller, type Control } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { SENSOR_TYPE_ICON, SENSOR_TYPE_LABEL } from "@/constants/iotDeviceDisplay";
import {
  SENSOR_TYPE_VALUES,
  type SensorBatchFormType,
} from "./sensorBatchSchema";

interface Props {
  index: number;
  control: Control<SensorBatchFormType>;
  watchedItems: SensorBatchFormType["items"];
  canRemove: boolean;
  onRemove: () => void;
}

export function SensorRowFields({
  index,
  control,
  watchedItems,
  canRemove,
  onRemove,
}: Props) {
  return (
    <div className="rounded-lg border bg-muted/10 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Cảm biến #{index + 1}</p>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={onRemove}
            aria-label={`Xóa cảm biến số ${index + 1}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <FieldGroup>
        <div className="grid gap-3 md:grid-cols-3">
          <Controller
            name={`items.${index}.sensorType`}
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Loại cảm biến *</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SENSOR_TYPE_VALUES.map((type) => {
                      const SIcon = SENSOR_TYPE_ICON[type];
                      return (
                        <SelectItem
                          key={type}
                          value={type}
                          disabled={watchedItems.some(
                            (item, i) =>
                              i !== index && item?.sensorType === type,
                          )}
                        >
                          <span className="inline-flex items-center gap-1.5">
                            {SIcon && (
                              <SIcon className="h-3.5 w-3.5 text-primary" />
                            )}
                            {SENSOR_TYPE_LABEL[type] ?? type}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          <Controller
            name={`items.${index}.minValue`}
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Giá trị tối thiểu *</FieldLabel>
                <Input
                  type="number"
                  step="any"
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          <Controller
            name={`items.${index}.maxValue`}
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Giá trị tối đa *</FieldLabel>
                <Input
                  type="number"
                  step="any"
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
        </div>
      </FieldGroup>
    </div>
  );
}
