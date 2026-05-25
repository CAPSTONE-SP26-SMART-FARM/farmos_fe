import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ListTodo,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useDailyLogTasksToday } from "@/queries/useDailyLog";
import type { FarmerTaskForDailyLogType } from "@/schemaValidatation/dailyLog";

const PRIORITY_META: Record<string, { label: string; className: string }> = {
  low: {
    label: "Thấp",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  normal: {
    label: "Bình thường",
    className: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
  },
  high: {
    label: "Cao",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  },
  urgent: {
    label: "Khẩn cấp",
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
  },
};

function TaskCard({ task }: { task: FarmerTaskForDailyLogType }) {
  const priorityMeta = PRIORITY_META[task.priority] ?? PRIORITY_META.normal;

  return (
    <div className="rounded-md border p-3 space-y-2 bg-amber-50/40 border-amber-200 dark:bg-amber-950/10 dark:border-amber-900">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{task.title}</p>
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge className={`text-[10px] ${priorityMeta.className}`}>
            {priorityMeta.label}
          </Badge>
          <Badge
            variant="secondary"
            className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
          >
            Chưa ghi nhận
          </Badge>
        </div>
      </div>
    </div>
  );
}

/**
 * Owner-side mirror của `TodayZoneTasksPanel`. Khác biệt:
 *   - dùng `useDailyLogTasksToday` (shared endpoint `GET /daily-log/tasks`,
 *     owner/manager/farmer dùng chung). Endpoint chỉ trả task **chưa ghi
 *     nhật ký hôm nay** → owner thấy danh sách cần xử lý.
 *   - Endpoint shared không filter theo milestoneId, FE client-side filter.
 *   - Không có field `hasLoggedToday`/`farmerName`/`todayLog` như manager,
 *     nên card đơn giản hơn (priority + tiêu đề + mô tả).
 */
export function OwnerTodayMilestoneTasksPanel({
  milestoneId,
}: {
  milestoneId: string;
}) {
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data, isLoading, isError } = useDailyLogTasksToday({
    page,
    limit,
  });

  const allTasks = data?.data?.data ?? [];
  const meta = data?.data?.meta;

  const tasks = useMemo(
    () => allTasks.filter((t) => t.milestoneId === milestoneId),
    [allTasks, milestoneId],
  );

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold flex items-center gap-1.5">
          <ListTodo className="h-4 w-4" />
          Nhiệm vụ cần ghi nhật ký hôm nay
        </p>
        {!isLoading && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {tasks.length} nhiệm vụ trong mốc đang chờ ghi nhật ký
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-4 text-center text-sm text-destructive">
          Không thể tải dữ liệu. Mời thử lại.
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-md border bg-muted/20 px-3 py-8 text-center space-y-1">
          <CheckCircle2 className="h-8 w-8 text-emerald-500/60 mx-auto" />
          <p className="text-sm font-medium">
            Tất cả nhiệm vụ trong mốc đã được ghi nhận hôm nay
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}

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
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={!meta.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
