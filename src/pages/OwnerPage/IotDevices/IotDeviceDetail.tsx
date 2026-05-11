import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  ChevronDown,
  Cpu,
  Pencil,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  useAdminIotDeviceDetail,
  useManagerIotDeviceDetail,
  useOwnerIotDeviceDetail,
} from "@/queries/useIotDevice";
import type { IotDeviceDetailResType } from "@/schemaValidatation/iotDevice";
import {
  DEVICE_TYPE_ICON,
  DEVICE_TYPE_LABEL,
  SENSOR_STATUS_LABEL,
  SENSOR_TYPE_LABEL,
  STATUS_META,
} from "@/constants/iotDeviceDisplay";
import { DeviceLogCard } from "./IotDeviceLogCard";

type IotActor = "owner" | "manager" | "admin";

interface IotDeviceDetailProps {
  deviceId: string;
  farmId: string;
  onBack: () => void;
  onEdit?: () => void;
  actor?: IotActor;
}

export default function IotDeviceDetail({
  deviceId,
  farmId,
  onBack,
  onEdit,
  actor = "owner",
}: IotDeviceDetailProps) {
  const [show, setShow] = useState(false);

  const adminDeviceQuery = useAdminIotDeviceDetail(deviceId, actor === "admin");
  const ownerDeviceQuery = useOwnerIotDeviceDetail(deviceId, farmId, actor === "owner");
  const managerDeviceQuery = useManagerIotDeviceDetail(deviceId, farmId, actor === "manager");

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
  const deviceError =
    actor === "admin"
      ? adminDeviceQuery.isError
      : actor === "owner"
        ? ownerDeviceQuery.isError
        : managerDeviceQuery.isError;

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
    if (deviceError) {
      return (
        <div className="flex flex-col items-center gap-3 py-12 text-center text-destructive">
          <AlertCircle className="h-6 w-6" />
          <p className="text-sm">Không thể tải thông tin thiết bị. Thử lại sau.</p>
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const sMeta = STATUS_META[device.status] ?? STATUS_META.available;
  const SIcon = sMeta.icon;
  const DIcon = DEVICE_TYPE_ICON[device.deviceType] ?? Cpu;
  const dtLabel = DEVICE_TYPE_LABEL[device.deviceType] ?? device.deviceType;
  const statusLabel = actor === "admin" ? sMeta.labelAdmin : sMeta.labelUser;

  return (
    <div
      className={`space-y-5 transition-all duration-300 ease-out ${show ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"}`}
    >
      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      {/*
        Lý do: Thanh tiêu đề phải trả lời 3 câu hỏi tức thì —
          "Đây là thiết bị gì?" (tên + icon loại)
          "Trạng thái hiện tại?" (badge trạng thái có màu)
          "Tôi có thể làm gì?" (nút Quay lại / Chỉnh sửa)
        Giữ tất cả trong một hàng ngang → không cần scroll để thấy nút Edit.
        Admin cũng thấy ngay badge "Đã gán / Chưa gán" mà không cần vào card.
      */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <div className="h-4 w-px bg-border" />
        <DIcon className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">{device.deviceName}</h2>
        <span
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${sMeta.badgeClass}`}
        >
          <SIcon className="h-3 w-3" />
          {statusLabel}
        </span>

        {actor === "admin" && (
          <div className="ml-auto flex items-center gap-2">
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
            {onEdit && (
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Chỉnh sửa
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Info card ──────────────────────────────────────────────────────── */}
      {/*
        Lý do tách "Phần cứng" vs "Phân bổ":
          Hardware (board ID, MAC, loại, ngày cài) = thông tin tĩnh, ít thay đổi,
          liên quan kỹ thuật viên hoặc lúc troubleshoot.
          Phân bổ (owner, farm) = thông tin vận hành, thay đổi khi thiết bị được
          tái gán. Tách thành 2 nhóm giúp admin tìm đúng thông tin nhanh hơn.

        Đã bỏ InfoRow "Tên thiết bị" (đã có ở h2 header — hiện 2 lần = thừa),
        "Trạng thái" (đã có badge header), "Nhật ký mới nhất" (đã có DeviceLogCard).
      */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin thiết bị</CardTitle>
          <CardDescription>Chi tiết cấu hình Iot kit đã gán.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Phần cứng */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Phần cứng
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoRow
                label="Loại thiết bị"
                value={
                  <span className="flex items-center gap-1.5">
                    <DIcon className="h-4 w-4 text-muted-foreground" />
                    {dtLabel}
                  </span>
                }
              />
              {device.iotDeviceBoardId && (
                <InfoRow
                  label="Mã bo mạch"
                  value={<span className="font-mono">{device.iotDeviceBoardId}</span>}
                />
              )}
              {device.macAddress && (
                <InfoRow
                  label="Địa chỉ MAC"
                  value={<span className="font-mono">{device.macAddress}</span>}
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
            </div>
          </div>

          {/* Phân bổ */}
          <div className="border-t pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Phân bổ
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoRow
                label="Chủ trang trại"
                value={
                  device.owner ? (
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${STATUS_META.purchase.badgeClass}`}
                    >
                      {device.owner.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Chưa gán</span>
                  )
                }
              />
              <InfoRow
                label="Nông trại"
                value={
                  device.farm
                    ? `${device.farm.name} (${device.farm.code})`
                    : <span className="text-muted-foreground">Chưa gán</span>
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Admin: nhật ký ngay sau thông tin chính ────────────────────────── */}
      {/*
        Lý do đặt nhật ký trước sensors/sub-devices với admin:
          Admin vào trang chi tiết chủ yếu để điều tra sự cố hoặc kiểm tra
          lịch sử hoạt động. Hardware details (sensors, sub-devices) ít khi
          cần xem ngay. Đưa logs lên sớm = bớt scroll cho tác vụ phổ biến nhất.
          Owner/Manager không thấy logs nên thứ tự không ảnh hưởng họ.
      */}
      {actor === "admin" && <DeviceLogCard deviceId={deviceId} />}

      {/* ── Cảm biến ───────────────────────────────────────────────────────── */}
      {/*
        Lý do dùng Collapsible defaultOpen:
          Sensors là thông tin kỹ thuật quan trọng nhưng dài (có thể tới 4 cảm biến,
          mỗi cái có ngưỡng min/max). defaultOpen = user thấy ngay khi cần,
          nhưng có thể thu gọn để focus vào logs hoặc sub-devices.
          ChevronDown animate phản hồi trạng thái open/close tức thì.
      */}
      <Collapsible defaultOpen>
        <Card>
          <CollapsibleTrigger className="w-full text-left">
            <CardHeader className="hover:bg-muted/30 transition-colors rounded-t-xl">
              <CardTitle className="flex items-center justify-between">
                <span>Cảm biến trên bo mạch ({device.sensors.length}/4)</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 in-data-[state=open]:rotate-180" />
              </CardTitle>
              <CardDescription>
                Cảm biến được trả trực tiếp từ chi tiết gán Iot kit. Không thể chỉnh sửa từ trang này.
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {device.sensors.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có cảm biến.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {device.sensors.map((sensor) => (
                    <SensorCard key={sensor.id} sensor={sensor} />
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ── Thiết bị con ───────────────────────────────────────────────────── */}
      {/*
        Lý do đặt sub-devices sau sensors:
          Sub-devices (WiFi/LoRa module) phụ thuộc vào main board — xem main board
          trước cho đúng context. Collapsible giảm clutter khi không cần xem chi tiết.
      */}
      <Collapsible defaultOpen>
        <Card>
          <CollapsibleTrigger className="w-full text-left">
            <CardHeader className="hover:bg-muted/30 transition-colors rounded-t-xl">
              <CardTitle className="flex items-center justify-between">
                <span>Thiết bị con ({device.subDevices.length})</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 in-data-[state=open]:rotate-180" />
              </CardTitle>
              <CardDescription>WiFi/LoRa được liên kết cùng board module.</CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {device.subDevices.length === 0 ? (
                <p className="text-sm text-muted-foreground">Không có thiết bị con.</p>
              ) : (
                <div className="space-y-3">
                  {device.subDevices.map((sub) => (
                    <SubDeviceCard key={sub.id} device={sub} actor={actor} />
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
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
    <div className="space-y-2 rounded-lg border bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant="outline">{status}</Badge>
      </div>
      <div className="text-xs text-muted-foreground">
        Ngưỡng: {sensor.minValue} – {sensor.maxValue}
      </div>
    </div>
  );
}

function SubDeviceCard({
  device,
  actor,
}: {
  device: IotDeviceDetailResType["subDevices"][number];
  actor: IotActor;
}) {
  const DIcon = useMemo(
    () => DEVICE_TYPE_ICON[device.deviceType] ?? Cpu,
    [device.deviceType],
  );
  const sMeta = STATUS_META[device.status] ?? STATUS_META.available;
  const SIcon = sMeta.icon;
  const statusLabel = actor === "admin" ? sMeta.labelAdmin : sMeta.labelUser;

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
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${sMeta.badgeClass}`}
          >
            <SIcon className="h-3 w-3" />
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Cài đặt: </span>
        {new Date(device.installedAt).toLocaleDateString("vi-VN")}
      </div>

      {device.deviceType === "wifi_module" && device.macAddress && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Địa chỉ MAC: </span>
          <span className="font-mono">{device.macAddress}</span>
        </div>
      )}

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
                title={`Ngưỡng: ${s.minValue} – ${s.maxValue}`}
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
