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
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Cpu,
  Wifi,
  Radio,
  CircuitBoard,
  Calendar,
  Power,
  PowerOff,
  Wrench,
  ShieldOff,
  Lock,
  Loader2,
  Thermometer,
  Droplets,
  Sun,
  Sprout,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  useOwnerIotDeviceDetail,
  useOwnerLockSensors,
} from "@/queries/useIotDevice";
import { useOwnerListSensors, useOwnerDeleteSensor } from "@/queries/useSensor";
import type { IotDeviceResType } from "@/schemaValidatation/iotDevice";
import type { SensorResType } from "@/schemaValidatation/sensor";

// ── Metadata maps ──────────────────────────────────────────────────────

const STATUS_META: Record<
  string,
  { label: string; className: string; icon: typeof Power }
> = {
  active: {
    label: "Hoạt động",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    icon: Power,
  },
  inactive: {
    label: "Tắt",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    icon: PowerOff,
  },
  maintenance: {
    label: "Bảo trì",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    icon: Wrench,
  },
  decommissioned: {
    label: "Ngưng hoạt động",
    className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
    icon: ShieldOff,
  },
};

const DEVICE_TYPE_ICON: Record<string, typeof Cpu> = {
  board_module: CircuitBoard,
  lora_module: Radio,
  wifi_module: Wifi,
};

const DEVICE_TYPE_LABEL: Record<string, string> = {
  board_module: "Board Module",
  lora_module: "LoRa Module",
  wifi_module: "WiFi Module",
};

const SENSOR_TYPE_META: Record<
  string,
  { label: string; icon: typeof Thermometer; unit: string }
> = {
  soil_moisture: { label: "Độ ẩm đất", icon: Droplets, unit: "%" },
  air_temperature: { label: "Nhiệt độ KK", icon: Thermometer, unit: "°C" },
  air_humidity: { label: "Độ ẩm KK", icon: Sprout, unit: "%" },
  light_intensity: { label: "Cường độ sáng", icon: Sun, unit: "lux" },
};

