import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  UserMinus,
} from "lucide-react";
import { useMemo } from "react";
import { useOwnerListEmployeeTasks } from "@/queries/useEmployeeTask";
import type { EmployeeTaskResType } from "@/schemaValidatation/employeeTask";

type KpiTone = "neutral" | "today" | "warn" | "danger" | "ok";

const TONE_CLASS: Record<KpiTone, string> = {
  neutral: "text-muted-foreground",
  today: "text-sky-600 dark:text-sky-400",
  warn: "text-amber-600 dark:text-amber-400",
  danger: "text-rose-600 dark:text-rose-400",
  ok: "text-emerald-600 dark:text-emerald-400",
};

function isOverdue(task: EmployeeTaskResType): boolean {
  if (!task.dueDate) return false;
  if (["completed", "verified", "cancelled"].includes(task.status)) return false;
  return new Date(task.dueDate) < new Date();
}

function isDueToday(task: EmployeeTaskResType, todayYmd: string): boolean {
  if (!task.dueDate) return false;
  return task.dueDate.slice(0, 10) === todayYmd;
}

function KpiItem({
  icon: Icon,
  label,
  value,
  tone = "neutral",
  loading,
}: {
  icon: typeof ClipboardList;
  label: string;
  value: number | string;
  tone?: KpiTone;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <Icon className={`h-4 w-4 shrink-0 ${TONE_CLASS[tone]}`} />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground leading-none">
          {label}
        </p>
        {loading ? (
          <Skeleton className="mt-1 h-4 w-8" />
        ) : (
          <p className={`text-sm font-semibold leading-tight ${TONE_CLASS[tone]}`}>
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

// Owner KPI strip: derives all counts from the milestone task list. Skips the
// "chưa ghi nhận hôm nay" stat from manager's strip because owner BE does not
// expose the zone-today daily-log lookup.
export function OwnerMilestoneTaskKpiStrip({
  milestoneId,
}: {
  milestoneId: string;
}) {
  const tasksQuery = useOwnerListEmployeeTasks(milestoneId, {
    page: 1,
    limit: 99,
  });

  const tasks = tasksQuery.data?.data?.data ?? [];

  const stats = useMemo(() => {
    const todayYmd = new Date().toISOString().slice(0, 10);
    const total = tasks.length;
    const unassigned = tasks.filter((t) => !t.assignedTo).length;
    const overdue = tasks.filter(isOverdue).length;
    const dueToday = tasks.filter((t) => isDueToday(t, todayYmd)).length;
    const done = tasks.filter(
      (t) => t.status === "completed" || t.status === "verified",
    ).length;
    return { total, unassigned, overdue, dueToday, done };
  }, [tasks]);

  const loading = tasksQuery.isLoading;

  return (
    <Card className="px-1 py-0">
      <div className="flex flex-wrap items-center divide-x">
        <KpiItem
          icon={ClipboardList}
          label="Tổng nhiệm vụ"
          value={stats.total}
          loading={loading}
        />
        <KpiItem
          icon={CalendarClock}
          label="Hôm nay"
          value={stats.dueToday}
          tone="today"
          loading={loading}
        />
        <KpiItem
          icon={UserMinus}
          label="Chưa gán"
          value={stats.unassigned}
          tone={stats.unassigned > 0 ? "warn" : "neutral"}
          loading={loading}
        />
        <KpiItem
          icon={AlertCircle}
          label="Quá hạn"
          value={stats.overdue}
          tone={stats.overdue > 0 ? "danger" : "neutral"}
          loading={loading}
        />
        <KpiItem
          icon={CheckCircle2}
          label="Đã xong"
          value={stats.done}
          tone="ok"
          loading={loading}
        />
      </div>
    </Card>
  );
}
