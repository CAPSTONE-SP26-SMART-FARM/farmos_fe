import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  ClipboardList,
  NotebookPen,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useFarmerTasksForToday } from "@/queries/useDailyLog";
import { useSubmitDailyLog } from "@/queries/useDailyLog";
import type { FarmerTaskWithLogStatusType } from "@/schemaValidatation/dailyLog";
import { format } from "date-fns";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const PRIORITY_META: Record<string, { label: string; className: string }> = {
  low: { label: "Thấp", className: "bg-slate-100 text-slate-600" },
  normal: { label: "Bình thường", className: "bg-sky-100 text-sky-700" },
  high: { label: "Cao", className: "bg-orange-100 text-orange-700" },
  urgent: { label: "Khẩn cấp", className: "bg-rose-100 text-rose-700" },
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
// Log submission dialog (pre-filled with a specific task)
// ─────────────────────────────────────────────────────────────

function SubmitLogForTaskDialog({
  task,
  onClose,
}: {
  task: FarmerTaskWithLogStatusType | null;
  onClose: () => void;
}) {
  const [activities, setActivities] = useState("");
  const [notes, setNotes] = useState("");
  const submitMutation = useSubmitDailyLog();

  const handleSubmit = () => {
    if (!task || !activities.trim()) return;
    submitMutation.mutate(
      { employeeTaskId: task.id, activities: activities.trim(), notes },
      {
        onSuccess: () => {
          setActivities("");
          setNotes("");
          onClose();
        },
      },
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setActivities("");
      setNotes("");
      onClose();
    }
  };

  return (
    <Dialog open={!!task} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ghi nhật ký công việc</DialogTitle>
        </DialogHeader>

        {task && (
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/30 px-3 py-2.5 space-y-1">
              <p className="text-xs text-muted-foreground">Công việc</p>
              <p className="text-sm font-medium">{task.title}</p>
              {task.milestoneName && (
                <p className="text-xs text-muted-foreground">
                  Mốc: {task.milestoneName}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">
                  Hoạt động đã thực hiện{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Textarea
                  placeholder="Mô tả công việc bạn đã làm hôm nay..."
                  value={activities}
                  onChange={(e) => setActivities(e.target.value)}
                  className="mt-1 min-h-24 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Ghi chú (tùy chọn)
                </label>
                <Textarea
                  placeholder="Ghi chú thêm nếu có..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 min-h-14 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!activities.trim() || submitMutation.isPending}
          >
            {submitMutation.isPending ? "Đang ghi..." : "Ghi nhật ký"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// Task card
// ─────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onLog,
}: {
  task: FarmerTaskWithLogStatusType;
  onLog: (task: FarmerTaskWithLogStatusType) => void;
}) {
  const priorityMeta =
    PRIORITY_META[task.priority] ?? PRIORITY_META.normal;

  return (
    <div
      className={`rounded-md border p-3 space-y-2 transition-colors ${
        task.hasLoggedToday ? "bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800" : ""
      }`}
    >
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
              <p className="text-xs text-muted-foreground truncate">
                {task.milestoneName}
              </p>
            )}
          </div>
        </div>
        <Badge className={`text-[10px] shrink-0 ${priorityMeta.className}`}>
          {priorityMeta.label}
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
          {task.startDate && (
            <span>Bắt đầu: {formatDate(task.startDate)}</span>
          )}
          {task.assignedDate && (
            <span>Gán: {formatDate(task.assignedDate)}</span>
          )}
        </div>

        {task.hasLoggedToday ? (
          <span className="text-xs text-emerald-600 font-medium shrink-0">
            Đã log hôm nay
          </span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs shrink-0"
            onClick={() => onLog(task)}
          >
            <NotebookPen className="h-3 w-3 mr-1" />
            Ghi log
          </Button>
        )}
      </div>

      {task.hasLoggedToday && task.todayLog && (
        <>
          <Separator className="opacity-50" />
          <div className="text-xs space-y-0.5">
            <p className="text-muted-foreground">Nội dung đã ghi:</p>
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

export function TodayFarmerTasksPanel() {
  const [page, setPage] = useState(1);
  const [logTarget, setLogTarget] =
    useState<FarmerTaskWithLogStatusType | null>(null);

  const query = useFarmerTasksForToday({ page, limit: 10 });
  const tasks = query.data?.data?.data ?? [];
  const meta = query.data?.data?.meta;

  const loggedCount = tasks.filter((t) => t.hasLoggedToday).length;
  const unloggedCount = tasks.filter((t) => !t.hasLoggedToday).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4" />
            Nhiệm vụ hôm nay
          </p>
          {!query.isLoading && meta && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {meta.totalItems} nhiệm vụ ·{" "}
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
      </div>

      {query.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : query.isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-4 text-center text-sm text-destructive">
          Không thể tải nhiệm vụ. Vui lòng thử lại.
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-md border bg-muted/20 px-3 py-8 text-center space-y-1">
          <CheckCircle2 className="h-8 w-8 text-emerald-500/60 mx-auto" />
          <p className="text-sm font-medium">Không có nhiệm vụ nào hôm nay</p>
          <p className="text-xs text-muted-foreground">
            Mốc sản xuất chưa bắt đầu hoặc chưa được gán task.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onLog={setLogTarget}
            />
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            Trang {page} / {meta.totalPages}
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

      <SubmitLogForTaskDialog
        task={logTarget}
        onClose={() => setLogTarget(null)}
      />
    </div>
  );
}
