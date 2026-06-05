import { Badge } from "@/components/ui/badge";
import { CalendarDays, CheckCheck, ChevronRight } from "lucide-react";
import type { ProductionMilestoneResType } from "@/schemaValidatation/productionMilestone";
import { cn } from "@/lib/utils";
import {
  MILESTONE_STATUS_META,
  formatDate,
} from "@/pages/ManagerPage/CropSeasons/components/helpers";

/**
 * Owner-side read-only milestone node (timeline style).
 * Click → mở page chi tiết milestone của owner.
 * Không có drag handle, không có dropdown CRUD, không có quick start/complete.
 */

// Màu chấm trạng thái trên rail timeline — khớp với MILESTONE_STATUS_META.
const STATUS_DOT: Record<string, string> = {
  pending: "bg-muted-foreground/30 ring-muted-foreground/10",
  in_progress: "bg-amber-500 ring-amber-500/20",
  completed: "bg-emerald-500 ring-emerald-500/20",
};

// Màu thanh accent trái của card.
const STATUS_ACCENT: Record<string, string> = {
  pending: "before:bg-border",
  in_progress: "before:bg-amber-400",
  completed: "before:bg-emerald-400",
};

export function OwnerMilestoneCard({
  milestone,
  isLast = false,
  onOpen,
}: {
  milestone: ProductionMilestoneResType;
  /** Mốc cuối — ẩn đường nối timeline phía dưới. */
  isLast?: boolean;
  onOpen: () => void;
}) {
  const meta =
    MILESTONE_STATUS_META[milestone.status] ?? {
      label: milestone.status,
      variant: "secondary" as const,
    };
  const isDone = milestone.status === "completed";

  return (
    <div className="relative flex gap-3">
      {/* ── Rail timeline: chấm trạng thái + đường nối ─────────────────────── */}
      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            "z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 text-[11px] font-mono font-semibold text-white",
            STATUS_DOT[milestone.status] ?? STATUS_DOT.pending,
          )}
        >
          {isDone ? (
            <CheckCheck className="h-3.5 w-3.5" />
          ) : (
            <span className={cn(milestone.status === "pending" && "text-foreground/60")}>
              {milestone.milestoneOrder}
            </span>
          )}
        </div>
        {!isLast && <div className="w-px grow bg-border" />}
      </div>

      {/* ── Card nội dung ─────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "group relative mb-2 flex w-full items-center gap-3 overflow-hidden rounded-lg border bg-card px-4 py-3 text-left transition-colors",
          "before:absolute before:inset-y-0 before:left-0 before:w-1",
          "hover:border-primary/50 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          STATUS_ACCENT[milestone.status] ?? STATUS_ACCENT.pending,
        )}
      >
        <div className="min-w-0 flex-1 pl-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium truncate">
              {milestone.stageName}
            </span>
            <Badge variant={meta.variant} className={cn("text-[10px]", meta.className)}>
              {meta.label}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
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

        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}
