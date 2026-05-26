// src/pages/OwnerPage/CropSeasons/components/TrackingTimeline.tsx
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TableSkeleton from "@/components/common/TableSkeleton";
import DatePickerField from "@/components/common/DatePickerField";
import { useTrackingLog } from "@/queries/useTracking";
import {
  getEntityTypeLabel,
  getFieldLabel,
  formatTrackingValue,
} from "@/lib/tracking-display";
import type {
  TrackingEntityType,
  TrackingLogListResType,
  TrackingLogQueryType,
} from "@/schemaValidatation/tracking";

interface TrackingTimelineProps {
  cropSeasonId: string;
  initialData?: TrackingLogListResType;
  isLoading?: boolean;
}

const ENTITY_TYPE_OPTIONS: TrackingEntityType[] = [
  "crop_season",
  "production_milestone",
  "employee_task",
  "harvest_record",
  "iot_device_assignment",
];

const PAGE_LIMIT = 20;

function isEmptyValue(v: unknown): boolean {
  return v === null || v === undefined || v === "";
}

/**
 * Render the old → new transition. Cases the BE produces:
 *  - changeType=create OR oldValue is empty → "Ghi nhận <new>" (avoids the
 *    confusing "— → <new>" pattern).
 *  - changeType=delete OR newValue is empty → "Đã xóa giá trị" (with prior
 *    value as muted hint).
 *  - changeType=snapshot → "Mốc ban đầu: <new>" (plan baseline at approve).
 *  - both old & new present → standard "<old> → <new>" arrow.
 */
function renderChange(item: {
  oldValueJson: unknown;
  newValueJson: unknown;
  dataType: string;
  entityType: TrackingEntityType;
  fieldName: string;
  changeType?: string;
}) {
  const ctx = { entityType: item.entityType, fieldName: item.fieldName };
  const oldStr = formatTrackingValue(item.oldValueJson, item.dataType, ctx);
  const newStr = formatTrackingValue(item.newValueJson, item.dataType, ctx);
  const oldEmpty = isEmptyValue(item.oldValueJson);
  const newEmpty = isEmptyValue(item.newValueJson);

  if (item.changeType === "snapshot") {
    return (
      <span>
        <span className="text-muted-foreground">Mốc ban đầu: </span>
        <span className="font-medium">{newStr}</span>
      </span>
    );
  }

  if (item.changeType === "create" || (oldEmpty && !newEmpty)) {
    return (
      <span>
        <span className="text-muted-foreground">Ghi nhận: </span>
        <span className="font-medium">{newStr}</span>
      </span>
    );
  }

  if (item.changeType === "delete" || (newEmpty && !oldEmpty)) {
    return (
      <span>
        <span className="text-muted-foreground">Đã xóa giá trị </span>
        <span className="text-muted-foreground/70">(trước đó: {oldStr})</span>
      </span>
    );
  }

  if (oldEmpty && newEmpty) {
    return <span className="text-muted-foreground">Không thay đổi</span>;
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground line-through decoration-muted-foreground/40">
        {oldStr}
      </span>
      <span>→</span>
      <span className="font-medium">{newStr}</span>
    </span>
  );
}

