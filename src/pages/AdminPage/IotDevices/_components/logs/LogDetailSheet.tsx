import { useNavigate } from "react-router";
import {
  AlertTriangle,
  ArrowRight,
  Cpu,
  ExternalLink,
  MapPin,
  User as UserIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DEVICE_TYPE_ICON,
  DEVICE_TYPE_LABEL,
  IOT_ACTION_BADGE_CLASS,
  IOT_ACTION_LABEL,
  STATUS_META,
} from "@/constants/iotDeviceDisplay";
import { formatDateTimeVi } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { IotDeviceLogResType } from "@/schemaValidatation/iotDevice";
import { deviceDisplayName, parseReason, shortId } from "./reasonParser";
import { LogDetailRow } from "./LogDetailRow";

interface Props {
  log: IotDeviceLogResType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogDetailSheet({ log, open, onOpenChange }: Props) {
  const navigate = useNavigate();

  if (!log) return null;

  const actionLabel = IOT_ACTION_LABEL[log.action] ?? log.action;
  const actionClass =
    IOT_ACTION_BADGE_CLASS[log.action] ??
    "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";

  const deviceMeta = log.device ? STATUS_META[log.device.status] : null;
  const DeviceIcon = log.device
    ? (DEVICE_TYPE_ICON[log.device.deviceType] ?? Cpu)
    : Cpu;
  const parsed = parseReason(log.reason);
  const deviceName = deviceDisplayName(log.device, log.deviceId);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent className="w-full overflow-y-auto p-5 sm:max-w-md">
        <SheetHeader className="px-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                actionClass,
              )}
            >
              {actionLabel}
            </span>
          </div>
          <SheetTitle className="text-lg">{deviceName}</SheetTitle>
          <SheetDescription>{formatDateTimeVi(log.createdAt)}</SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          {parsed && (
            <section className="rounded-lg border bg-amber-50/60 p-3 dark:bg-amber-950/30">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                Diễn biến
              </p>
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle
                  className="h-4 w-4 text-amber-600"
                  aria-hidden
                />
                <span className="font-medium">{parsed.typeLabel}</span>
                {parsed.toStatus && (
                  <>
                    <ArrowRight
                      className="h-3.5 w-3.5"
                      aria-hidden
                    />
                    <span className="font-medium">{parsed.toStatus}</span>
                  </>
                )}
              </div>
              {parsed.sensorId && (
                // BE-TODO: response chưa expose sensorType + position của sensor
                // gây ra lỗi → tạm hiện sensor ID dạng short + tooltip.
                <p className="mt-1 text-xs text-muted-foreground">
                  Sensor ID:{" "}
                  <code
                    className="rounded bg-background px-1 py-0.5 font-mono text-[11px]"
                    title={parsed.sensorId}
                  >
                    {shortId(parsed.sensorId)}
                  </code>
                </p>
              )}
            </section>
          )}

          {log.device && (
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Thiết bị
              </p>
              <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <DeviceIcon
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <p className="truncate font-medium">{deviceName}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 text-xs"
                    onClick={() => {
                      navigate(
                        `/dashboard/admin/iot-devices/${log.device!.id}/decision`,
                      );
                      onOpenChange(false);
                    }}
                  >
                    Xem thiết bị
                    <ExternalLink
                      className="h-3 w-3"
                      aria-hidden
                    />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge
                    variant="outline"
                    className="text-xs"
                  >
                    {DEVICE_TYPE_LABEL[log.device.deviceType] ??
                      log.device.deviceType}
                  </Badge>
                  {deviceMeta && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
                        deviceMeta.badgeClass,
                      )}
                    >
                      <deviceMeta.icon
                        className="h-3 w-3"
                        aria-hidden
                      />
                      {deviceMeta.labelAdmin}
                    </span>
                  )}
                </div>
              </div>
            </section>
          )}

          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Người thực hiện
            </p>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
              <UserIcon
                className="h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              {log.performer ? (
                <div className="min-w-0">
                  <p className="font-medium leading-tight">
                    {log.performer.fullName ?? "Không rõ"}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {log.performer.role}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Hệ thống tự động
                </p>
              )}
            </div>
          </section>

          <Separator />

          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Chi tiết kỹ thuật
            </p>
            <div className="space-y-2.5 rounded-lg border bg-muted/20 p-3 text-sm">
              {parsed && parsed.type !== "unknown" && (
                <LogDetailRow
                  label="Loại lý do"
                  value={
                    <code className="rounded bg-background px-1 py-0.5 font-mono text-[12px]">
                      {parsed.type}
                    </code>
                  }
                />
              )}
              {log.zoneIdSnapshot && (
                // BE-TODO: zoneIdSnapshot chỉ là UUID, chưa có zoneNameSnapshot.
                <LogDetailRow
                  label="Mã zone tại thời điểm"
                  value={
                    <span
                      className="inline-flex items-center gap-1"
                      title={log.zoneIdSnapshot}
                    >
                      <MapPin
                        className="h-3 w-3"
                        aria-hidden
                      />
                      <code className="rounded bg-background px-1 py-0.5 font-mono text-[12px]">
                        {shortId(log.zoneIdSnapshot)}
                      </code>
                    </span>
                  }
                />
              )}
              <LogDetailRow
                label="Thời gian"
                value={formatDateTimeVi(log.createdAt)}
              />
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
