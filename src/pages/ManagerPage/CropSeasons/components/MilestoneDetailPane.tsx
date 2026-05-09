import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, CheckCircle2, ClipboardList, Cpu, Info, Loader2, PlayCircle, Settings, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useManagerMilestoneAssignment,
  useManagerGetMilestoneDetail,
  useManagerUpdateProductionMilestone,
} from "@/queries/useProductionMilestone";
import type { ProductionMilestoneResType } from "@/schemaValidatation/productionMilestone";
import type {
  AssignmentBoundSensorResSchema,
  AssignmentDeviceResSchema,
} from "@/schemaValidatation/milestoneIotDevice";
import type { z } from "zod";
import type { CropSeasonType } from "@/types/cropSeason";
import ManagerMilestoneTasksSection from "@/pages/ManagerPage/EmployeeTasks/ManagerMilestoneTasksSection";
import { getSensorMeta } from "@/pages/SensorReadings/utils/sensorDashboard";
import { MILESTONE_STATUS_META, formatDate } from "./helpers";
import {
  formatMilestoneIotLinkedSensorsSubtitle,
} from "@/lib/milestone-iot-display";

type BoundSensor = z.infer<typeof AssignmentBoundSensorResSchema>;
type AssignmentDeviceType = z.infer<typeof AssignmentDeviceResSchema>;

// ─────────────────────────────────────────────────────────────
// Sensor row with device threshold + safe threshold + toggle
// ─────────────────────────────────────────────────────────────

