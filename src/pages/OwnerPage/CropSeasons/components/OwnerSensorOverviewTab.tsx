import { AlertTriangle, Cpu, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useOwnerListProductionMilestones,
  useOwnerMilestoneAssignment,
} from "@/queries/useProductionMilestone";
import { useOwnerLatestSensorReadings } from "@/queries/useSensorReading";
import { useListAlerts } from "@/queries/useAlert";
import type { AlertResType } from "@/schemaValidatation/alert";
import type { ProductionMilestoneResType } from "@/schemaValidatation/productionMilestone";
import type { CropSeasonType } from "@/types/cropSeason";
import SensorCard from "@/pages/SensorReadings/components/SensorCard";
import { MILESTONE_STATUS_META } from "@/pages/ManagerPage/CropSeasons/components/helpers";

/**
 * Owner-side variant of SensorOverviewTab.
 * - Uses useOwnerListProductionMilestones, useOwnerMilestoneAssignment, useOwnerLatestSensorReadings.
 * - Alerts list is role-neutral.
 */

const ALERT_SEVERITY_COLORS: Record<string, string> = {
  low: "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-300",
  medium:
    "border-orange-300 bg-orange-50 dark:bg-orange-950/20 text-orange-800 dark:text-orange-300",
  high: "border-red-300 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300",
  critical:
    "border-red-500 bg-red-100 dark:bg-red-950/30 text-red-900 dark:text-red-200",
};

const ALERT_SEVERITY_LABEL: Record<string, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  critical: "Nghiêm trọng",
};

function AlertsTable({
  alerts,
  isLoading,
}: {
  alerts: AlertResType[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center border rounded-md bg-muted/20">
        <AlertTriangle className="h-8 w-8 text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground">Không có cảnh báo nào</p>
      </div>
    );
  }
  return (
    <div className="rounded-md border overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="text-left px-3 py-2 font-medium text-muted-foreground w-20">
              Mức độ
            </th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground">
              Cảnh báo
            </th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground w-24">
              Giá trị
            </th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground w-24">
              Ngưỡng
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {alerts.map((a) => (
            <tr
              key={a.id}
              className={`${ALERT_SEVERITY_COLORS[a.severity] ?? ""} transition-colors`}
            >
              <td className="px-3 py-2.5">
                <Badge
                  variant="outline"
                  className={`text-[10px] ${ALERT_SEVERITY_COLORS[a.severity] ?? ""}`}
                >
                  {ALERT_SEVERITY_LABEL[a.severity]}
                </Badge>
              </td>
              <td className="px-3 py-2.5">
                <p className="font-medium leading-snug">{a.title}</p>
                <p className="opacity-70 mt-0.5 line-clamp-2">{a.message}</p>
              </td>
              <td className="px-3 py-2.5 font-mono">{a.actualValue ?? "—"}</td>
              <td className="px-3 py-2.5 font-mono">
                {a.thresholdValue ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MilestoneSensorSection({
  milestone,
}: {
  milestone: ProductionMilestoneResType;
}) {
  const assignmentQuery = useOwnerMilestoneAssignment(milestone.id, true);
  const assignment = assignmentQuery.data?.data?.data ?? null;
  const assignmentId = assignment?.assignmentId ?? "";
  const readingsQuery = useOwnerLatestSensorReadings(
    assignmentId,
    !!assignmentId,
  );
  const readings = readingsQuery.data?.data ?? [];
  const meta = MILESTONE_STATUS_META[milestone.status] ?? {
    label: milestone.status,
    variant: "secondary" as const,
  };

  if (assignmentQuery.isLoading)
    return <Skeleton className="h-48 w-full rounded-lg" />;
  if (!assignment) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-muted-foreground shrink-0">
            #{milestone.milestoneOrder}
          </span>
          <p className="font-semibold truncate">{milestone.stageName}</p>
          <Badge variant={meta.variant} className="text-xs shrink-0">
            {meta.label}
          </Badge>
        </div>
        <Separator className="flex-1" />
        <div className="flex items-center gap-1.5 shrink-0">
          <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {assignment.device.deviceName}
          </span>
        </div>
      </div>
      {readingsQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : readings.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Chưa có dữ liệu cảm biến
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {readings.map((r) => (
            <SensorCard key={r.sensorId} reading={r} />
          ))}
        </div>
      )}
    </div>
  );
}

export function OwnerSensorOverviewTab({
  cropSeason,
}: {
  cropSeason: CropSeasonType;
}) {
  const listQuery = useOwnerListProductionMilestones(cropSeason.id, {
    page: 1,
    limit: 50,
  });
  const milestones = (listQuery.data?.data.data ?? [])
    .slice()
    .sort((a, b) => a.milestoneOrder - b.milestoneOrder);
  const alertsQuery = useListAlerts({ page: 1, limit: 50 });
  const alerts = (alertsQuery.data?.data ?? []).filter((a) => !a.isResolved);

  if (listQuery.isLoading) {
    return (
      <div className="flex gap-4">
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        </div>
        <div className="w-72 space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-5 min-h-[360px]">
      <div className="flex-1 min-w-0 space-y-8">
        {milestones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border rounded-md bg-muted/20">
            <Radio className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Chưa có mốc công việc nào
            </p>
          </div>
        ) : (
          milestones.map((m) => (
            <MilestoneSensorSection key={m.id} milestone={m} />
          ))
        )}
      </div>
      <div className="w-72 xl:w-80 shrink-0">
        <div className="sticky top-4 space-y-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <h4 className="text-sm font-semibold">
              Cảnh báo{" "}
              {alerts.length > 0 && (
                <span className="text-destructive">({alerts.length})</span>
              )}
            </h4>
          </div>
          <AlertsTable alerts={alerts} isLoading={alertsQuery.isLoading} />
        </div>
      </div>
    </div>
  );
}