export default function TrackingTimeline({
  cropSeasonId,
  initialData,
  isLoading: initialLoading,
}: TrackingTimelineProps) {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState<TrackingEntityType | "">("");
  const [fieldName, setFieldName] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const hasFilter = !!entityType || !!fieldName || !!from || !!to;

  const query: TrackingLogQueryType = {
    page,
    limit: PAGE_LIMIT,
    ...(entityType && { entityType }),
    ...(fieldName.trim() && { fieldName: fieldName.trim() }),
    ...(from && { from }),
    ...(to && { to }),
  };

  const { data, isLoading } = useTrackingLog(
    cropSeasonId,
    query,
    hasFilter || page > 1,
  );

  // Use initialData only when on page 1 with no filters applied
  const activeData = hasFilter || page > 1 ? data?.data : (initialData ?? data?.data);
  const loading = hasFilter || page > 1 ? isLoading : initialLoading;

  const items = (activeData?.data ?? []).filter(
    (item) => item.fieldName !== "sensorBinding",
  );
  const meta = activeData?.meta;

  // Resolve "parent group" key + label for a log row using BE-provided
  // `entityParentId/Label` + `entityLabel` (B8 augmented since 2026-05-26).
  // No FE-side fetch needed; labels persist for soft-deleted entities too.
  //  - Has entityParentId → group under that parent milestone.
  //  - production_milestone → its own group (entityId IS the milestone).
  //  - Others → group by entityType.
  type LogItem = (typeof items)[number];
  function parentOf(item: LogItem): { key: string; label: string } {
    if (item.entityParentId && item.entityParentLabel) {
      return { key: `m:${item.entityParentId}`, label: item.entityParentLabel };
    }
    if (item.entityType === "production_milestone") {
      return {
        key: `m:${item.entityId}`,
        label: item.entityLabel ?? getEntityTypeLabel(item.entityType),
      };
    }
    return {
      key: `t:${item.entityType}`,
      label: getEntityTypeLabel(item.entityType),
    };
  }

  // Group log items by parent — typically one card per milestone (with
  // milestone-level + task-level rows inside), plus one card per top-level
  // entityType for non-milestone-scoped changes. Group order = first-seen
  // (= newest activity first since items are time-DESC); inside-group order
  // preserves the API's time-DESC sort.
  const groupMap = new Map<
    string,
    { key: string; label: string; items: LogItem[] }
  >();
  for (const item of items) {
    const parent = parentOf(item);
    const existing = groupMap.get(parent.key);
    if (existing) {
      existing.items.push(item);
    } else {
      groupMap.set(parent.key, {
        key: parent.key,
        label: parent.label,
        items: [item],
      });
    }
  }
  const groups = Array.from(groupMap.values());

  const handleFilterChange = () => {
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Select
          value={entityType || "all"}
          onValueChange={(v) => {
            setEntityType(v === "all" ? "" : (v as TrackingEntityType));
            handleFilterChange();
          }}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Loại thực thể" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            {ENTITY_TYPE_OPTIONS.map((t) => (
              <SelectItem
                key={t}
                value={t}
              >
                {getEntityTypeLabel(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          className="h-8 text-sm"
          placeholder="Tên trường..."
          value={fieldName}
          onChange={(e) => {
            setFieldName(e.target.value);
            handleFilterChange();
          }}
        />

        <DatePickerField
          value={from}
          onChange={(v) => {
            setFrom(v);
            handleFilterChange();
          }}
          placeholder="Từ ngày"
          maxDate={to ? new Date(to) : undefined}
        />

        <DatePickerField
          value={to}
          onChange={(v) => {
            setTo(v);
            handleFilterChange();
          }}
          placeholder="Đến ngày"
          minDate={from ? new Date(from) : undefined}
        />
      </div>

      {hasFilter && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => {
            setEntityType("");
            setFieldName("");
            setFrom("");
            setTo("");
            setPage(1);
          }}
        >
          Xóa bộ lọc
        </Button>
      )}

      {loading ? (
        <TableSkeleton />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {hasFilter
            ? "Không có thay đổi khớp bộ lọc."
            : "Chưa có lịch sử thay đổi."}
        </p>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const isMilestoneCard = group.key.startsWith("m:");
            // Tách thay đổi của bản thân milestone (header) khỏi thay đổi của
            // các task con (body). Card không phải milestone (mùa vụ, IoT…)
            // dùng toàn bộ làm body, header trống phần summary.
            const milestoneChanges = isMilestoneCard
              ? group.items.filter(
                  (i) => i.entityType === "production_milestone",
                )
              : [];
            const bodyChanges = isMilestoneCard
              ? group.items.filter(
                  (i) => i.entityType !== "production_milestone",
                )
              : group.items;
            const distinctBodyEntities = new Set(
              bodyChanges.map((i) => i.entityId),
            ).size;

            return (
              <div
                key={group.key}
                className="rounded-md border bg-background"
              >
                {/* Header — milestone info + summary thay đổi của chính milestone */}
                <div className="border-b bg-muted/30 px-3 py-2 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold truncate">
                      {group.label}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {group.items.length} thay đổi
                      {bodyChanges.length > 0 && distinctBodyEntities > 1
                        ? ` · ${distinctBodyEntities} công việc`
                        : ""}
                    </span>
                  </div>
                  {milestoneChanges.length > 0 ? (
                    <ul className="flex flex-col gap-1">
                      {milestoneChanges.map((item) => (
                        <li
                          key={item.id}
                          className="flex flex-wrap items-baseline gap-x-2 text-xs"
                        >
                          <span className="tabular-nums text-muted-foreground">
                            {format(parseISO(item.changedAt), "dd/MM HH:mm")}
                          </span>
                          <span className="text-muted-foreground">
                            {getFieldLabel(item.fieldName)}:
                          </span>
                          <span>{renderChange(item)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                {/* Body — list công việc thay đổi trong milestone (hoặc list
                    item full cho non-milestone group) */}
                {bodyChanges.length === 0 && isMilestoneCard ? (
                  <div className="px-3 py-3 text-xs text-muted-foreground italic">
                    Chưa có thay đổi công việc trong giai đoạn này.
                  </div>
                ) : (
                  <div className="divide-y">
                    {bodyChanges.map((item, idx) => {
                      const prev = bodyChanges[idx - 1];
                      const isNewEntity =
                        !prev || prev.entityId !== item.entityId;
                      const taskTitle =
                        item.entityType === "employee_task"
                          ? (item.entityLabel ?? undefined)
                          : undefined;
                      return (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 px-3 py-2"
                        >
                          <span className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5 tabular-nums">
                            {format(parseISO(item.changedAt), "dd/MM HH:mm")}
                          </span>

                          <div className="flex-1 min-w-0 text-sm">
                            {taskTitle && isNewEntity ? (
                              <div className="text-xs font-medium text-sky-700 mb-0.5">
                                {taskTitle}
                              </div>
                            ) : null}
                            <span className="text-muted-foreground">
                              {getFieldLabel(item.fieldName)}
                            </span>
                            {!taskTitle &&
                            item.entityType === "employee_task" ? (
                              <Badge
                                variant="outline"
                                className="ml-2 text-[10px] font-mono"
                              >
                                #{item.entityId.slice(0, 6)}
                              </Badge>
                            ) : null}
                            <div className="mt-1 text-xs">
                              {renderChange(item)}
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalItems > PAGE_LIMIT && (
        <div className="flex justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Trước
          </Button>
          <span className="text-sm text-muted-foreground self-center">
            Trang {page} / {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Tiếp →
          </Button>
        </div>
      )}
    </div>
  );
}
