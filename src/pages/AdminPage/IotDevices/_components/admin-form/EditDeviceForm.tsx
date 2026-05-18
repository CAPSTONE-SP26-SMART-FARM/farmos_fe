import { Button } from "@/components/ui/button";
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
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ArrowLeft, Cpu, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useAdminUpdateIotDevice } from "@/queries/useIotDevice";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import type {
  IotDeviceDetailResType,
  IotDeviceResType,
  IotDeviceTypeSchema,
  UpdateIotDeviceBodyType,
} from "@/schemaValidatation/iotDevice";
import {
  DEVICE_TYPE_ICON,
  DEVICE_TYPE_LABEL,
  STATUS_META,
} from "@/constants/iotDeviceDisplay";
import { isApiErrorUnprocessableEntityResponse } from "@/lib/utils";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { EditFormSchema, type EditFormType } from "./schemas";
import { EditDeviceSubDevicesSection } from "./EditDeviceSubDevicesSection";
import { EditDeviceSensorsSection } from "./EditDeviceSensorsSection";

export function EditDeviceForm({
  device,
  show,
  confirmSave,
  pendingData,
  setConfirmSave,
  setPendingData,
  handleBack,
  hideSensors,
  onNext,
  nextLabel,
  hideStatus,
}: {
  device: IotDeviceResType | IotDeviceDetailResType;
  show: boolean;
  confirmSave: boolean;
  pendingData: EditFormType | null;
  setConfirmSave: (v: boolean) => void;
  setPendingData: (v: EditFormType | null) => void;
  handleBack: () => void;
  hideSensors?: boolean;
  onNext?: () => void;
  nextLabel?: string;
  hideStatus?: boolean;
}) {
  const adminUpdateMutation = useAdminUpdateIotDevice();
  const isPending = adminUpdateMutation.isPending;

  const isBoard = device.deviceType === "board_module";

  const form = useForm<EditFormType>({
    resolver: zodResolver(EditFormSchema),
    defaultValues: {
      deviceName: device.deviceName,
      deviceType: device.deviceType as z.infer<typeof IotDeviceTypeSchema>,
      macAddress: device.macAddress ?? "",
      status: device.status,
    },
  });

  useClearServerFieldErrors(form);

  const doSave = async (data: EditFormType) => {
    try {
      const normalizedMac = data.macAddress.trim().toUpperCase();
      const body: UpdateIotDeviceBodyType = {
        deviceName: data.deviceName.trim(),
        ...(data.deviceType === "wifi_module" && normalizedMac
          ? { macAddress: normalizedMac }
          : {}),
        status: data.status,
      };
      await adminUpdateMutation.mutateAsync({ deviceId: device.id, body });
      handleBack();
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse(error)) {
        handleApiErrorUnprocessentity(
          error.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }
    }
  };

  const onValidSubmit = (data: EditFormType) => {
    setPendingData(data);
    setConfirmSave(true);
  };

  const dtVal = useWatch({ control: form.control, name: "deviceType" });
  const DIcon = DEVICE_TYPE_ICON[dtVal] ?? Cpu;

  useEffect(() => {
    if (dtVal !== "wifi_module" && form.getValues("macAddress")) {
      form.setValue("macAddress", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [dtVal, form]);

  return (
    <div
      className={`space-y-5 transition-all duration-300 ease-out ${show ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <div className="h-4 w-px bg-border" />
        <DIcon className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Chỉnh sửa thiết bị</h2>
        {onNext && (
          <Button
            size="sm"
            className="ml-auto"
            onClick={onNext}
          >
            {nextLabel ?? "Tiếp tục"}
          </Button>
        )}
      </div>

      <form onSubmit={form.handleSubmit(onValidSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Thông tin thiết bị</CardTitle>
            <CardDescription>
              Cập nhật thông tin cấu hình thiết bị IoT.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid gap-3 md:grid-cols-2">
                <Controller
                  name="deviceName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Tên thiết bị *</FieldLabel>
                      <Input {...field} />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <Field>
                  <FieldLabel>Loại thiết bị</FieldLabel>
                  <div className="flex h-9 items-center rounded-md border bg-muted/50 px-3 text-sm text-muted-foreground">
                    {DEVICE_TYPE_LABEL[dtVal] ?? dtVal}
                  </div>
                </Field>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {dtVal === "wifi_module" ? (
                  <Controller
                    name="macAddress"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Địa chỉ MAC *</FieldLabel>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          className="font-mono"
                          placeholder="AA:BB:CC:DD:EE:FF"
                        />
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </Field>
                    )}
                  />
                ) : null}
                {!hideStatus && (
                  <Controller
                    name="status"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Trạng thái</FieldLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
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
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cập nhật
          </Button>
        </div>
      </form>

      {isBoard && <EditDeviceSubDevicesSection device={device} />}

      {!hideSensors && <EditDeviceSensorsSection device={device} />}

      <ConfirmDialog
        open={confirmSave}
        title="Cập nhật thiết bị IoT?"
        description="Thay đổi cấu hình thiết bị có thể ảnh hưởng đến hoạt động giám sát."
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