const SENSOR_STATUS_META: Record<string, { label: string; className: string }> =
  {
    active: {
      label: "Hoạt động",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    },
    inactive: {
      label: "Tắt",
      className:
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    },
    calibration: {
      label: "Hiệu chuẩn",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    },
    error: {
      label: "Lỗi",
      className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    },
    damaged: {
      label: "Hư hỏng",
      className:
        "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    },
  };

// ── Props ──────────────────────────────────────────────────────────────

interface IotDeviceDetailProps {
  deviceId: string;
  farmId: string;
  onBack: () => void;
  onEdit?: (device: IotDeviceResType) => void;
}

export default function IotDeviceDetail({
  deviceId,
  farmId,
  onBack,
  onEdit,
}: IotDeviceDetailProps) {
  const [show, setShow] = useState(false);
  const [confirmLock, setConfirmLock] = useState(false);
  const [deleteSensorTarget, setDeleteSensorTarget] =
    useState<SensorResType | null>(null);

  const { data: deviceData, isLoading: deviceLoading } =
    useOwnerIotDeviceDetail(deviceId, farmId);
  const device = deviceData?.data;

  const isBoard = device?.deviceType === "board_module";

  const { data: sensorsData, isLoading: sensorsLoading } = useOwnerListSensors(
    deviceId,
    { page: 1, limit: 100 },
    isBoard,
  );
  const sensors = sensorsData?.data?.data ?? [];

  const lockMutation = useOwnerLockSensors();
  const deleteSensorMutation = useOwnerDeleteSensor();

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  if (deviceLoading || !device) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const sMeta = STATUS_META[device.status] ?? STATUS_META.inactive;
  const SIcon = sMeta.icon;
  const DIcon = DEVICE_TYPE_ICON[device.deviceType] ?? Cpu;
  const dtLabel = DEVICE_TYPE_LABEL[device.deviceType] ?? device.deviceType;

  const canLock = isBoard && !device.sensorsLockedAt && sensors.length === 4;
  const sensorTypeSet = new Set(sensors.map((s) => s.sensorType));
  const hasAll4Types =
    sensorTypeSet.has("soil_moisture") &&
    sensorTypeSet.has("air_temperature") &&
    sensorTypeSet.has("air_humidity") &&
    sensorTypeSet.has("light_intensity");
  const lockReady = canLock && hasAll4Types;

  return (
    <div
      className={`space-y-5 transition-all duration-300 ease-out ${show ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"}`}
    >
      {/* Header */}
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
        <h2 className="text-lg font-semibold">{device.deviceName}</h2>
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${sMeta.className}`}
        >
          <SIcon className="h-3 w-3" />
          {sMeta.label}
        </span>
        {device.sensorsLockedAt && (
          <Badge className="gap-1 bg-blue-600">
            <Lock className="h-3 w-3" />
            Cảm biến đã khóa
          </Badge>
        )}
        {onEdit && (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={() => onEdit(device)}
          >
            Chỉnh sửa
          </Button>
        )}
      </div>

      {/* Device info */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin thiết bị</CardTitle>
          <CardDescription>Chi tiết cấu hình thiết bị IoT.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoRow
              label="Tên thiết bị"
              value={device.deviceName}
            />
            <InfoRow
              label="Loại thiết bị"
              value={
                <span className="flex items-center gap-1.5">
                  <DIcon className="h-4 w-4 text-muted-foreground" />
                  {dtLabel}
                </span>
              }
            />
            <InfoRow
              label="Trạng thái"
              value={
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${sMeta.className}`}
                >
                  <SIcon className="h-3 w-3" />
                  {sMeta.label}
                </span>
              }
            />
            <InfoRow
              label="MAC Address"
              value={
                device.macAddress ? (
                  <span className="font-mono">{device.macAddress}</span>
                ) : (
                  "—"
                )
              }
            />
            {device.iotDeviceBoardId && (
              <InfoRow
                label="Board ID"
                value={
                  <span className="font-mono">
                    {device.iotDeviceBoardId.slice(0, 8)}…
                  </span>
                }
              />
            )}
            <InfoRow
              label="Cài đặt lúc"
              value={
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {new Date(device.installedAt).toLocaleDateString("vi-VN")}
                </span>
              }
            />
            {device.lastSeenAt && (
              <InfoRow
                label="Lần cuối hoạt động"
                value={new Date(device.lastSeenAt).toLocaleString("vi-VN")}
              />
            )}
            <InfoRow
              label="Cập nhật lúc"
              value={new Date(device.updatedAt).toLocaleDateString("vi-VN")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sensors section (only for board_module) */}
      {isBoard && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Cảm biến ({sensors.length}/4)</CardTitle>
                <CardDescription>
                  Board module cần đúng 4 cảm biến (mỗi loại 1) để khóa.
                </CardDescription>
              </div>
              {lockReady && (
                <Button
                  size="sm"
                  onClick={() => setConfirmLock(true)}
                  disabled={lockMutation.isPending}
                >
                  {lockMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="mr-2 h-4 w-4" />
                  )}
                  Khóa cảm biến
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {sensorsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : sensors.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground">
                Chưa có cảm biến nào. Thêm cảm biến từ form chỉnh sửa.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {sensors.map((sensor) => {
                  const meta =
                    SENSOR_TYPE_META[sensor.sensorType] ??
                    SENSOR_TYPE_META.soil_moisture;
                  const Icon = meta.icon;
                  const sStatus =
                    SENSOR_STATUS_META[sensor.status] ??
                    SENSOR_STATUS_META.inactive;

                  return (
                    <div
                      key={sensor.id}
                      className="rounded-lg border bg-background p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">
                            {meta.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${sStatus.className}`}
                          >
                            {sStatus.label}
                          </span>
                          {!device.sensorsLockedAt && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => setDeleteSensorTarget(sensor)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>
                          Min: {sensor.minValue} {meta.unit}
                        </span>
                        <span>
                          Max: {sensor.maxValue} {meta.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lock sensors confirmation */}
      <ConfirmDialog
        open={confirmLock}
        title="Khóa cảm biến?"
        description="Sau khi khóa, bạn không thể thêm/xóa cảm biến trên board này. Bạn có chắc chắn?"
        confirmLabel="Khóa"
        cancelLabel="Hủy"
        onCancel={() => setConfirmLock(false)}
        onConfirm={() => {
          setConfirmLock(false);
          lockMutation.mutate({ deviceId, farmId });
        }}
      />

      {/* Delete sensor confirmation */}
      <ConfirmDialog
        open={!!deleteSensorTarget}
        title="Xóa cảm biến?"
        description={`Xóa cảm biến "${SENSOR_TYPE_META[deleteSensorTarget?.sensorType ?? ""]?.label ?? ""}" khỏi board?`}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="destructive"
        onCancel={() => setDeleteSensorTarget(null)}
        onConfirm={() => {
          if (deleteSensorTarget) {
            deleteSensorMutation.mutate({
              sensorId: deleteSensorTarget.id,
              iotDeviceId: deviceId,
            });
          }
          setDeleteSensorTarget(null);
        }}
      />
    </div>
  );
}

// ── Helper ─────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
