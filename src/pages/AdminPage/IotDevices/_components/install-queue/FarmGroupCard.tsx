import { useState } from "react";
import { ChevronDown, ChevronRight, Clock, MapPin, Package } from "lucide-react";
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
import type { InstallQueueGroupType } from "@/schemaValidatation/iotDeviceAdminOps";
import { DeviceQueueRow } from "./DeviceQueueRow";
import {
  AGE_THRESHOLD_DANGER,
  AGE_THRESHOLD_WARNING,
} from "./constants";

interface Props {
  group: InstallQueueGroupType;
  selectedIds: Set<string>;
  defaultOpen?: boolean;
  onToggleDevice: (id: string) => void;
  onToggleGroup: () => void;
}

function oldestAgeClass(ageDays: number) {
  if (ageDays >= AGE_THRESHOLD_DANGER) return "text-destructive";
  if (ageDays >= AGE_THRESHOLD_WARNING)
    return "text-amber-600 dark:text-amber-400";
  return "text-muted-foreground";
}

export function FarmGroupCard({
  group,
  selectedIds,
  defaultOpen = true,
  onToggleDevice,
  onToggleGroup,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const groupIds = group.devices.map((d) => d.id);
  const selectedInGroup = groupIds.filter((id) => selectedIds.has(id)).length;
  const allSelected = selectedInGroup === groupIds.length;
  const someSelected = selectedInGroup > 0 && !allSelected;

  return (
    <Card>
      <Collapsible
        open={open}
        onOpenChange={setOpen}
      >
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 py-3">
          <Checkbox
            checked={
              allSelected ? true : someSelected ? "indeterminate" : false
            }
            onCheckedChange={onToggleGroup}
            aria-label={`Chọn toàn bộ thiết bị của ${group.key.label}`}
          />
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              aria-label={open ? "Thu gọn nhóm" : "Mở rộng nhóm"}
              className="h-auto flex-1 justify-start gap-2 px-2 py-1 font-normal hover:bg-transparent"
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
                {group.key.label}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({group.deviceCount})
                </span>
              </CardTitle>
              {group.key.address && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin
                    className="h-3 w-3"
                    aria-hidden
                  />
                  {group.key.address}
                </span>
              )}
              <span
                className={cn(
                  "ml-auto inline-flex items-center gap-1 text-xs",
                  oldestAgeClass(group.oldestAgeDays),
                )}
              >
                <Clock
                  className="h-3 w-3"
                  aria-hidden
                />
                cũ nhất {group.oldestAgeDays} ngày
              </span>
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <ul className="divide-y rounded-md border">
              {group.devices.map((device) => (
                <DeviceQueueRow
                  key={device.id}
                  device={device}
                  checked={selectedIds.has(device.id)}
                  onToggle={() => onToggleDevice(device.id)}
                />
              ))}
            </ul>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
