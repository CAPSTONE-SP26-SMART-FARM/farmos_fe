import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CheckCheck,
  ChevronRight,
  CircleDot,
  GripVertical,
  MoreVertical,
  Pencil,
  Play,
  Trash2,
  UserPlus,
} from "lucide-react";
import type { DragEvent } from "react";
import type { ProductionMilestoneResType } from "@/schemaValidatation/productionMilestone";
import { cn } from "@/lib/utils";
import { MILESTONE_STATUS_META, formatDate } from "./helpers";

export type MilestoneCardActions = {
  canEditConfig: boolean;
  canStart: boolean;
  canComplete: boolean;
  isFirst: boolean;
  isLast: boolean;
  isReordering: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onStart: () => void;
  onComplete: () => void;
};

// Màu chấm trạng thái trên rail timeline — khớp MILESTONE_STATUS_META.
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

export function MilestoneCard({
  milestone,
  isDragging,
  isDragOver,
  draggable,
  needsEmployeeTaskAssignment = false,
  onAssignEmployeeTask,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  actions,
}: {
  milestone: ProductionMilestoneResType;
  isDragging: boolean;
  isDragOver: boolean;
  draggable: boolean;
  needsEmployeeTaskAssignment?: boolean;
  onAssignEmployeeTask?: () => void;
  onDragStart: (e: DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void | Promise<void>;
  onDragEnd: () => void;
  actions: MilestoneCardActions;
}) {
  const meta =
    MILESTONE_STATUS_META[milestone.status] ?? {
      label: milestone.status,
      variant: "secondary" as const,
    };
  const isDone = milestone.status === "completed";

  // Quick action (Bắt đầu / Hoàn thành) đi thành nút riêng cạnh chevron;
  // dropdown 3-chấm chỉ dùng cho các thao tác config của planning.
  const hasMenu = actions.canEditConfig;
  const showQuickStart = actions.canStart;
  const showQuickComplete = actions.canComplete;

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
            <span
              className={cn(
                milestone.status === "pending" && "text-foreground/60",
              )}
            >
              {milestone.milestoneOrder}
            </span>
          )}
        </div>
        {!actions.isLast && <div className="w-px grow bg-border" />}
      </div>

      {/* ── Card nội dung (giữ drag + quick action + menu) ─────────────────── */}
      <Card
        role="button"
        tabIndex={0}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={(e) => void onDrop(e)}
        onDragEnd={onDragEnd}
        onClick={actions.onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            actions.onOpen();
          }
        }}
        className={cn(
          "relative mb-2 min-w-0 flex-1 cursor-pointer overflow-hidden py-0 transition-colors",
          "before:absolute before:inset-y-0 before:left-0 before:w-1",
          "hover:border-primary/60 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          STATUS_ACCENT[milestone.status] ?? STATUS_ACCENT.pending,
          isDragging && "opacity-60",
          isDragOver && "ring-2 ring-primary/30",
        )}
      >
        <div className="flex items-center gap-3 py-3 pl-4 pr-3">
          {actions.canEditConfig && (
            <GripVertical className="h-4 w-4 text-muted-foreground/60 shrink-0 cursor-grab active:cursor-grabbing" />
          )}

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
              {needsEmployeeTaskAssignment && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssignEmployeeTask?.();
                  }}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                  aria-label="Mở bước gán nhiệm vụ cho nông dân"
                >
                  <Badge
                    variant="outline"
                    className="text-[10px] cursor-pointer border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-950/60"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Cần gán nhiệm vụ cho nông dân
                  </Badge>
                </button>
              )}
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

          {showQuickStart && (
            <Button
              size="sm"
              className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={(e) => {
                e.stopPropagation();
                actions.onStart();
              }}
            >
              <Play className="h-3.5 w-3.5 mr-1" />
              Bắt đầu
            </Button>
          )}
          {showQuickComplete && (
            <Button
              size="sm"
              className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={(e) => {
                e.stopPropagation();
                actions.onComplete();
              }}
            >
              <CircleDot className="h-3.5 w-3.5 mr-1" />
              Hoàn thành
            </Button>
          )}

          {hasMenu ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Tác vụ mốc"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuItem onClick={actions.onEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={actions.isFirst || actions.isReordering}
                  onClick={actions.onMoveUp}
                >
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Di chuyển lên
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={actions.isLast || actions.isReordering}
                  onClick={actions.onMoveDown}
                >
                  <ArrowDown className="h-4 w-4 mr-2" />
                  Di chuyển xuống
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={actions.onDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa mốc
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            !showQuickStart &&
            !showQuickComplete && (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )
          )}
        </div>
      </Card>
    </div>
  );
}
