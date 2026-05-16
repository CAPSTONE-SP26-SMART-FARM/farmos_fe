import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, ClipboardList, Cpu, XCircle } from "lucide-react";
import { useState } from "react";
import { useOwnerMilestoneAssignment } from "@/queries/useProductionMilestone";
import type { ProductionMilestoneResType } from "@/schemaValidatation/productionMilestone";
import type { AssignmentBoundSensorResSchema } from "@/schemaValidatation/milestoneIotDevice";
import type { z } from "zod";
import OwnerMilestoneTasksSection from "@/pages/OwnerPage/EmployeeTasks/OwnerMilestoneTasksSection";
import { getSensorMeta } from "@/pages/SensorReadings/utils/sensorDashboard";
import {
  MILESTONE_STATUS_META,
  formatDate,
} from "@/pages/ManagerPage/CropSeasons/components/helpers";
import {
  formatMilestoneIotLinkedSensorsSubtitle,
} from "@/lib/milestone-iot-display";

type BoundSensor = z.infer<typeof AssignmentBoundSensorResSchema>;

/**
 * Owner-side variant of MilestoneDetailPane.
 * - Uses useOwnerMilestoneAssignment instead of manager's hook.
 * - Uses OwnerMilestoneTasksSection (read-only, canEdit=false).
 * - No "Cấu hình" wizard button (owner has no FE plumbing for milestone CRUD).
 * - Falls back to list-row data for milestone fields (no useOwnerGetMilestoneDetail
 *   hook exists; the list row already carries the fields we render).
 */

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

function IotConfigContent({
  sensors,
  device,
}: {
  sensors: BoundSensor[];
  device: {
    deviceName: string;
    deviceCode: string;
    deviceType: string;
  };
}) {
  return (
    <div className="space-y-3">
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

function IotConfigTab({ milestoneId }: { milestoneId: string }) {
  const assignmentQuery = useOwnerMilestoneAssignment(milestoneId, true);
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
        <span className="text-amber-700 dark:text-amber-400">
          Chưa gán thiết bị IoT
        </span>
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

function MilestoneInfoTab({
  milestone,
}: {
  milestone: ProductionMilestoneResType;
}) {
  return (
    <dl className="space-y-1.5 pt-1 text-sm">
      {(milestone.expectedStartDate || milestone.expectedEndDate) && (
        <div className="flex items-baseline gap-2">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 translate-y-0.5 text-muted-foreground" />
          <dt className="text-muted-foreground">Kế hoạch:</dt>
          <dd>
            {formatDate(milestone.expectedStartDate)} →{" "}
            {formatDate(milestone.expectedEndDate)}
          </dd>
        </div>
      )}
      {(milestone.actualStartDate || milestone.actualEndDate) && (
        <div className="flex items-baseline gap-2">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 translate-y-0.5 text-muted-foreground opacity-60" />
          <dt className="text-muted-foreground">Thực tế:</dt>
          <dd>
            {formatDate(milestone.actualStartDate)} →{" "}
            {formatDate(milestone.actualEndDate)}
          </dd>
        </div>
      )}
    </dl>
  );
}

export function OwnerMilestoneDetailPane({
  milestone,
  isWizardState,
}: {
  milestone: ProductionMilestoneResType;
  isWizardState: boolean;
}) {
  const meta = MILESTONE_STATUS_META[milestone.status] ?? {
    label: milestone.status,
    variant: "secondary" as const,
  };

  return (
    <div className="space-y-3 overflow-y-auto">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-muted-foreground">
            #{milestone.milestoneOrder}
          </span>
          <h3 className="font-semibold text-base">{milestone.stageName}</h3>
          <Badge variant={meta.variant} className="text-xs">
            {meta.label}
          </Badge>
        </div>
      </div>

      <MilestoneInfoTab milestone={milestone} />

      <Separator />

      {!isWizardState ? (
        <Tabs defaultValue="tasks">
          <TabsList className="h-8">
            <TabsTrigger
              value="tasks"
              className="text-xs h-7 flex items-center gap-1.5"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Nhiệm vụ
            </TabsTrigger>
            <TabsTrigger
              value="iot"
              className="text-xs h-7 flex items-center gap-1.5"
            >
              <Cpu className="h-3.5 w-3.5" />
              Cấu hình IoT
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-3">
            <OwnerMilestoneTasksSection
              milestoneId={milestone.id}
              canEdit={false}
            />
          </TabsContent>

          <TabsContent value="iot" className="mt-3">
            <IotConfigTab milestoneId={milestone.id} />
          </TabsContent>
        </Tabs>
      ) : (
        <Tabs defaultValue="iot">
          <TabsList className="h-8">
            <TabsTrigger
              value="iot"
              className="text-xs h-7 flex items-center gap-1.5"
            >
              <Cpu className="h-3.5 w-3.5" />
              IoT &amp; Cảm biến
            </TabsTrigger>
          </TabsList>
          <TabsContent value="iot" className="mt-3">
            <IotConfigTab milestoneId={milestone.id} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
