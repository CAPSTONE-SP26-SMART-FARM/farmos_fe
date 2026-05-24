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
  ChevronRight,
  CircleDot,
  GripVertical,
  MoreVertical,
  Pencil,
  Play,
  Trash2,
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

export function MilestoneCard({
  milestone,
  isDragging,
  isDragOver,
  draggable,
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

  // Quick action (Bắt đầu / Hoàn thành) đi thành nút riêng cạnh chevron;
  // dropdown 3-chấm chỉ dùng cho các thao tác config của planning.
  const hasMenu = actions.canEditConfig;
  const showQuickStart = actions.canStart;
  const showQuickComplete = actions.canComplete;

  return (
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
      className={`cursor-pointer hover:border-primary/60 hover:bg-accent/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isDragging ? "opacity-60" : ""
      } ${isDragOver ? "ring-2 ring-primary/30" : ""}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {actions.canEditConfig && (
          <GripVertical className="h-4 w-4 text-muted-foreground/60 shrink-0 cursor-grab active:cursor-grabbing" />
        )}
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
  );
}
