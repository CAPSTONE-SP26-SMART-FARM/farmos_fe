import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  MapPin,
  Package,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type {
  InstallQueueFarmType,
  InstallQueueZoneType,
} from "@/schemaValidatation/iotDeviceAdminOps";
import { InstallZoneSection } from "./InstallZoneSection";
import {
  AGE_THRESHOLD_DANGER,
  AGE_THRESHOLD_WARNING,
} from "./constants";

interface Props {
  farm: InstallQueueFarmType;
  selectedIds: Set<string>;
  defaultOpen?: boolean;
  onToggleFarm: () => void;
  onToggleZone: (zone: InstallQueueZoneType) => void;
  onToggleDevice: (id: string) => void;
}

function oldestAgeClass(ageDays: number) {
  if (ageDays >= AGE_THRESHOLD_DANGER) return "text-destructive";
  if (ageDays >= AGE_THRESHOLD_WARNING)
    return "text-amber-600 dark:text-amber-400";
  return "text-muted-foreground";
}

export function InstallFarmCard({
  farm,
  selectedIds,
  defaultOpen = true,
  onToggleFarm,
  onToggleZone,
  onToggleDevice,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const farmDeviceIds = farm.zones.flatMap((z) => z.devices.map((d) => d.id));
  const selectedInFarm = farmDeviceIds.filter((id) => selectedIds.has(id)).length;
  const allSelected =
    farmDeviceIds.length > 0 && selectedInFarm === farmDeviceIds.length;
  const someSelected = selectedInFarm > 0 && !allSelected;

  return (
    <Card>
      <Collapsible
        open={open}
        onOpenChange={setOpen}
      >
        <CardHeader className="space-y-2 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <Checkbox
              checked={
                allSelected ? true : someSelected ? "indeterminate" : false
              }
              onCheckedChange={onToggleFarm}
              aria-label={`Chọn toàn bộ thiết bị tại ${farm.farmName}`}
            />
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-auto flex-1 justify-start gap-2 px-2 py-1 font-normal hover:bg-transparent"
                aria-label={open ? "Thu gọn nông trại" : "Mở rộng nông trại"}
              >
                {open ? (
                  <ChevronDown
                    className="h-4 w-4"
                    aria-hidden
                  />
                ) : (
                  <ChevronRight
                    className="h-4 w-4"
                    aria-hidden
                  />
                )}
                <Package
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden
                />
                <CardTitle className="text-base">
                  {farm.farmName}
                  {farm.farmCode ? (
                    <span className="ml-2 font-mono text-sm font-normal text-muted-foreground">
                      {farm.farmCode}
                    </span>
                  ) : null}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({farm.totalDevices} bộ)
                  </span>
                </CardTitle>
              </Button>
            </CollapsibleTrigger>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs",
                oldestAgeClass(farm.oldestAgeDays),
              )}
            >
              <Clock
                className="h-3 w-3"
                aria-hidden
              />
              chờ lâu nhất {farm.oldestAgeDays} ngày
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pl-7 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User
                className="h-3 w-3"
                aria-hidden
              />
              {farm.ownerName}
            </span>
            {farm.address ? (
              <span className="inline-flex items-center gap-1">
                <MapPin
                  className="h-3 w-3"
                  aria-hidden
                />
                {farm.address}
              </span>
            ) : null}
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            {farm.zones.map((zone) => (
              <InstallZoneSection
                key={`${farm.farmId ?? "no-farm"}|${zone.zoneId ?? "unzoned"}`}
                zone={zone}
                selectedIds={selectedIds}
                onToggleZone={() => onToggleZone(zone)}
                onToggleDevice={onToggleDevice}
              />
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
