import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useManagerDailyLogsByZone } from "@/queries/useDailyLog";
import { useManagerListCropSeasonTasks } from "@/queries/useEmployeeTask";
import type { CropSeasonType } from "@/types/cropSeason";
import type { TaskWithContextResType } from "@/schemaValidatation/employeeTask";
import { CheckCircle2, Circle } from "lucide-react";
import { useMemo } from "react";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ xử lý",
  in_progress: "Đang thực hiện",
  completed: "Hoàn thành",
  verified: "Đã xác minh",
  cancelled: "Đã hủy",
};

interface FarmerRow {
  farmerId: string;
  farmerName: string;
  tasks: TaskWithContextResType[];
  loggedTaskIds: Set<string>;
  logCount: number;
  avatarUrl?: string | null;
}

interface TodayTrackingPanelProps {
  cropSeason: CropSeasonType;
  zoneId: string;
}

export function TodayTrackingPanel({ cropSeason, zoneId }: TodayTrackingPanelProps) {
  const today = todayIso();

  const tasksQuery = useManagerListCropSeasonTasks(cropSeason.id, {
    page: 1,
    limit: 200,
    status: "in_progress",
  });
  const allTasks = tasksQuery.data?.data.data ?? [];

  const logsQuery = useManagerDailyLogsByZone(zoneId, {
    page: 1,
    limit: 200,
    fromDate: today,
    toDate: today,
  });
  const todayLogs = logsQuery.data?.data.data ?? [];

  const farmerRows = useMemo<FarmerRow[]>(() => {
    // Only tasks that have a farmer assigned
    const assignedTasks = allTasks.filter((t) => t.assignedTo && t.farmerName);

    // Group by farmer
    const byFarmer = new Map<string, TaskWithContextResType[]>();
    for (const task of assignedTasks) {
      const id = task.assignedTo!;
      if (!byFarmer.has(id)) byFarmer.set(id, []);
      byFarmer.get(id)!.push(task);
    }

    // Build logged task ID set per farmer from today's logs
    const logsByFarmer = new Map<string, Set<string>>();
    const avatarByFarmer = new Map<string, string | null>();
    for (const log of todayLogs) {
      if (!logsByFarmer.has(log.loggedBy))
        logsByFarmer.set(log.loggedBy, new Set());
      if (log.employeeTaskId)
        logsByFarmer.get(log.loggedBy)!.add(log.employeeTaskId);
      if (log.farmer.avatarUrl !== undefined)
        avatarByFarmer.set(log.loggedBy, log.farmer.avatarUrl);
    }

    const rows: FarmerRow[] = [];
    for (const [farmerId, tasks] of byFarmer.entries()) {
      const loggedTaskIds = logsByFarmer.get(farmerId) ?? new Set<string>();
      rows.push({
        farmerId,
        farmerName: tasks[0].farmerName!,
        tasks,
        loggedTaskIds,
        logCount: loggedTaskIds.size,
        avatarUrl: avatarByFarmer.get(farmerId),
      });
    }

    // Sort: not-logged first
    return rows.sort((a, b) => {
      const aFull = a.logCount >= a.tasks.length;
      const bFull = b.logCount >= b.tasks.length;
      if (aFull !== bFull) return aFull ? 1 : -1;
      return a.farmerName.localeCompare(b.farmerName);
    });
  }, [allTasks, todayLogs]);

  const isLoading = tasksQuery.isLoading || logsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  const loggedCount = farmerRows.filter(
    (r) => r.logCount >= r.tasks.length && r.tasks.length > 0,
  ).length;

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        {loggedCount}/{farmerRows.length} thành viên đã log đủ hôm nay
      </div>

      {farmerRows.length === 0 ? (
        <div className="py-12 text-center border rounded-md bg-muted/20">
          <p className="text-sm font-medium">Không có nhiệm vụ nào đang thực hiện</p>
          <p className="text-xs text-muted-foreground mt-1">
            Khi có task đang thực hiện và được giao cho nông dân, theo dõi sẽ hiện ở đây.
          </p>
        </div>
      ) : (
        farmerRows.map((row) => {
          const allLogged = row.logCount >= row.tasks.length;
          return (
            <Card
              key={row.farmerId}
              className={allLogged ? "border-emerald-200" : ""}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      {row.avatarUrl && (
                        <AvatarImage src={row.avatarUrl} alt={row.farmerName} />
                      )}
                      <AvatarFallback>
                        {getInitials(row.farmerName)}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-sm font-semibold">
                      {row.farmerName}
                    </CardTitle>
                  </div>
                  {allLogged ? (
                    <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Đã log đủ
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Circle className="h-3.5 w-3.5" />
                      {row.logCount}/{row.tasks.length} task
                    </div>
                  )}
                </div>
                <CardDescription className="text-xs">
                  {row.tasks.length} nhiệm vụ đang thực hiện
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {row.tasks.map((task) => {
                    const logged = row.loggedTaskIds.has(task.id);
                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 rounded px-2 py-1.5 text-xs"
                      >
                        {logged ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                        )}
                        <span
                          className={`flex-1 truncate ${logged ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {task.title}
                        </span>
                        {task.milestoneName && (
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            #{task.milestoneOrder} {task.milestoneName}
                          </Badge>
                        )}
                        <Badge
                          variant="secondary"
                          className="text-[10px] shrink-0"
                        >
                          {STATUS_LABEL[task.status] ?? task.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
