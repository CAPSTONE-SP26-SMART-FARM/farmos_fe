import { ChevronRight, Cpu, Layers, NotebookPen, SlidersHorizontal, Sprout, Wheat } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { TrackingLogItemType } from "@/schemaValidatation/tracking";
import { getFieldLabel, getEntityTypeLabel, formatTrackingValue } from "@/lib/tracking-display";

const ENTITY_COLOR_MAP: Record<string, string> = {
  crop_season: "bg-emerald-100 text-emerald-700",
  production_milestone: "bg-blue-100 text-blue-700",
  employee_task: "bg-amber-100 text-amber-700",
  iot_device_assignment: "bg-purple-100 text-purple-700",
  harvest_record: "bg-yellow-100 text-yellow-700",
};

const CHANGE_TYPE_MAP: Record<string, { label: string; className: string }> = {
  create: { label: "Tạo mới", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  update: { label: "Cập nhật", className: "bg-blue-50 text-blue-700 border-blue-200" },
  delete: { label: "Xóa", className: "bg-red-50 text-red-700 border-red-200" },
  snapshot: { label: "Ảnh chụp", className: "bg-muted text-muted-foreground border-border" },
};

function getEntityLogIcon(entityType: string) {
  switch (entityType) {
    case "crop_season": return Sprout;
    case "production_milestone": return Layers;
    case "employee_task": return NotebookPen;
    case "iot_device_assignment": return Cpu;
    case "harvest_record": return Wheat;
    default: return SlidersHorizontal;
  }
}

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-semibold shrink-0">
      {initials}
    </span>
  );
}

export function TrackingLogItem({ log }: { log: TrackingLogItemType }) {
  const IconComp = getEntityLogIcon(log.entityType);
  const colorClass = ENTITY_COLOR_MAP[log.entityType] ?? "bg-muted text-muted-foreground";
  const changeInfo = CHANGE_TYPE_MAP[log.changeType] ?? CHANGE_TYPE_MAP.update;
  const oldVal = formatTrackingValue(log.oldValueJson, log.dataType, {
    entityType: log.entityType,
    fieldName: log.fieldName,
  });
  const newVal = formatTrackingValue(log.newValueJson, log.dataType, {
    entityType: log.entityType,
    fieldName: log.fieldName,
  });

  const displayName =
    log.changedByUser?.fullName ??
    log.changedByUser?.email ??
    log.changedByName ??
    log.changedBy;

  return (
    <div className="flex gap-3 rounded-lg border bg-card px-4 py-3 hover:bg-muted/20 transition-colors">
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-full shrink-0 mt-0.5", colorClass)}>
        <IconComp className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold">{getFieldLabel(log.fieldName)}</span>
            <span className="text-xs rounded-full border px-2 py-0.5 text-muted-foreground">
              {getEntityTypeLabel(log.entityType)}
            </span>
            <span className={cn("text-xs rounded-full border px-2 py-0.5", changeInfo.className)}>
              {changeInfo.label}
            </span>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
            {format(new Date(log.changedAt), "HH:mm", { locale: vi })}
          </span>
        </div>

        {(oldVal || newVal) && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {oldVal && (
              <span className="text-xs rounded px-2 py-0.5 bg-red-50 text-red-600 line-through">
                {oldVal}
              </span>
            )}
            {oldVal && newVal && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            {newVal && (
              <span className="text-xs rounded px-2 py-0.5 bg-green-50 text-green-700 font-medium">
                {newVal}
              </span>
            )}
          </div>
        )}

        {displayName && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <UserAvatar name={displayName} />
            <p className="text-xs text-muted-foreground">
              bởi{" "}
              <span className="font-medium text-foreground">{displayName}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
