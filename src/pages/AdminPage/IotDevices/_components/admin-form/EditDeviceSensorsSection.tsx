import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
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
  FieldLabel,
} from "@/components/ui/field";
import { Cpu, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  useAdminCreateSensorBatch,
  useAdminIotDeviceDetail,
} from "@/queries/useIotDevice";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import type {
  IotDeviceDetailResType,
  IotDeviceResType,
} from "@/schemaValidatation/iotDevice";
import type { SensorTemplateResType } from "@/schemaValidatation/iotTemplate";
import type { SensorTypeSchema } from "@/schemaValidatation/sensor";
import { SENSOR_TYPE_LABEL } from "@/constants/iotDeviceDisplay";
import { isApiErrorResponse, isApiErrorUnprocessableEntityResponse } from "@/lib/utils";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { toast } from "sonner";
import { SensorTemplatePicker } from "./SensorTemplatePicker";
import {
  getSensorDefaultRange,
  SENSOR_STATUS_DISPLAY,
  SENSOR_TEMPLATE_TO_SENSOR_TYPE,
  SENSOR_TYPE_ICON,
  SENSOR_TYPE_VALUES,
  type SensorDisplayItem,
} from "./constants";
import {
  SensorBatchFormSchema,
  type SensorBatchFormType,
} from "./schemas";

