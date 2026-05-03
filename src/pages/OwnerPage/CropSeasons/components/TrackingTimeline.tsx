// src/pages/OwnerPage/CropSeasons/components/TrackingTimeline.tsx
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import TableSkeleton from "@/components/common/TableSkeleton";
import { useTrackingLog } from "@/queries/useTracking";
import {
  getEntityTypeLabel,
  getFieldLabel,
  formatTrackingValue,
} from "@/lib/tracking-display";
import type {
  TrackingLogListResType,
  TrackingLogQueryType,
} from "@/schemaValidatation/tracking";

interface TrackingTimelineProps {
  cropSeasonId: string;
  initialData?: TrackingLogListResType;
  isLoading?: boolean;
}

const PAGE_LIMIT = 20;

export default function TrackingTimeline({
  cropSeasonId,
  initialData,
  isLoading: initialLoading,
}: TrackingTimelineProps) {
  const [page, setPage] = useState(1);
  const query: TrackingLogQueryType = { page, limit: PAGE_LIMIT };

  const { data, isLoading } = useTrackingLog(cropSeasonId, query, page > 1);

  // Use initialData for page 1 (already loaded in parent), own query for subsequent pages
  const activeData = page === 1 ? initialData : data?.data;
  const loading = page === 1 ? initialLoading : isLoading;

  const items = activeData?.data ?? [];
  const meta = activeData?.meta;

  if (loading && items.length === 0) return <TableSkeleton />;

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Chưa có lịch sử thay đổi.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={item.id}>
              <div className="flex items-start gap-3">
                {/* Time column */}
                <span className="text-xs text-muted-foreground w-32 shrink-0 pt-0.5">
                  {format(parseISO(item.changedAt), "dd/MM HH:mm")}
                </span>

                {/* Content */}
                <div className="flex-1 text-sm">
                  <span className="font-medium">
                    {getEntityTypeLabel(item.entityType)}
                  </span>{" "}
                  —{" "}
                  <span className="text-muted-foreground">
                    {getFieldLabel(item.fieldName)}
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      {formatTrackingValue(item.oldValueJson, item.dataType)}
                    </span>
                    <span className="text-xs">→</span>
                    <span className="font-medium text-xs">
                      {formatTrackingValue(item.newValueJson, item.dataType)}
                    </span>
                  </div>
                </div>

                {/* Source badge */}
                <Badge
                  variant="outline"
                  className="text-xs shrink-0"
                >
                  {item.source === "manual"
                    ? "Thủ công"
                    : (item.source ?? "Hệ thống")}
                </Badge>
              </div>
              {idx < items.length - 1 && <Separator className="mt-3" />}
            </div>
          ))}
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
