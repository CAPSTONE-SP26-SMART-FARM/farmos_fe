import { cn } from "@/lib/utils";
import { STATUS_META } from "@/constants/iotDeviceDisplay";
import type { DeviceStatusType } from "@/schemaValidatation/iotDevice";

interface Props {
  status: DeviceStatusType;
  className?: string;
}

export function IotDeviceStatusBadge({ status, className }: Props) {
  const meta = STATUS_META[status];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
        meta.badgeClass,
        className,
      )}
    >
      <Icon className="h-2.5 w-2.5" aria-hidden />
      {meta.labelAdmin}
    </span>
  );
}
