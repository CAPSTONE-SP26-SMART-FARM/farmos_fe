import { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Clock,
  MapPin,
  Sprout,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { formatRelativeVi } from "@/lib/format";
import type { InstallQueueZoneType } from "@/schemaValidatation/iotDeviceAdminOps";
import {
  AGE_THRESHOLD_DANGER,
  AGE_THRESHOLD_WARNING,
} from "./constants";

interface Props {
  zone: InstallQueueZoneType;
  selectedIds: Set<string>;
  onToggleZone: () => void;
  onToggleDevice: (id: string) => void;
}

function oldestAgeClass(ageDays: number) {
  if (ageDays >= AGE_THRESHOLD_DANGER) return "text-destructive";
  if (ageDays >= AGE_THRESHOLD_WARNING)
    return "text-amber-600 dark:text-amber-400";
  return "text-muted-foreground";
}

export function InstallZoneSection({
  zone,
  selectedIds,
  onToggleZone,
  onToggleDevice,
}: Props) {
  const [devicesOpen, setDevicesOpen] = useState(false);

  const deviceIds = zone.devices.map((d) => d.id);
  const selectedInZone = deviceIds.filter((id) => selectedIds.has(id)).length;
  const allSelected =
    deviceIds.length > 0 && selectedInZone === deviceIds.length;
  const someSelected = selectedInZone > 0 && !allSelected;

  return (
    <div
      className={cn(
        "rounded-md border bg-muted/30 p-3",
        zone.isUnzoned && "border-amber-300 bg-amber-50/40",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Checkbox
          checked={allSelected ? true : someSelected ? "indeterminate" : false}
          onCheckedChange={onToggleZone}
          aria-label={`Chọn toàn bộ thiết bị của ${zone.zoneName ?? "khu chưa gán"}`}
        />
        {zone.isUnzoned ? (
          <AlertTriangle
            className="h-4 w-4 text-amber-600"
            aria-hidden
          />
        ) : (
          <MapPin
            className="h-4 w-4 text-muted-foreground"
            aria-hidden
          />
        )}
        <span className="font-medium">
          {zone.zoneName ?? "Chưa gán khu vực"}
        </span>
        <Badge variant="secondary">{zone.totalDevices} bộ</Badge>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs",
            oldestAgeClass(zone.oldestAgeDays),
          )}
        >
          <Clock
            className="h-3 w-3"
            aria-hidden
          />
          chờ {zone.oldestAgeDays} ngày
        </span>
      </div>

      {zone.cropSeasonContext.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2 pl-7 text-xs text-muted-foreground">
          <Sprout
            className="h-3 w-3 text-emerald-600"
            aria-hidden
          />
          {zone.cropSeasonContext.map((cs) => (
            <span key={cs.cropSeasonId}>
              <strong className="text-foreground">{cs.cropSeasonName}</strong>
              {cs.milestoneName ? ` · ${cs.milestoneName}` : ""}
              {cs.approvedAt
                ? ` · duyệt ${formatRelativeVi(cs.approvedAt)}`
                : ""}
            </span>
          ))}
        </div>
      )}

      {zone.kitBreakdown.length > 0 && (
        <ul className="mt-2 space-y-1 pl-7 text-sm">
          {zone.kitBreakdown.map((kit) => (
            <li
              key={kit.kitId ?? kit.kitName}
              className="flex items-center gap-2"
            >
              <span>•</span>
              <span>{kit.kitName}</span>
              <Badge
                variant="outline"
                className="font-mono"
              >
                × {kit.count}
              </Badge>
              {kit.estimatedInstallMinutes != null && (
                <span className="text-xs text-muted-foreground">
                  ~ {kit.estimatedInstallMinutes} phút
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <Collapsible
        open={devicesOpen}
        onOpenChange={setDevicesOpen}
      >
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 ml-5 h-7 px-2 text-xs"
          >
            {devicesOpen ? (
              <ChevronDown
                className="mr-1 h-3 w-3"
                aria-hidden
              />
            ) : (
              <ChevronRight
                className="mr-1 h-3 w-3"
                aria-hidden
              />
            )}
            {devicesOpen
              ? "Ẩn mã thiết bị"
              : `Xem mã thiết bị (${zone.totalDevices})`}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="mt-2 ml-7 divide-y rounded-md border bg-background">
            {zone.devices.map((d) => (
              <li
                key={d.id}
                className="flex items-center gap-2 px-3 py-2 text-sm"
              >
                <Checkbox
                  checked={selectedIds.has(d.id)}
                  onCheckedChange={() => onToggleDevice(d.id)}
                  aria-label={`Chọn thiết bị ${d.label ?? d.id.slice(0, 8)}`}
                />
                <span className="font-mono font-medium">
                  {d.label ?? d.id.slice(0, 8)}
                </span>
                {d.kitName ? (
                  <span className="text-xs text-muted-foreground">
                    · {d.kitName}
                  </span>
                ) : null}
                {d.orderNumber ? (
                  <span className="ml-auto text-xs text-muted-foreground">
                    đơn {d.orderNumber}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