export function EditDeviceSensorsSection({
  device,
}: {
  device: IotDeviceResType | IotDeviceDetailResType;
}) {
  const isBoard = device.deviceType === "board_module";

  const adminDetailQuery = useAdminIotDeviceDetail(device.id, isBoard);
  const existingSensors: SensorDisplayItem[] = (
    adminDetailQuery.data?.data.sensors ?? []
  ).map((s) => ({
    sensorType: s.sensorType,
    status: s.status,
    minValue: s.minValue,
    maxValue: s.maxValue,
  }));
  const existingSensorTypes = new Set(
    existingSensors.map((s) => s.sensorType),
  );
  const remainingSensorSlots = Math.max(0, 4 - existingSensors.length);

  const adminCreateSensorsMutation = useAdminCreateSensorBatch();
  const sensorsPending = adminCreateSensorsMutation.isPending;

  const [showSensorForm, setShowSensorForm] = useState(false);

  const sensorForm = useForm<SensorBatchFormType>({
    resolver: zodResolver(SensorBatchFormSchema),
    defaultValues: {
      items: [
        {
          sensorType: "soil_moisture",
          ...getSensorDefaultRange("soil_moisture"),
        },
      ],
    },
  });
  useClearServerFieldErrors(sensorForm);

  const {
    fields: sensorFields,
    append: appendSensor,
    remove: removeSensor,
    replace: replaceSensors,
  } = useFieldArray({ control: sensorForm.control, name: "items" });

  const currentSensorItems =
    useWatch({ control: sensorForm.control, name: "items" }) ?? [];

  const applySensorTemplate = (template: SensorTemplateResType) => {
    const seen = new Set<string>();
    const mapped = template.items
      .map((item) => {
        const sensorType =
          SENSOR_TEMPLATE_TO_SENSOR_TYPE[item.sensorType] ?? item.sensorType;
        const defaults = getSensorDefaultRange(sensorType);
        return {
          sensorType: sensorType as z.infer<typeof SensorTypeSchema>,
          minValue: item.minValue ?? defaults.minValue,
          maxValue: item.maxValue ?? defaults.maxValue,
        };
      })
      .filter((item) => {
        if (
          existingSensorTypes.has(item.sensorType) ||
          seen.has(item.sensorType)
        )
          return false;
        seen.add(item.sensorType);
        return true;
      })
      .slice(0, remainingSensorSlots);
    if (mapped.length > 0) {
      replaceSensors(mapped);
      setShowSensorForm(true);
    }
  };

  const onSensorSubmit = async (data: SensorBatchFormType) => {
    sensorForm.clearErrors("items");
    if (data.items.length > remainingSensorSlots) {
      sensorForm.setError("items", {
        type: "manual",
        message: `Chỉ có thể thêm tối đa ${remainingSensorSlots} cảm biến nữa.`,
      });
      return;
    }
    const dup = data.items.find((item) =>
      existingSensorTypes.has(item.sensorType),
    );
    if (dup) {
      sensorForm.setError("items", {
        type: "manual",
        message: `${SENSOR_TYPE_LABEL[dup.sensorType] ?? dup.sensorType} đã tồn tại trên vi xử lý.`,
      });
      return;
    }
    try {
      await adminCreateSensorsMutation.mutateAsync({
        deviceId: device.id,
        body: { items: data.items },
      });
      setShowSensorForm(false);
      const defaultSensorType =
        SENSOR_TYPE_VALUES.find((type) => !existingSensorTypes.has(type)) ??
        "soil_moisture";
      sensorForm.reset({
        items: [
          {
            sensorType: defaultSensorType,
            ...getSensorDefaultRange(defaultSensorType),
          },
        ],
      });
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse<SensorBatchFormType>(error)) {
        handleApiErrorUnprocessentity<SensorBatchFormType>(
          error.response!.data.errors,
          sensorForm.setError,
          { getValues: sensorForm.getValues },
        );
        return;
      }
      if (isApiErrorResponse(error)) {
        toast.error(
          error.response?.data.message ?? "Thêm cảm biến thất bại",
        );
        return;
      }
      toast.error("Thêm cảm biến thất bại");
    }
  };

  if (!isBoard) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              Cảm biến trên vi xử lý ({existingSensors.length}/4)
            </CardTitle>
            <CardDescription>
              {remainingSensorSlots > 0
                ? `Còn ${remainingSensorSlots} vị trí trống. Mỗi loại cảm biến chỉ được gắn 1 lần.`
                : "Vi xử lý đã đủ 4 cảm biến."}
            </CardDescription>
          </div>
          {!showSensorForm &&
            remainingSensorSlots > 0 &&
            !device.sensorsLockedAt && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const defaultType =
                    SENSOR_TYPE_VALUES.find(
                      (t) => !existingSensorTypes.has(t),
                    ) ?? "soil_moisture";
                  sensorForm.reset({
                    items: [
                      {
                        sensorType: defaultType,
                        ...getSensorDefaultRange(defaultType),
                      },
                    ],
                  });
                  setShowSensorForm(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm cảm biến
              </Button>
            )}
        </div>
      </CardHeader>

      {existingSensors.length > 0 && (
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {existingSensors.map((sensor, i) => {
              const SIcon = SENSOR_TYPE_ICON[sensor.sensorType] ?? Cpu;
              const label =
                SENSOR_TYPE_LABEL[sensor.sensorType] ?? sensor.sensorType;
              const statusLabel = sensor.status
                ? (SENSOR_STATUS_DISPLAY[sensor.status] ?? sensor.status)
                : null;
              return (
                <div
                  key={i}
                  className="rounded-lg border bg-background p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <SIcon className="h-4 w-4 text-muted-foreground" />
                      {label}
                    </span>
                    {statusLabel && (
                      <Badge variant="outline">{statusLabel}</Badge>
                    )}
                  </div>
                  {sensor.minValue != null && sensor.maxValue != null && (
                    <div className="text-xs text-muted-foreground">
                      Nhỏ nhất: {sensor.minValue} | Lớn nhất: {sensor.maxValue}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      )}

      {showSensorForm && !device.sensorsLockedAt && (
        <CardContent>
          <SensorTemplatePicker onApply={applySensorTemplate} />
          <form
            onSubmit={sensorForm.handleSubmit(onSensorSubmit)}
            className="mt-3"
          >
            <div className="space-y-3">
              {(
                sensorForm.formState.errors.items as
                  | { message?: string }
                  | undefined
              )?.message && (
                <p className="text-sm text-destructive">
                  {
                    (
                      sensorForm.formState.errors.items as {
                        message?: string;
                      }
                    ).message
                  }
                </p>
              )}
              {sensorFields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-lg border bg-muted/10 p-3 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Cảm biến #{index + 1}
                    </p>
                    {sensorFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeSensor(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <Controller
                      name={`items.${index}.sensorType`}
                      control={sensorForm.control}
                      render={({ field: f, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Loại cảm biến *</FieldLabel>
                          <Select
                            value={f.value}
                            onValueChange={(val) => {
                              f.onChange(val);
                              const defaults = getSensorDefaultRange(val);
                              sensorForm.setValue(
                                `items.${index}.minValue`,
                                defaults.minValue,
                                { shouldDirty: true, shouldValidate: true },
                              );
                              sensorForm.setValue(
                                `items.${index}.maxValue`,
                                defaults.maxValue,
                                { shouldDirty: true, shouldValidate: true },
                              );
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(SENSOR_TYPE_LABEL).map(
                                ([val, label]) => (
                                  <SelectItem
                                    key={val}
                                    value={val}
                                    disabled={
                                      existingSensorTypes.has(val) ||
                                      currentSensorItems.some(
                                        (item, idx) =>
                                          idx !== index &&
                                          item?.sensorType === val,
                                      )
                                    }
                                  >
                                    {label}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                          <FieldError>{fieldState.error?.message}</FieldError>
                        </Field>
                      )}
                    />
                    <Controller
                      name={`items.${index}.minValue`}
                      control={sensorForm.control}
                      render={({ field: f, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Giá trị tối thiểu *</FieldLabel>
                          <Input
                            type="number"
                            step="any"
                            {...f}
                            onChange={(e) =>
                              f.onChange(e.target.valueAsNumber)
                            }
                          />
                          <FieldError>{fieldState.error?.message}</FieldError>
                        </Field>
                      )}
                    />
                    <Controller
                      name={`items.${index}.maxValue`}
                      control={sensorForm.control}
                      render={({ field: f, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Giá trị tối đa *</FieldLabel>
                          <Input
                            type="number"
                            step="any"
                            {...f}
                            onChange={(e) =>
                              f.onChange(e.target.valueAsNumber)
                            }
                          />
                          <FieldError>{fieldState.error?.message}</FieldError>
                        </Field>
                      )}
                    />
                  </div>
                </div>
              ))}
              {sensorFields.length < remainingSensorSlots && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const usedInForm = new Set(
                      currentSensorItems
                        .map((item) => item?.sensorType)
                        .filter(Boolean),
                    );
                    const next = SENSOR_TYPE_VALUES.find(
                      (type) =>
                        !existingSensorTypes.has(type) &&
                        !usedInForm.has(type),
                    );
                    if (next)
                      appendSensor({
                        sensorType: next,
                        ...getSensorDefaultRange(next),
                      });
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm cảm biến
                </Button>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const defaultType =
                      SENSOR_TYPE_VALUES.find(
                        (t) => !existingSensorTypes.has(t),
                      ) ?? "soil_moisture";
                    setShowSensorForm(false);
                    sensorForm.clearErrors("items");
                    sensorForm.reset({
                      items: [
                        {
                          sensorType: defaultType,
                          ...getSensorDefaultRange(defaultType),
                        },
                      ],
                    });
                  }}
                >
                  Hủy
                </Button>
                <Button type="submit" size="sm" disabled={sensorsPending}>
                  {sensorsPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Tạo {sensorFields.length} cảm biến
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
