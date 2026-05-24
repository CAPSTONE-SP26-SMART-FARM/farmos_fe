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
import { useManagerListEmployeeTasks } from "@/queries/useEmployeeTask";
import { useManagerZoneTasksForToday } from "@/queries/useDailyLog";
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

/**
 * KPI strip cho tab "Công việc" — load 2 query song song:
 *   - list tasks (limit lớn) để compute total/unassigned/overdue/done FE-side
 *   - today tasks để đếm logged/unlogged
 * Milestone thường < 100 task nên 1 fetch limit:200 là acceptable; nếu sau này
 * milestone phình to, đổi sang gọi BE count endpoint dedicated.
 */
export function MilestoneTaskKpiStrip({
  milestoneId,
  zoneId,
}: {
  milestoneId: string;
  zoneId: string;
}) {
  const tasksQuery = useManagerListEmployeeTasks(milestoneId, {
    page: 1,
    limit: 200,
  });
  const todayQuery = useManagerZoneTasksForToday(zoneId, {
    page: 1,
    limit: 200,
    milestoneId,
  });

  const tasks = tasksQuery.data?.data?.data ?? [];
  const todayTasks = todayQuery.data?.data?.data ?? [];

  const stats = useMemo(() => {
    const total = tasks.length;
    const unassigned = tasks.filter((t) => !t.assignedTo).length;
    const overdue = tasks.filter(isOverdue).length;
    const done = tasks.filter(
      (t) => t.status === "completed" || t.status === "verified",
    ).length;
    return { total, unassigned, overdue, done };
  }, [tasks]);

  const todayStats = useMemo(() => {
    const total = todayTasks.length;
    const logged = todayTasks.filter((t) => t.hasLoggedToday).length;
    const unlogged = total - logged;
    return { total, logged, unlogged };
  }, [todayTasks]);

  const tasksLoading = tasksQuery.isLoading;
  const todayLoading = todayQuery.isLoading;

  return (
    <Card className="px-1 py-0">
      <div className="flex flex-wrap items-center divide-x">
        <KpiItem
          icon={ClipboardList}
          label="Tổng nhiệm vụ"
          value={stats.total}
          loading={tasksLoading}
        />
        <KpiItem
          icon={CalendarClock}
          label="Hôm nay"
          value={todayStats.total}
          tone="today"
          loading={todayLoading}
        />
        <KpiItem
          icon={AlertCircle}
          label="Chưa ghi nhận"
          value={todayStats.unlogged}
          tone={todayStats.unlogged > 0 ? "warn" : "ok"}
          loading={todayLoading}
        />
        <KpiItem
          icon={UserMinus}
          label="Chưa gán"
          value={stats.unassigned}
          tone={stats.unassigned > 0 ? "warn" : "neutral"}
          loading={tasksLoading}
        />
        <KpiItem
          icon={AlertCircle}
          label="Quá hạn"
          value={stats.overdue}
          tone={stats.overdue > 0 ? "danger" : "neutral"}
          loading={tasksLoading}
        />
        <KpiItem
          icon={CheckCircle2}
          label="Đã xong"
          value={stats.done}
          tone="ok"
          loading={tasksLoading}
        />
      </div>
    </Card>
  );
}
