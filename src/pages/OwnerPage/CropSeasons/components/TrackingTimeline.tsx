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
import { Separator } from "@/components/ui/separator";
import TableSkeleton from "@/components/common/TableSkeleton";
import DatePickerField from "@/components/common/DatePickerField";
import { useTrackingLog } from "@/queries/useTracking";
import {
  getEntityTypeLabel,
  getFieldLabel,
  formatTrackingValue,
  getTrackingActorLines,
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

  const items = activeData?.data ?? [];
  const meta = activeData?.meta;

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
          {items.map((item, idx) => {
            const actor = getTrackingActorLines(item);
            return (
              <div key={item.id}>
                <div className="flex items-start gap-3">
                  {/* Time column */}
                  <span className="text-xs text-muted-foreground w-28 shrink-0 pt-0.5">
                    {format(parseISO(item.changedAt), "dd/MM HH:mm")}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-sm">
                    <span className="font-medium">
                      {getEntityTypeLabel(item.entityType)}
                    </span>{" "}
                    —{" "}
                    <span className="text-muted-foreground">
                      {getFieldLabel(item.fieldName)}
                    </span>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        {formatTrackingValue(item.oldValueJson, item.dataType, {
                          entityType: item.entityType,
                          fieldName: item.fieldName,
                        })}
                      </span>
                      <span className="text-xs">→</span>
                      <span className="font-medium text-xs">
                        {formatTrackingValue(item.newValueJson, item.dataType, {
                          entityType: item.entityType,
                          fieldName: item.fieldName,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actor */}
                  <div className="w-36 shrink-0 text-right text-xs pt-0.5">
                    {actor.primary ? (
                      <div>
                        <span className="font-medium block leading-snug wrap-anywhere">
                          {actor.primary}
                        </span>
                        {actor.secondary && (
                          <span className="text-muted-foreground block mt-0.5 wrap-anywhere">
                            {actor.secondary}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>

                  {/* Source badge */}
                  <Badge
                    variant="outline"
                    className="text-xs shrink-0"
                  >
                    {item.source === "manual"
                      ? "Thủ công"
                      : item.source === "system"
                        ? "Hệ thống"
                        : item.source === "iot"
                          ? "Cảm biến"
                          : (item.source ?? "Hệ thống")}
                  </Badge>
                </div>
                {idx < items.length - 1 && <Separator className="mt-3" />}
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
