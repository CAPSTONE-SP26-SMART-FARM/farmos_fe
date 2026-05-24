import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, ChevronRight, Layers, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { useManagerListProductionMilestones } from "@/queries/useProductionMilestone";
import { type CropSeasonType, ProductionStatusName } from "@/types/cropSeason";
import { MILESTONE_STATUS_META, formatDate } from "./helpers";

export function MilestoneListPanel({
  cropSeason,
  zoneId,
  readOnly = false,
}: {
  cropSeason: CropSeasonType;
  zoneId: string;
  readOnly?: boolean;
}) {
  const navigate = useNavigate();
  const listQuery = useManagerListProductionMilestones(cropSeason.id, {
    page: 1,
    limit: 50,
  });
  const milestones = (listQuery.data?.data.data ?? [])
    .slice()
    .sort((a, b) => a.milestoneOrder - b.milestoneOrder);

  const isPlanningState =
    cropSeason.status === ProductionStatusName.Planning ||
    cropSeason.status === ProductionStatusName.Rejected;

  const buildUrl = (milestoneId: string) => {
    const p = new URLSearchParams();
    if (zoneId) p.set("zoneId", zoneId);
    const q = p.toString() ? `?${p}` : "";
    return `/dashboard/manager/crop-seasons/${cropSeason.id}/milestones/${milestoneId}${q}`;
  };

  const manageMilestonesUrl = () => {
    const p = new URLSearchParams();
    if (zoneId) p.set("zoneId", zoneId);
    return `/dashboard/manager/crop-seasons/${cropSeason.id}/milestones${p.toString() ? `?${p}` : ""}`;
  };

  if (listQuery.isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border rounded-md bg-muted/20">
        <Layers className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium">Chưa có mốc công việc</p>
        <p className="text-xs text-muted-foreground mt-1 mb-3">
          Tạo mốc để lên kế hoạch và cấu hình thiết bị
        </p>
        {!readOnly && isPlanningState && (
          <Button size="sm" onClick={() => navigate(manageMilestonesUrl())}>
            <Plus className="h-3 w-3 mr-1" />
            Thêm mốc
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Mốc công việc
          <span className="text-sm font-normal text-muted-foreground">
            ({milestones.length})
          </span>
        </h2>
        {!readOnly && isPlanningState && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(manageMilestonesUrl())}
          >
            <Plus className="h-3 w-3 mr-1.5" />
            Quản lý mốc
          </Button>
        )}
      </div>

      <ul className="space-y-2">
        {milestones.map((m) => {
          const meta =
            MILESTONE_STATUS_META[m.status] ?? {
              label: m.status,
              variant: "secondary" as const,
            };
          return (
            <li key={m.id}>
              <Card
                role="button"
                tabIndex={0}
                onClick={() => navigate(buildUrl(m.id))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(buildUrl(m.id));
                  }
                }}
                className="cursor-pointer hover:border-primary/60 hover:bg-accent/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-mono font-semibold">
                    #{m.milestoneOrder}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">
                        {m.stageName}
                      </span>
                      <Badge variant={meta.variant} className="text-[10px]">
                        {meta.label}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
                      <CalendarDays className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        Kế hoạch: {formatDate(m.expectedStartDate)} –{" "}
                        {formatDate(m.expectedEndDate)}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
