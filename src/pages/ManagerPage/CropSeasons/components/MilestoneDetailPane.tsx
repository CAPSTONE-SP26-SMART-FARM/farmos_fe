import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Cpu, Settings, XCircle } from "lucide-react";
import { useManagerLatestSensorReadings } from "@/queries/useSensorReading";
import {
  useManagerMilestoneAssignment,
  useManagerGetMilestoneDetail,
} from "@/queries/useProductionMilestone";
import type { ProductionMilestoneResType } from "@/schemaValidatation/productionMilestone";
import type { CropSeasonType } from "@/types/cropSeason";
import SensorCard from "@/pages/SensorReadings/components/SensorCard";
import { MILESTONE_STATUS_META, formatDate } from "./helpers";

export function MilestoneDetailPane({
  milestone: listMilestone,
  cropSeason,
  isWizardState,
  onGoConfig,
}: {
  milestone: ProductionMilestoneResType;
  cropSeason: CropSeasonType;
  isWizardState: boolean;
  onGoConfig: () => void;
}) {
  const detailQuery = useManagerGetMilestoneDetail(listMilestone.id, cropSeason.id, true);
  const milestone = detailQuery.data?.data ?? listMilestone;

  const assignmentQuery = useManagerMilestoneAssignment(milestone.id, true);
  const assignment = assignmentQuery.data?.data?.data ?? null;
  const assignmentId = assignment?.assignmentId ?? "";
  const readingsQuery = useManagerLatestSensorReadings(assignmentId, !!assignmentId);
  const readings = readingsQuery.data?.data ?? [];
  const meta = MILESTONE_STATUS_META[milestone.status] ?? {
    label: milestone.status,
    variant: "secondary" as const,
  };

  return (
    <div className="space-y-4 overflow-y-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">#{milestone.milestoneOrder}</span>
            <h3 className="font-semibold text-base">{milestone.stageName}</h3>
            <Badge variant={meta.variant} className="text-xs">{meta.label}</Badge>
            {detailQuery.isLoading && (
              <span className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            )}
          </div>
          {(milestone.expectedStartDate || milestone.expectedEndDate) && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {formatDate(milestone.expectedStartDate)} → {formatDate(milestone.expectedEndDate)}
            </p>
          )}
          {(milestone.actualStartDate || milestone.actualEndDate) && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <CalendarDays className="h-3 w-3 opacity-50" />
              Thực tế: {formatDate(milestone.actualStartDate)} → {formatDate(milestone.actualEndDate)}
            </p>
          )}
        </div>
        {isWizardState && (
          <Button size="sm" variant="outline" onClick={onGoConfig}>
            <Settings className="h-3 w-3 mr-1.5" />
            Cấu hình
          </Button>
        )}
      </div>

      <Separator />

      {assignmentQuery.isLoading ? (
        <Skeleton className="h-12 w-full" />
      ) : !assignment ? (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 px-3 py-2.5 text-sm">
          <XCircle className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="text-amber-700 dark:text-amber-400">Chưa gán thiết bị IoT</span>
          {isWizardState && (
            <Button size="sm" variant="outline" onClick={onGoConfig} className="ml-auto h-7 text-xs">
              Cấu hình IoT
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm">
            <Cpu className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="font-medium truncate">{assignment.device.deviceName}</p>
              <p className="text-xs text-muted-foreground">{assignment.sensors.length} cảm biến liên kết</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">Hoạt động</span>
            </div>
          </div>
          {readingsQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36 w-full" />)}
            </div>
          ) : readings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Chưa có dữ liệu cảm biến</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {readings.map((r) => <SensorCard key={r.sensorId} reading={r} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
