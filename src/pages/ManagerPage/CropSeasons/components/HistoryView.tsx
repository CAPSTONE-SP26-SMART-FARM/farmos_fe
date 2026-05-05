import { History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { CropSeasonType } from "@/types/cropSeason";
import { StatusBadge } from "./StatusBadge";
import { formatDate } from "./helpers";
import { CropSeasonDetailSheet } from "./CropSeasonDetailSheet";

export function HistoryView({
  seasons,
  isLoading,
}: {
  seasons: CropSeasonType[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (seasons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border rounded-md bg-muted/20">
        <History className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium">Chưa có lịch sử vụ mùa</p>
        <p className="text-xs text-muted-foreground mt-1">
          Các vụ mùa đã hoàn thành hoặc huỷ sẽ xuất hiện ở đây
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {seasons.map((s) => (
        <div key={s.id} className="flex items-center justify-between rounded-md border px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{s.cropName}</span>
              {s.variety && <span className="text-xs text-muted-foreground">({s.variety})</span>}
              <StatusBadge status={s.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Trồng: {formatDate(s.plantDate)} · Thu hoạch:{" "}
              {formatDate(s.actualHarvestDate ?? s.expectedHarvestDate)}
            </p>
          </div>
          <CropSeasonDetailSheet season={s} />
        </div>
      ))}
    </div>
  );
}
