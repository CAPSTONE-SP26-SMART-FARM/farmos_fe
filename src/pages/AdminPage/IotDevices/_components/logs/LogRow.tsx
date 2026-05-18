import { Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEVICE_TYPE_ICON,
  IOT_ACTION_BADGE_CLASS,
  IOT_ACTION_LABEL,
  STATUS_META,
} from "@/constants/iotDeviceDisplay";
import { formatDateVi } from "@/lib/format";
import { cn } from "@/lib/utils";
import { User as UserIcon } from "lucide-react";
import type { IotDeviceLogResType } from "@/schemaValidatation/iotDevice";
import { deviceDisplayName, parseReason } from "./reasonParser";
import { ReasonSummary } from "./ReasonSummary";

interface Props {
  log: IotDeviceLogResType;
  onClick: () => void;
}

export function LogRow({ log, onClick }: Props) {
  const actionLabel = IOT_ACTION_LABEL[log.action] ?? log.action;
  const actionClass =
    IOT_ACTION_BADGE_CLASS[log.action] ??
    "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";

  const parsed = parseReason(log.reason);
  const deviceName = deviceDisplayName(log.device, log.deviceId);
  const deviceMeta = log.device ? STATUS_META[log.device.status] : null;
  const DeviceIcon = log.device
    ? (DEVICE_TYPE_ICON[log.device.deviceType] ?? Cpu)
    : Cpu;

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      aria-label={`Mở chi tiết nhật ký ${actionLabel} của ${deviceName}`}
      className="h-auto w-full justify-start gap-3 rounded-none px-4 py-3 text-left font-normal hover:bg-muted/50"
    >
      <span
        className={cn(
          "inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-xs font-medium",
          actionClass,
        )}
      >
        {actionLabel}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <DeviceIcon
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <p className="truncate text-sm font-medium">{deviceName}</p>
          {deviceMeta && (
            <span
              className={cn(
                "shrink-0 rounded border px-1.5 py-0 text-[10px]",
                deviceMeta.badgeClass,
              )}
            >
              {deviceMeta.labelAdmin}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <UserIcon
              className="h-3 w-3"
              aria-hidden
            />
            {log.performer?.fullName ?? "Hệ thống tự động"}
          </span>
          {parsed && (
            <>
              <span aria-hidden>·</span>
              <ReasonSummary parsed={parsed} />
            </>
          )}
        </div>
      </div>

      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
        {formatDateVi(log.createdAt)}
      </span>
    </Button>
  );
}
