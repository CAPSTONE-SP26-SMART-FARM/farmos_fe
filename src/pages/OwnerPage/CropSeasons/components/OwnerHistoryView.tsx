import { ChevronRight, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { CropSeasonType } from "@/types/cropSeason";
import { StatusBadge } from "@/pages/ManagerPage/CropSeasons/components/StatusBadge";
import { formatDate } from "@/pages/ManagerPage/CropSeasons/components/helpers";

export function OwnerHistoryView({
  seasons,
  isLoading,
  onSelect,
}: {
  seasons: CropSeasonType[];
  isLoading: boolean;
  onSelect: (season: CropSeasonType) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
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
        <button
          key={s.id}
          type="button"
          onClick={() => onSelect(s)}
          className="w-full flex items-center justify-between rounded-md border px-4 py-3 text-left transition-colors hover:bg-accent/40"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{s.cropName}</span>
              {s.variety && (
                <span className="text-xs text-muted-foreground">
                  ({s.variety})
                </span>
              )}
              <StatusBadge status={s.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Trồng: {formatDate(s.plantDate)} · Thu hoạch:{" "}
              {formatDate(s.actualHarvestDate ?? s.expectedHarvestDate)}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      ))}
    </div>
  );
}