function SensorConfigRow({ sensor }: { sensor: BoundSensor }) {
  const [showDeviceRange, setShowDeviceRange] = useState(false);

  const meta = getSensorMeta(sensor.sensorType);
  const Icon = meta.icon;
  const unit = sensor.unit || meta.unit;
  const { optimalMin, optimalMax } = sensor.threshold;
  const deviceMin = sensor.minValue ?? null;
  const deviceMax = sensor.maxValue ?? null;
  const hasDeviceRange = deviceMin !== null && deviceMax !== null;

  const withUnit = (v: number | null) =>
    v !== null ? `${v}${unit ? ` ${unit}` : ""}` : "—";

  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2.5 space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-sm font-medium truncate">
            {sensor.sensorName || meta.label}
          </p>
        </div>
        <Badge
          variant={sensor.status === "active" ? "default" : "secondary"}
          className="text-[10px] shrink-0"
        >
          {sensor.status === "active" ? "Hoạt động" : sensor.status}
        </Badge>
      </div>

      <Separator className="opacity-50" />

      {/* Ngưỡng an toàn */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Ngưỡng an toàn</span>
        <div className="flex items-center gap-1.5">
          <span className="font-medium">
            {optimalMin !== null || optimalMax !== null
              ? `${withUnit(optimalMin)} – ${withUnit(optimalMax)}`
              : "Chưa cấu hình"}
          </span>
        </div>
      </div>

      {/* Ngưỡng thiết bị */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Ngưỡng thiết bị</span>
        {hasDeviceRange ? (
          <div className="flex items-center gap-1.5">
            {showDeviceRange && (
              <span className="font-medium">
                {withUnit(deviceMin)} – {withUnit(deviceMax)}
              </span>
            )}
            <Switch
              checked={showDeviceRange}
              onCheckedChange={setShowDeviceRange}
              className="scale-75 origin-right"
            />
          </div>
        ) : (
          <span className="text-muted-foreground italic text-[10px]">
            Chờ backend bổ sung
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// IoT Config Tab
// ─────────────────────────────────────────────────────────────

function IotConfigContent({
  sensors,
  device,
}: {
  sensors: BoundSensor[];
  device: AssignmentDeviceType;
}) {
  return (
    <div className="space-y-3">
      {/* Device info */}
      <div className="flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm">
        <Cpu className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="font-medium truncate">
            {device.deviceName?.trim() || "Thiết bị không xác định"}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatMilestoneIotLinkedSensorsSubtitle(device, sensors.length)}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">Hoạt động</span>
        </div>
      </div>

      {/* Sensors */}
      {sensors.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Chưa có cảm biến nào được liên kết
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Cảm biến & Ngưỡng
          </p>
          {sensors.map((sensor) => (
            <SensorConfigRow key={sensor.sensorId} sensor={sensor} />
          ))}
        </div>
      )}
    </div>
  );
}

function IotConfigTab({
  milestoneId,
  isWizardState,
  onGoConfig,
}: {
  milestoneId: string;
  isWizardState: boolean;
  onGoConfig: () => void;
}) {
  const assignmentQuery = useManagerMilestoneAssignment(milestoneId, true);
  const assignment = assignmentQuery.data?.data?.data ?? null;

  if (assignmentQuery.isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 px-3 py-2.5 text-sm">
        <XCircle className="h-4 w-4 text-amber-500 shrink-0" />
        <span className="text-amber-700 dark:text-amber-400">Chưa gán thiết bị IoT</span>
        {isWizardState && (
          <Button size="sm" variant="outline" onClick={onGoConfig} className="ml-auto h-7 text-xs">
            Cấu hình IoT
          </Button>
        )}
      </div>
    );
  }

  return (
    <IotConfigContent
      sensors={assignment.sensors}
      device={assignment.device}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Milestone Info Tab
// ─────────────────────────────────────────────────────────────

function MilestoneInfoTab({
  milestone,
  isLoading,
}: {
  milestone: ProductionMilestoneResType;
  isLoading: boolean;
}) {
  const meta = MILESTONE_STATUS_META[milestone.status] ?? {
    label: milestone.status,
    variant: "secondary" as const,
  };
  return (
    <div className="space-y-3 pt-1">
      {isLoading && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Đang tải...
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border bg-muted/30 px-3 py-2.5 space-y-0.5">
          <p className="text-xs text-muted-foreground">Thứ tự</p>
          <p className="text-sm font-medium">#{milestone.milestoneOrder}</p>
        </div>
        <div className="rounded-md border bg-muted/30 px-3 py-2.5 space-y-0.5">
          <p className="text-xs text-muted-foreground">Trạng thái</p>
          <Badge variant={meta.variant} className="text-xs">
            {meta.label}
          </Badge>
        </div>
      </div>
      {(milestone.expectedStartDate || milestone.expectedEndDate) && (
        <div className="rounded-md border bg-muted/30 px-3 py-2.5 space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            Kế hoạch
          </p>
          <p className="text-sm">
            {formatDate(milestone.expectedStartDate)} → {formatDate(milestone.expectedEndDate)}
          </p>
        </div>
      )}
      {(milestone.actualStartDate || milestone.actualEndDate) && (
        <div className="rounded-md border bg-muted/30 px-3 py-2.5 space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <CalendarDays className="h-3 w-3 opacity-60" />
            Thực tế
          </p>
          <p className="text-sm">
            {formatDate(milestone.actualStartDate)} → {formatDate(milestone.actualEndDate)}
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────

export function MilestoneDetailPane({
  milestone: listMilestone,
  cropSeason,
  isWizardState,
  allMilestones = [],
  onSelectMilestone,
  onGoConfig,
}: {
  milestone: ProductionMilestoneResType;
  cropSeason: CropSeasonType;
  isWizardState: boolean;
  allMilestones?: ProductionMilestoneResType[];
  onSelectMilestone?: (id: string) => void;
  onGoConfig: () => void;
}) {
  const detailQuery = useManagerGetMilestoneDetail(listMilestone.id, cropSeason.id, true);
  const milestone = detailQuery.data?.data ?? listMilestone;

  const meta = MILESTONE_STATUS_META[milestone.status] ?? {
    label: milestone.status,
    variant: "secondary" as const,
  };

  const isOperational = !isWizardState;

  const [confirmStart, setConfirmStart] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const qc = useQueryClient();
  const { mutate: updateMilestone, isPending: isUpdating } =
    useManagerUpdateProductionMilestone(cropSeason.id);

  // BR: cho "Bắt đầu" khi:
  //  - milestone đang pending,
  //  - mọi milestone trước (theo order) đã completed,
  //  - không có milestone khác đang in_progress,
  //  - cropSeason ở active, HOẶC approved + đây là milestone đầu tiên
  //    (BE sẽ auto-activate cropSeason khi first milestone in_progress).
  const sortedAsc = [...allMilestones].sort(
    (a, b) => a.milestoneOrder - b.milestoneOrder,
  );
  const isFirstMilestone = sortedAsc[0]?.id === milestone.id;
  const earlierAllCompleted = sortedAsc
    .filter((m) => m.milestoneOrder < milestone.milestoneOrder)
    .every((m) => m.status === "completed");
  const noOtherInProgress = sortedAsc.every(
    (m) => m.id === milestone.id || m.status !== "in_progress",
  );
  const seasonAllowsStart =
    cropSeason.status === "active" ||
    (cropSeason.status === "approved" && isFirstMilestone);
  const canStart =
    seasonAllowsStart &&
    milestone.status === "pending" &&
    earlierAllCompleted &&
    noOtherInProgress;
  const canComplete =
    cropSeason.status === "active" && milestone.status === "in_progress";

  const nextMilestone = sortedAsc.find(
    (m) => m.milestoneOrder > milestone.milestoneOrder,
  );

  const handleStart = () => {
    // BE: cấm gửi actualStartDate khi cropSeason chưa active
    // (MilestoneActualDateRequiresActiveSeasonException).
    // Khi cropSeason approved → chỉ gửi status; BE sẽ auto-activate.
    // Gửi YYYY-MM-DD; service tự append "T00:00:00Z" trước khi gọi BE.
    const today = format(new Date(), "yyyy-MM-dd");
    const willActivateSeason =
      cropSeason.status === "approved" && isFirstMilestone;
    const body =
      cropSeason.status === "active"
        ? { status: "in_progress" as const, actualStartDate: today }
        : { status: "in_progress" as const };
    updateMilestone(
      { milestoneId: milestone.id, body },
      {
        onSuccess: () => {
          if (willActivateSeason) {
            // BE auto-activate cropSeason khi mốc đầu tiên start → tab "Cảm
            // biến" mới khả dụng và pipeline sensor bắt đầu chạy. Refetch
            // assignment + readings + alerts để tab Cảm biến hiển thị đúng
            // ngay khi user mở.
            qc.invalidateQueries({
              queryKey: ["manager", "production-milestones", "assignment"],
            });
            qc.invalidateQueries({
              queryKey: ["manager", "sensor-readings"],
            });
            qc.invalidateQueries({ queryKey: ["alerts"] });
          }
        },
        onSettled: () => setConfirmStart(false),
      },
    );
  };

  const handleComplete = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    updateMilestone(
      {
        milestoneId: milestone.id,
        body: { status: "completed", actualEndDate: today },
      },
      {
        onSuccess: () => {
          if (nextMilestone && onSelectMilestone) {
            onSelectMilestone(nextMilestone.id);
          }
        },
        onSettled: () => setConfirmComplete(false),
      },
    );
  };

  return (
    <div className="space-y-3 overflow-y-auto">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-muted-foreground">#{milestone.milestoneOrder}</span>
          <h3 className="font-semibold text-base">{milestone.stageName}</h3>
          <Badge variant={meta.variant} className="text-xs">
            {meta.label}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {canStart && (
            <Button
              size="sm"
              variant="default"
              className="h-7"
              onClick={() => setConfirmStart(true)}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <PlayCircle className="h-3 w-3 mr-1" />
              )}
              Bắt đầu
            </Button>
          )}
          {canComplete && (
            <Button
              size="sm"
              className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setConfirmComplete(true)}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              )}
              Hoàn thành
            </Button>
          )}
          {isWizardState && (
            <Button size="sm" variant="outline" className="h-7" onClick={onGoConfig}>
              <Settings className="h-3 w-3 mr-1" />
              Cấu hình
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmStart}
        title="Bắt đầu mốc công việc?"
        description={`Đánh dấu mốc "${milestone.stageName}" là đang thực hiện. Ngày bắt đầu thực tế sẽ được ghi nhận là hôm nay.`}
        confirmLabel={isUpdating ? "Đang xử lý..." : "Bắt đầu"}
        cancelLabel="Hủy"
        onCancel={() => {
          if (!isUpdating) setConfirmStart(false);
        }}
        onConfirm={handleStart}
      />

      <ConfirmDialog
        open={confirmComplete}
        title="Hoàn thành mốc công việc?"
        description={`Đánh dấu mốc "${milestone.stageName}" là hoàn thành.${
          nextMilestone
            ? ` Sau khi hoàn thành, hệ thống sẽ chuyển sang mốc tiếp theo "${nextMilestone.stageName}".`
            : " Đây là mốc cuối cùng."
        }`}
        confirmLabel={isUpdating ? "Đang xử lý..." : "Hoàn thành"}
        cancelLabel="Hủy"
        onCancel={() => {
          if (!isUpdating) setConfirmComplete(false);
        }}
        onConfirm={handleComplete}
      />

      <Separator />

      {isOperational ? (
        <Tabs defaultValue="detail">
          <TabsList className="h-8">
            <TabsTrigger value="detail" className="text-xs h-7 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              Chi tiết
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs h-7 flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" />
              Nhiệm vụ
            </TabsTrigger>
            <TabsTrigger value="iot" className="text-xs h-7 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5" />
              Cấu hình IoT
            </TabsTrigger>
          </TabsList>

          <TabsContent value="detail" className="mt-3">
            <MilestoneInfoTab milestone={milestone} isLoading={detailQuery.isLoading} />
          </TabsContent>

          <TabsContent value="tasks" className="mt-3">
            <ManagerMilestoneTasksSection milestoneId={milestone.id} canEdit={false} />
          </TabsContent>

          <TabsContent value="iot" className="mt-3">
            <IotConfigTab milestoneId={milestone.id} isWizardState={false} onGoConfig={onGoConfig} />
          </TabsContent>
        </Tabs>
      ) : (
        <Tabs defaultValue="iot">
          <TabsList className="h-8">
            <TabsTrigger value="iot" className="text-xs h-7 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5" />
              IoT &amp; Cảm biến
            </TabsTrigger>
          </TabsList>
          <TabsContent value="iot" className="mt-3">
            <IotConfigTab milestoneId={milestone.id} isWizardState={true} onGoConfig={onGoConfig} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
