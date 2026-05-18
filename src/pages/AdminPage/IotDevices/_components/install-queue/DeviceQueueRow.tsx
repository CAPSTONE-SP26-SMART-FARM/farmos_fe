import { Link } from "react-router";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { InstallQueueDeviceType } from "@/schemaValidatation/iotDeviceAdminOps";
import {
  AGE_THRESHOLD_DANGER,
  AGE_THRESHOLD_WARNING,
} from "./constants";

interface Props {
  device: InstallQueueDeviceType;
  checked: boolean;
  onToggle: () => void;
}

function ageClass(ageDays: number) {
  if (ageDays >= AGE_THRESHOLD_DANGER) return "text-destructive";
  if (ageDays >= AGE_THRESHOLD_WARNING)
    return "text-amber-600 dark:text-amber-400";
  return "text-muted-foreground";
}

export function DeviceQueueRow({ device, checked, onToggle }: Props) {
  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-3 px-3 py-2 text-sm transition",
        checked && "bg-primary/5",
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        aria-label={`Chọn thiết bị ${device.label}`}
      />
      <Link
        to={`/dashboard/admin/iot-devices/${device.id}/decision`}
        className="font-medium tabular-nums underline-offset-2 hover:underline focus-visible:underline outline-none"
        aria-label={`Mở trang quyết định cho thiết bị ${device.label}`}
      >
        {device.label}
      </Link>
      <span className="text-muted-foreground">·</span>
      <span>{device.ownerName}</span>
      <span className="text-muted-foreground">·</span>
      <span className={cn("font-medium", ageClass(device.ageDays))}>
        chờ {device.ageDays} ngày
      </span>
      {device.kitName && (
        <Badge
          variant="outline"
          className="ml-auto gap-1"
        >
          <Package
            className="h-3 w-3"
            aria-hidden
          />
          {device.kitName}
        </Badge>
      )}
    </li>
  );
}
