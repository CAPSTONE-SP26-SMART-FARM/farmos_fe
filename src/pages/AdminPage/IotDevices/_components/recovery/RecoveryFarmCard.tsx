import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  RecoveryFarmType,
  RecoveryZoneType,
} from "@/schemaValidatation/iotDeviceAdminOps";
import { RecoveryZoneSection } from "./RecoveryZoneSection";

interface Props {
  farm: RecoveryFarmType;
  selectedIds: Set<string>;
  defaultOpen?: boolean;
  onToggleFarm: () => void;
  onToggleZone: (zone: RecoveryZoneType) => void;
  onToggleDevice: (id: string) => void;
}

function overdueClass(days: number) {
  if (days >= 30) return "text-destructive";
  if (days >= 14) return "text-amber-600 dark:text-amber-400";
  return "text-muted-foreground";
}

export function RecoveryFarmCard({
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
                overdueClass(farm.oldestOverdueDays),
              )}
            >
              <Clock
                className="h-3 w-3"
                aria-hidden
              />
              quá hạn {farm.oldestOverdueDays} ngày
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
            {farm.ownerPhone ? (
              <Button
                asChild
                variant="link"
                size="sm"
                className="h-auto px-1 py-0 text-xs"
              >
                <a href={`tel:${farm.ownerPhone}`}>
                  <Phone
                    className="mr-1 h-3 w-3"
                    aria-hidden
                  />
                  {farm.ownerPhone}
                </a>
              </Button>
            ) : (
              <Badge
                variant="outline"
                className="text-xs"
              >
                Không có SĐT
              </Badge>
            )}
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
              <RecoveryZoneSection
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
