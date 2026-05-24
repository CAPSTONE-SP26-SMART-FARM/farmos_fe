import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CalendarDays, ChevronRight } from "lucide-react";
import type { ProductionMilestoneResType } from "@/schemaValidatation/productionMilestone";
import { cn } from "@/lib/utils";
import {
  MILESTONE_STATUS_META,
  formatDate,
} from "@/pages/ManagerPage/CropSeasons/components/helpers";

/**
 * Owner-side read-only milestone card.
 * Click → mở page chi tiết milestone của owner (giống manager click → page riêng).
 * Không có drag handle, không có dropdown CRUD, không có quick start/complete.
 */
export function OwnerMilestoneCard({
  milestone,
  onOpen,
}: {
  milestone: ProductionMilestoneResType;
  onOpen: () => void;
}) {
  const meta =
    MILESTONE_STATUS_META[milestone.status] ?? {
      label: milestone.status,
      variant: "secondary" as const,
    };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="cursor-pointer hover:border-primary/60 hover:bg-accent/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-mono font-semibold">
          #{milestone.milestoneOrder}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium truncate">
              {milestone.stageName}
            </span>
            <Badge
              variant={meta.variant}
              className={cn("text-[10px]", meta.className)}
            >
              {meta.label}
            </Badge>
          </div>
          <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
            <CalendarDays className="h-3 w-3 shrink-0" />
            <span>
              Kế hoạch: {formatDate(milestone.expectedStartDate)} –{" "}
              {formatDate(milestone.expectedEndDate)}
            </span>
            {(milestone.actualStartDate || milestone.actualEndDate) && (
              <>
                <span className="opacity-50">·</span>
                <span>
                  Thực tế: {formatDate(milestone.actualStartDate)} –{" "}
                  {formatDate(milestone.actualEndDate)}
                </span>
              </>
            )}
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </Card>
  );
}
