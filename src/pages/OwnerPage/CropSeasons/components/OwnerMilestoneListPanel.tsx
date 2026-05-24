import { Skeleton } from "@/components/ui/skeleton";
import { Layers } from "lucide-react";
import { useNavigate } from "react-router";
import { useOwnerListProductionMilestones } from "@/queries/useProductionMilestone";
import type { CropSeasonType } from "@/types/cropSeason";
import { OwnerMilestoneCard } from "./OwnerMilestoneCard";

/**
 * Owner-side read-only milestone list panel.
 * Render danh sách mốc của 1 mùa vụ, click card → navigate sang page chi tiết
 * (giống flow manager nhưng route prefix /dashboard/owner).
 * KHÔNG có create / edit / delete / reorder / template / quick action.
 */
export function OwnerMilestoneListPanel({
  cropSeason,
  zoneId,
}: {
  cropSeason: CropSeasonType;
  zoneId: string;
}) {
  const navigate = useNavigate();

  const listQuery = useOwnerListProductionMilestones(cropSeason.id, {
    page: 1,
    limit: 50,
  });

  const milestones = (listQuery.data?.data.data ?? [])
    .slice()
    .sort((a, b) => a.milestoneOrder - b.milestoneOrder);

  const milestoneUrl = (milestoneId: string) => {
    const base = `/dashboard/owner/crop-seasons/${cropSeason.id}/milestones/${milestoneId}`;
    return zoneId ? `${base}?zoneId=${encodeURIComponent(zoneId)}` : base;
  };

  if (listQuery.isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            className="h-16 w-full rounded-md"
          />
        ))}
      </div>
    );
  }

  const isEmpty = milestones.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border rounded-md bg-muted/20">
        <Layers className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium">Chưa có mốc công việc</p>
        <p className="text-xs text-muted-foreground mt-1">
          Quản lý sẽ tạo mốc công việc khi lên kế hoạch sản xuất.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Mốc công việc
          <span className="text-sm font-normal text-muted-foreground">
            ({milestones.length})
          </span>
        </h2>
      </div>

      <ul className="space-y-2">
        {milestones.map((m) => (
          <li key={m.id}>
            <OwnerMilestoneCard
              milestone={m}
              onOpen={() => navigate(milestoneUrl(m.id))}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
