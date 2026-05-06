import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  User,
} from "lucide-react";
import { useState } from "react";
import { useManagerZoneTasksForToday } from "@/queries/useDailyLog";
import type {
  ListManagerTodayTasksQueryType,
  ManagerTaskWithLogStatusType,
} from "@/schemaValidatation/dailyLog";
import { format } from "date-fns";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const PRIORITY_META: Record<string, { label: string; className: string }> = {
  low: { label: "Thấp", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  normal: { label: "Bình thường", className: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300" },
  high: { label: "Cao", className: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  urgent: { label: "Khẩn cấp", className: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300" },
};

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy");
  } catch {
    return d;
  }
}

// ─────────────────────────────────────────────────────────────
// Task card
// ─────────────────────────────────────────────────────────────

function TaskCard({ task }: { task: ManagerTaskWithLogStatusType }) {
  const priorityMeta = PRIORITY_META[task.priority] ?? PRIORITY_META.normal;

  return (
    <div
      className={`rounded-md border p-3 space-y-2 ${
        task.hasLoggedToday
          ? "bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
          : "bg-amber-50/40 border-amber-200 dark:bg-amber-950/10 dark:border-amber-900"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          {task.hasLoggedToday ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{task.title}</p>
            {task.milestoneName && (
              <p className="text-xs text-muted-foreground">
                Mốc: {task.milestoneName}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge className={`text-[10px] ${priorityMeta.className}`}>
            {priorityMeta.label}
          </Badge>
          <Badge
            variant={task.hasLoggedToday ? "default" : "secondary"}
            className={`text-[10px] ${task.hasLoggedToday ? "bg-emerald-600" : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"}`}
          >
            {task.hasLoggedToday ? "Đã log" : "Chưa log"}
          </Badge>
        </div>
      </div>

      {/* Farmer + dates */}
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {task.farmerName ?? "Chưa gán"}
          {task.farmerPhone && ` · ${task.farmerPhone}`}
        </span>
        {task.startDate && (
          <span>Bắt đầu: {formatDate(task.startDate)}</span>
        )}
      </div>

      {/* Log content if logged */}
      {task.hasLoggedToday && task.todayLog && (
        <>
          <Separator className="opacity-50" />
          <div className="text-xs space-y-0.5">
            <p className="text-muted-foreground font-medium">Nhật ký hôm nay:</p>
            <p className="line-clamp-2">{task.todayLog.activities}</p>
            {task.todayLog.notes && (
              <p className="text-muted-foreground italic line-clamp-1">
                Ghi chú: {task.todayLog.notes}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main panel
// ─────────────────────────────────────────────────────────────

export function TodayZoneTasksPanel({ zoneId }: { zoneId: string }) {
  const [query, setQuery] = useState<ListManagerTodayTasksQueryType>({
    page: 1,
    limit: 10,
  });
  const [logFilter, setLogFilter] = useState<"all" | "logged" | "unlogged">("all");

  const effectiveQuery: ListManagerTodayTasksQueryType = {
    ...query,
    hasLoggedToday:
      logFilter === "logged" ? true : logFilter === "unlogged" ? false : undefined,
  };

  const { data, isLoading, isError } = useManagerZoneTasksForToday(
    zoneId,
    effectiveQuery,
  );
  const tasks = data?.data?.data ?? [];
  const meta = data?.data?.meta;

  const loggedCount = tasks.filter((t) => t.hasLoggedToday).length;
  const unloggedCount = tasks.filter((t) => !t.hasLoggedToday).length;

  return (
    <div className="space-y-3">
      {/* Header + filter */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="text-sm font-semibold flex items-center gap-1.5">
            <ListTodo className="h-4 w-4" />
            Nhiệm vụ hôm nay
          </p>
          {!isLoading && meta && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {meta.totalItems} task ·{" "}
              <span className="text-emerald-600">{loggedCount} đã log</span>
              {unloggedCount > 0 && (
                <>
                  {" "}·{" "}
                  <span className="text-amber-600">{unloggedCount} chưa log</span>
                </>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Lọc:</span>
          <Select
            value={logFilter}
            onValueChange={(v) => {
              setLogFilter(v as typeof logFilter);
              setQuery((q) => ({ ...q, page: 1 }));
            }}
          >
            <SelectTrigger className="h-7 text-xs w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="logged">Đã log</SelectItem>
              <SelectItem value="unlogged">Chưa log</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-4 text-center text-sm text-destructive">
          Không thể tải dữ liệu. Vui lòng thử lại.
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-md border bg-muted/20 px-3 py-8 text-center space-y-1">
          <CheckCircle2 className="h-8 w-8 text-emerald-500/60 mx-auto" />
          <p className="text-sm font-medium">
            {logFilter === "unlogged"
              ? "Tất cả task đã được ghi nhật ký hôm nay"
              : "Không có nhiệm vụ nào đang thực hiện hôm nay"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            Trang {meta.page} / {meta.totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={!meta.hasPreviousPage}
              onClick={() => setQuery((q) => ({ ...q, page: q.page! - 1 }))}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={!meta.hasNextPage}
              onClick={() => setQuery((q) => ({ ...q, page: q.page! + 1 }))}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
