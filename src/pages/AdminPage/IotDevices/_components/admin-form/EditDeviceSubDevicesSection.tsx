import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Cpu, Loader2, Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { useAdminUpdateIotDevice } from "@/queries/useIotDevice";
import type {
  DeviceStatusSchema,
  IotDeviceDetailResType,
  IotDeviceResType,
} from "@/schemaValidatation/iotDevice";
import {
  DEVICE_TYPE_ICON,
  DEVICE_TYPE_LABEL,
} from "@/constants/iotDeviceDisplay";
import { isApiErrorResponse } from "@/lib/utils";
import { toast } from "sonner";

type SubDeviceRow = {
  id: string;
  deviceName: string;
  deviceType: string;
  status: z.infer<typeof DeviceStatusSchema>;
  macAddress: string;
  isDirty: boolean;
  isSaving: boolean;
  isEditing: boolean;
};

export function EditDeviceSubDevicesSection({
  device,
}: {
  device: IotDeviceResType | IotDeviceDetailResType;
}) {
  const adminUpdateMutation = useAdminUpdateIotDevice();

  const deviceSubDevices =
    "subDevices" in device && Array.isArray(device.subDevices)
      ? device.subDevices
      : [];

  const [editableSubDevices, setEditableSubDevices] = useState<SubDeviceRow[]>(
    deviceSubDevices.map((sub) => ({
      id: sub.id,
      deviceName: sub.deviceName,
      deviceType: sub.deviceType,
      status: sub.status,
      macAddress: sub.macAddress ?? "",
      isDirty: false,
      isSaving: false,
      isEditing: false,
    })),
  );

  useEffect(() => {
    setEditableSubDevices(
      deviceSubDevices.map((sub) => ({
        id: sub.id,
        deviceName: sub.deviceName,
        deviceType: sub.deviceType,
        status: sub.status,
        macAddress: sub.macAddress ?? "",
        isDirty: false,
        isSaving: false,
        isEditing: false,
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device.id]);

  const toggleEditSubDevice = (id: string) => {
    setEditableSubDevices((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isEditing: !item.isEditing } : item,
      ),
    );
  };

  const cancelSubDevice = (id: string) => {
    const original = deviceSubDevices.find((s) => s.id === id);
    if (!original) return;
    setEditableSubDevices((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              deviceName: original.deviceName,
              macAddress: original.macAddress ?? "",
              isDirty: false,
              isEditing: false,
            }
          : item,
      ),
    );
  };

  const patchSubDevice = (
    id: string,
    patch: Partial<{
      deviceName: string;
      status: z.infer<typeof DeviceStatusSchema>;
      macAddress: string;
    }>,
  ) => {
    setEditableSubDevices((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...patch,
              isDirty: true,
            }
          : item,
      ),
    );
  };

  const saveSubDevice = async (id: string) => {
    const target = editableSubDevices.find((item) => item.id === id);
    if (!target) return;

    const normalizedMac = target.macAddress.trim().toUpperCase();

    setEditableSubDevices((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isSaving: true } : item,
      ),
    );

    try {
      await adminUpdateMutation.mutateAsync({
        deviceId: target.id,
        body: {
          deviceName: target.deviceName.trim(),
          status: target.status,
          ...(target.deviceType === "wifi_module" && normalizedMac
            ? { macAddress: normalizedMac }
            : {}),
        },
      });

      setEditableSubDevices((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                macAddress: normalizedMac || item.macAddress,
                isDirty: false,
                isSaving: false,
                isEditing: false,
              }
            : item,
        ),
      );
      toast.success("Cập nhật thiết bị con thành công");
    } catch (error) {
      setEditableSubDevices((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isSaving: false } : item,
        ),
      );

      if (isApiErrorResponse(error)) {
        toast.error(
          error.response?.data.message ?? "Cập nhật thiết bị con thất bại",
        );
        return;
      }

      toast.error("Cập nhật thiết bị con thất bại");
    }
  };

  if (editableSubDevices.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thiết bị con</CardTitle>
        <CardDescription>
          Chỉnh sửa nhanh các mô-đun WiFi/LoRa thuộc vi xử lý này.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {editableSubDevices.map((subDevice) => {
          const SubIcon = DEVICE_TYPE_ICON[subDevice.deviceType] ?? Cpu;
          const showMacField = subDevice.deviceType === "wifi_module";

          return (
            <div
              key={subDevice.id}
              className="rounded-lg border bg-muted/10 p-3"
            >
              <div className="flex items-center gap-2">
                <SubIcon className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm font-medium">
                  {DEVICE_TYPE_LABEL[subDevice.deviceType] ??
                    subDevice.deviceType}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {subDevice.deviceName}
                </span>
                {showMacField && subDevice.macAddress && (
                  <span className="hidden font-mono text-xs text-muted-foreground md:block">
                    {subDevice.macAddress}
                  </span>
                )}
                <div className="ml-auto flex shrink-0 items-center gap-1">
                  {subDevice.isEditing ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => cancelSubDevice(subDevice.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7"
                        disabled={
                          subDevice.isSaving ||
                          !subDevice.isDirty ||
                          !subDevice.deviceName.trim()
                        }
                        onClick={() => void saveSubDevice(subDevice.id)}
                      >
                        {subDevice.isSaving && (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        )}
                        Lưu
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => toggleEditSubDevice(subDevice.id)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {subDevice.isEditing && (
                <div
                  className={`mt-3 grid gap-3 ${showMacField ? "md:grid-cols-2" : ""}`}
                >
                  <Field>
                    <FieldLabel>Tên thiết bị con</FieldLabel>
                    <Input
                      value={subDevice.deviceName}
                      onChange={(e) =>
                        patchSubDevice(subDevice.id, {
                          deviceName: e.target.value,
                        })
                      }
                    />
                  </Field>
                  {showMacField && (
                    <Field>
                      <FieldLabel>Địa chỉ MAC</FieldLabel>
                      <Input
                        className="font-mono"
                        placeholder="AA:BB:CC:DD:EE:FF"
                        value={subDevice.macAddress}
                        onChange={(e) =>
                          patchSubDevice(subDevice.id, {
                            macAddress: e.target.value,
                          })
                        }
                      />
                    </Field>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
