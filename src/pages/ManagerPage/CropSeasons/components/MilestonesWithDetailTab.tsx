import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers, Plus, Settings } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useManagerListProductionMilestones } from "@/queries/useProductionMilestone";
import type { ProductionMilestoneResType } from "@/schemaValidatation/productionMilestone";
import { type CropSeasonType, ProductionStatusName } from "@/types/cropSeason";
import { cn } from "@/lib/utils";
import { MILESTONE_STATUS_META } from "./helpers";
import { MilestoneDetailPane } from "./MilestoneDetailPane";

export function MilestonesWithDetailTab({
  cropSeason,
  zoneId,
}: {
  cropSeason: CropSeasonType;
  zoneId: string;
}) {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const listQuery = useManagerListProductionMilestones(cropSeason.id, { page: 1, limit: 50 });
  const milestones = (listQuery.data?.data.data ?? [])
    .slice()
    .sort((a, b) => a.milestoneOrder - b.milestoneOrder);
  const selected = milestones.find((m) => m.id === selectedId) ?? milestones[0] ?? null;

  const isWizardState =
    cropSeason.status === ProductionStatusName.Planning ||
    cropSeason.status === ProductionStatusName.Rejected;

  const msUrl = (m: ProductionMilestoneResType) => {
    const p = new URLSearchParams();
    if (zoneId) p.set("zoneId", zoneId);
    const q = p.toString() ? `?${p}` : "";
    return isWizardState
      ? `/dashboard/manager/crop-seasons/${cropSeason.id}/milestones/${m.id}${q}`
      : `/dashboard/manager/crop-seasons/${cropSeason.id}/milestones/${m.id}/overview${q}`;
  };

  const manageMilestonesUrl = () => {
    const p = new URLSearchParams();
    if (zoneId) p.set("zoneId", zoneId);
    return `/dashboard/manager/crop-seasons/${cropSeason.id}/milestones${p.toString() ? `?${p}` : ""}`;
  };

  if (listQuery.isLoading) {
    return (
      <div className="flex gap-4">
        <Skeleton className="h-64 w-48 shrink-0" />
        <Skeleton className="h-64 flex-1" />
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
        {isWizardState && (
          <Button size="sm" onClick={() => navigate(manageMilestonesUrl())}>
            <Plus className="h-3 w-3 mr-1" />
            Thêm mốc
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-0 min-h-[420px]">
      <div className="w-52 shrink-0 border-r">
        <div className="flex items-center justify-between px-3 py-2.5 border-b">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {milestones.length} mốc
          </span>
          {isWizardState && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => navigate(manageMilestonesUrl())}
            >
              <Settings className="h-3 w-3" />
            </Button>
          )}
        </div>
        <nav className="p-1.5 space-y-0.5">
          {milestones.map((m) => {
            const meta = MILESTONE_STATUS_META[m.status] ?? {
              label: m.status,
              variant: "secondary" as const,
            };
            const isActive = m.id === (selected?.id ?? "");
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedId(m.id)}
                className={`w-full text-left rounded-md px-3 py-2.5 transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent/60"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className={cn(
                      "text-[10px] font-mono shrink-0",
                      isActive ? "opacity-70" : "text-muted-foreground",
                    )}
                  >
                    #{m.milestoneOrder}
                  </span>
                  <span className="text-sm font-medium truncate">{m.stageName}</span>
                </div>
                <Badge
                  variant={isActive ? "outline" : meta.variant}
                  className={`text-[10px] ${isActive ? "border-primary-foreground/40 text-primary-foreground/80" : ""}`}
                >
                  {meta.label}
                </Badge>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 min-w-0 pl-5 pt-3">
        {selected ? (
          <MilestoneDetailPane
            milestone={selected}
            cropSeason={cropSeason}
            isWizardState={isWizardState}
            allMilestones={milestones}
            onSelectMilestone={setSelectedId}
            onGoConfig={() => navigate(msUrl(selected))}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Chọn mốc để xem chi tiết
          </div>
        )}
      </div>
    </div>
  );
}
