import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDailyLogTasksToday, useSubmitDailyLog } from "@/queries/useDailyLog";
import { CheckCircle2, NotebookPen } from "lucide-react";
import { useState } from "react";

const PRIORITY_LABEL: Record<string, string> = {
  low: "Thấp",
  normal: "Bình thường",
  high: "Cao",
  urgent: "Khẩn",
};

const PRIORITY_CLASS: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  normal: "bg-sky-100 text-sky-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-rose-100 text-rose-700",
};

export function SubmitLogDialog() {
  const [open, setOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activities, setActivities] = useState("");
  const [notes, setNotes] = useState("");

  const tasksQuery = useDailyLogTasksToday({ page: 1, limit: 50 });
  const pendingTasks = tasksQuery.data?.data.data ?? [];
  const submitMutation = useSubmitDailyLog();

  const selectedTask = pendingTasks.find((t) => t.id === selectedTaskId);

  const handleSubmit = () => {
    if (!selectedTaskId || !activities.trim()) return;
    submitMutation.mutate(
      { employeeTaskId: selectedTaskId, activities: activities.trim(), notes },
      {
        onSuccess: () => {
          setSelectedTaskId(null);
          setActivities("");
          setNotes("");
          setOpen(false);
        },
      },
    );
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelectedTaskId(null);
      setActivities("");
      setNotes("");
    }
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <NotebookPen className="h-3.5 w-3.5 mr-1.5" />
          Ghi nhật ký
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ghi nhật ký công việc</DialogTitle>
        </DialogHeader>

        {tasksQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : pendingTasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500/60" />
            <p className="text-sm font-medium">Không có nhiệm vụ nào cần ghi nhận hôm nay</p>
            <p className="text-xs text-muted-foreground">Bạn đã ghi nhật ký đầy đủ.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {pendingTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`w-full text-left rounded-md border px-3 py-2 text-sm transition-colors ${
                    selectedTaskId === task.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        PRIORITY_CLASS[task.priority] ?? "bg-slate-100 text-slate-600"
                      }
                    >
                      {PRIORITY_LABEL[task.priority] ?? task.priority}
                    </Badge>
                    <span className="font-medium truncate">{task.title}</span>
                  </div>
                </button>
              ))}
            </div>

            {selectedTask && (
              <div className="space-y-3 border-t pt-3">
                <p className="text-xs text-muted-foreground">
                  Nhiệm vụ đã chọn:{" "}
                  <span className="font-medium text-foreground">
                    {selectedTask.title}
                  </span>
                </p>
                <Textarea
                  placeholder="Hoạt động đã thực hiện *"
                  value={activities}
                  onChange={(e) => setActivities(e.target.value)}
                  className="min-h-20 text-sm"
                />
                <Textarea
                  placeholder="Ghi chú (tùy chọn)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-12 text-sm"
                />
              </div>
            )}
          </div>
        )}

        {pendingTasks.length > 0 && (
          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !selectedTaskId ||
                !activities.trim() ||
                submitMutation.isPending
              }
            >
              {submitMutation.isPending ? "Đang ghi..." : "Ghi nhật ký"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
