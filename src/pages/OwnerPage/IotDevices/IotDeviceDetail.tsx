import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  CircuitBoard,
  Cpu,
  Power,
  PowerOff,
  Radio,
  ShieldOff,
  Wifi,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  useAdminIotDeviceDetail,
  useManagerIotDeviceDetail,
  useOwnerIotDeviceDetail,
} from "@/queries/useIotDevice";
import type { IotDeviceDetailResType } from "@/schemaValidatation/iotDevice";

type IotActor = "owner" | "manager" | "admin";

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
  retired: {
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
  board_module: "Bo mạch",
  lora_module: "Mô-đun LoRa",
  wifi_module: "Mô-đun WiFi",
};

const SENSOR_TYPE_LABEL: Record<string, string> = {
  soil_moisture: "Độ ẩm đất",
  air_temperature: "Nhiệt độ không khí",
  air_humidity: "Độ ẩm không khí",
  light_intensity: "Cường độ sáng",
};

const SENSOR_STATUS_LABEL: Record<string, string> = {
  active: "Hoạt động",
  inactive: "Tắt",
  calibrating: "Hiệu chuẩn",
};

interface IotDeviceDetailProps {
  deviceId: string;
  farmId: string;
  onBack: () => void;
  actor?: IotActor;
}

export default function IotDeviceDetail({
  deviceId,
  farmId,
  onBack,
  actor = "owner",
}: IotDeviceDetailProps) {
  const [show, setShow] = useState(false);

  const adminDeviceQuery = useAdminIotDeviceDetail(deviceId, actor === "admin");

  const ownerDeviceQuery = useOwnerIotDeviceDetail(
    deviceId,
    farmId,
    actor === "owner",
  );
  const managerDeviceQuery = useManagerIotDeviceDetail(
    deviceId,
    farmId,
    actor === "manager",
  );

  const deviceData =
    actor === "admin"
      ? adminDeviceQuery.data
      : actor === "owner"
        ? ownerDeviceQuery.data
        : managerDeviceQuery.data;
  const deviceLoading =
    actor === "admin"
      ? adminDeviceQuery.isLoading
      : actor === "owner"
        ? ownerDeviceQuery.isLoading
        : managerDeviceQuery.isLoading;
  const device = deviceData?.data;

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
        <h2 className="text-lg font-semibold">{device.deviceName}</h2>
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${sMeta.className}`}
        >
          <SIcon className="h-3 w-3" />
          {sMeta.label}
        </span>

        {actor === "admin" && (
          <div className="ml-auto">
            {device.owner ? (
              <Badge
                variant="outline"
                className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              >
                Đã gán: {device.owner.name}
                {device.farm ? ` · ${device.farm.name}` : ""}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
              >
                Chưa gán Chủ trang trại
              </Badge>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin thiết bị</CardTitle>
          <CardDescription>
            Chi tiết cấu hình Iot kit đã gán.
          </CardDescription>
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
            {device.iotDeviceBoardId && (
              <InfoRow
                label="Mã bo mạch"
                value={
                  <span className="font-mono">{device.iotDeviceBoardId}</span>
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
            <InfoRow
              label="Chủ trang trại"
              value={
                device.owner ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    {device.owner.name}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Chưa gán Chủ trang trại</span>
                )
              }
            />
            <InfoRow
              label="Nông trại"
              value={
                device.farm
                  ? `${device.farm.name} (${device.farm.code})`
                  : "Chưa gán nông trại"
              }
            />
            {device.latestLog && (
              <InfoRow
                label="Nhật ký mới nhất"
                value={`${device.latestLog.action} - ${new Date(device.latestLog.createdAt).toLocaleString("vi-VN")}`}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cảm biến trên bo mạch ({device.sensors.length})</CardTitle>
          <CardDescription>
            Cảm biến được trả trực tiếp từ chi tiết gán Iot kit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {device.sensors.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có cảm biến.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {device.sensors.map((sensor) => (
                <SensorCard
                  key={sensor.id}
                  sensor={sensor}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thiết bị con ({device.subDevices.length})</CardTitle>
          <CardDescription>
            WiFi/LoRa được liên kết cùng board module.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {device.subDevices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Không có thiết bị con.
            </p>
          ) : (
            <div className="space-y-3">
              {device.subDevices.map((sub) => (
                <SubDeviceCard
                  key={sub.id}
                  device={sub}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SensorCard({
  sensor,
}: {
  sensor: IotDeviceDetailResType["sensors"][number];
}) {
  const label = SENSOR_TYPE_LABEL[sensor.sensorType] ?? sensor.sensorType;
  const status = SENSOR_STATUS_LABEL[sensor.status] ?? sensor.status;

  return (
    <div className="rounded-lg border bg-background p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant="outline">{status}</Badge>
      </div>
      <div className="text-xs text-muted-foreground">
        Nhỏ nhất: {sensor.minValue} | Lớn nhất: {sensor.maxValue}
      </div>
    </div>
  );
}

function SubDeviceCard({
  device,
}: {
  device: IotDeviceDetailResType["subDevices"][number];
}) {
  const DIcon = useMemo(
    () => DEVICE_TYPE_ICON[device.deviceType] ?? Cpu,
    [device.deviceType],
  );
  const sMeta = STATUS_META[device.status] ?? STATUS_META.inactive;
  const SIcon = sMeta.icon;

  return (
    <div className="space-y-3 rounded-lg border bg-background p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <DIcon className="h-4 w-4 text-primary" />
          <span className="font-medium">{device.deviceName}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Badge variant="outline">
            {DEVICE_TYPE_LABEL[device.deviceType] ?? device.deviceType}
          </Badge>
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${sMeta.className}`}
          >
            <SIcon className="h-3 w-3" />
            {sMeta.label}
          </span>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Cài đặt: </span>
        {new Date(device.installedAt).toLocaleDateString("vi-VN")}
      </div>

      {device.sensors.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Cảm biến ({device.sensors.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {device.sensors.map((s) => (
              <Badge
                key={s.id}
                variant="outline"
                className="gap-1 text-[10px]"
                title={`${s.minValue} – ${s.maxValue}`}
              >
                {SENSOR_TYPE_LABEL[s.sensorType] ?? s.sensorType}
                <span className="text-muted-foreground">
                  · {SENSOR_STATUS_LABEL[s.status] ?? s.status}
                </span>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
