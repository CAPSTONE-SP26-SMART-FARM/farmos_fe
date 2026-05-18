import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Cpu, Trash2 } from "lucide-react";
import { useEffect } from "react";
import {
  Controller,
  type UseFormSetValue,
  useWatch,
} from "react-hook-form";
import type { z } from "zod";
import type { IotDeviceTypeSchema } from "@/schemaValidatation/iotDevice";
import type { IotDeviceTemplateResType } from "@/schemaValidatation/iotTemplate";
import {
  DEVICE_TYPE_ICON,
  DEVICE_TYPE_LABEL,
  STATUS_META,
} from "@/constants/iotDeviceDisplay";
import { DeviceTemplatePicker } from "./DeviceTemplatePicker";
import type { BatchCreateFormType } from "./schemas";

export function DeviceItemCard({
  index,
  control,
  setValue,
  canRemove,
  boardTakenByOther,
  onApplyTemplate,
  onRemove,
  hideStatus,
}: {
  index: number;
  control: import("react-hook-form").Control<BatchCreateFormType>;
  setValue: UseFormSetValue<BatchCreateFormType>;
  canRemove: boolean;
  boardTakenByOther: boolean;
  onApplyTemplate: (index: number, template: IotDeviceTemplateResType) => void;
  onRemove: () => void;
  hideStatus?: boolean;
}) {
  const dtVal = useWatch({ control, name: `devices.${index}.deviceType` });
  const macValue = useWatch({ control, name: `devices.${index}.macAddress` });
  const DIcon = DEVICE_TYPE_ICON[dtVal] ?? Cpu;
  const showMac = dtVal === "wifi_module";
  const effectiveType = (dtVal ?? "wifi_module") as z.infer<
    typeof IotDeviceTypeSchema
  >;

  useEffect(() => {
    if (dtVal !== "wifi_module" && macValue) {
      setValue(`devices.${index}.macAddress`, "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [dtVal, macValue, index, setValue]);

  return (
    <Card className="border-border/50 bg-muted/10">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <div className="flex items-center gap-2">
          <DIcon className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Thiết bị #{index + 1}</CardTitle>
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <DeviceTemplatePicker
          deviceType={effectiveType}
          onApply={(template) => onApplyTemplate(index, template)}
        />

        <FieldGroup>
          <div className="grid gap-3 md:grid-cols-2">
            <Controller
              name={`devices.${index}.deviceName`}
              control={control}
              render={({ field: f, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Tên thiết bị *</FieldLabel>
                  <Input
                    {...f}
                    placeholder="VD: Vi xử lý chính - Nông trại A"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />
            <Controller
              name={`devices.${index}.deviceType`}
              control={control}
              render={({ field: f, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Loại thiết bị *</FieldLabel>
                  <Select
                    value={f.value}
                    onValueChange={f.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DEVICE_TYPE_LABEL).map(([val, label]) => {
                        const disableBoardOption =
                          val === "board_module" &&
                          boardTakenByOther &&
                          f.value !== "board_module";

                        return (
                          <SelectItem
                            key={val}
                            value={val}
                            disabled={disableBoardOption}
                          >
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {showMac && (
              <Controller
                name={`devices.${index}.macAddress`}
                control={control}
                render={({ field: f, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Địa chỉ MAC *</FieldLabel>
                    <Input
                      {...f}
                      placeholder="AA:BB:CC:DD:EE:FF"
                      className="font-mono"
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />
            )}
            {!hideStatus && (
              <Controller
                name={`devices.${index}.status`}
                control={control}
                render={({ field: f, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Trạng thái</FieldLabel>
                    <Select
                      value={f.value}
                      onValueChange={f.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_META).map(([val, meta]) => (
                          <SelectItem
                            key={val}
                            value={val}
                          >
                            {meta.labelAdmin}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />
            )}
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
