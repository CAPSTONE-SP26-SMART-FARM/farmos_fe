import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Cpu, Radio } from "lucide-react";
import { format } from "date-fns";
import { useOwnerListMilestoneAssignments } from "@/queries/useProductionMilestone";
import { SENSOR_TYPE_ICON } from "@/constants/iotDeviceDisplay";
import {
  formatMilestoneIotDeviceWithOptionalCode,
  milestoneIotModuleTypeVi,
} from "@/lib/milestone-iot-display";
import type { MilestoneAssignmentDetailResType } from "@/schemaValidatation/milestoneIotDevice";

const SENSOR_TYPE_LABELS: Record<string, string> = {
  soil_moisture: "Độ ẩm đất",
  air_temperature: "Nhiệt độ không khí",
  air_humidity: "Độ ẩm không khí",
  light_intensity: "Cường độ ánh sáng",
};

function formatThresholdText(sensor: {
  threshold?: { optimalMin: number | null; optimalMax: number | null; source: string } | undefined;
  unit?: string | null;
}) {
  const t = sensor.threshold;
  if (!t || t.optimalMin == null || t.optimalMax == null) return "Chưa cấu hình ngưỡng";
  const unit = sensor.unit ? ` ${sensor.unit}` : "";
  return `${t.optimalMin} - ${t.optimalMax}${unit} (${t.source})`;
}

function AssignmentBlock({
  assignment,
}: {
  assignment: MilestoneAssignmentDetailResType;
}) {
  const sensors = assignment.sensors ?? [];
  const moduleTypeVi = milestoneIotModuleTypeVi(assignment.device.deviceType);

  return (
    <div className="space-y-3">
      <div className="rounded-md border bg-background p-3 space-y-2">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
          Lớp vật lý
        </p>
        <p className="text-xs font-semibold flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5" />
          Thiết bị IoT
        </p>
        <div className="rounded-md border p-2.5 bg-background text-sm space-y-0.5">
          <p className="font-medium text-xs">
            {formatMilestoneIotDeviceWithOptionalCode(assignment.device)}
          </p>
          {moduleTypeVi ? (
            <p className="text-muted-foreground text-xs">Loại: {moduleTypeVi}</p>
          ) : null}
          <p className="text-muted-foreground text-xs">
            Thời điểm gán:{" "}
            {assignment.assignedAt
              ? format(new Date(assignment.assignedAt), "dd/MM/yyyy")
              : "—"}
          </p>
          {assignment.device.isDeleted && (
            <p className="text-xs text-destructive">
              Thiết bị đã bị xóa mềm; dữ liệu hiển thị từ lịch sử gán.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-md border bg-background p-3 space-y-2">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
          Lớp giám sát
        </p>
        <p className="text-xs font-semibold flex items-center gap-1.5">
          <Radio className="h-3.5 w-3.5" />
          Cảm biến + ngưỡng
        </p>
        {sensors.length === 0 ? (
          <p className="text-xs text-muted-foreground">Chưa liên kết cảm biến.</p>
        ) : (
          <div className="space-y-1">
            {sensors.map((s) => {
              const SIcon = SENSOR_TYPE_ICON[s.sensorType];
              return (
                <div
                  key={s.bindingId}
                  className="flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs bg-background"
                >
                  <div>
                    <span className="font-medium inline-flex items-center gap-1.5">
                      {SIcon && <SIcon className="h-3 w-3 text-primary" />}
                      {s.sensorName || SENSOR_TYPE_LABELS[s.sensorType] || s.sensorType}
                    </span>
                    <Badge variant="outline" className="text-[10px] capitalize ml-2">
                      {s.status}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {`${s.sensorName || SENSOR_TYPE_LABELS[s.sensorType] || s.sensorType} (Ngưỡng: ${formatThresholdText(s)}) trên ${assignment.device.deviceName}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function MilestoneIotDetail({ milestoneId }: { milestoneId: string }) {
  const assignmentsQuery = useOwnerListMilestoneAssignments(milestoneId);
  const assignments = assignmentsQuery.data?.data?.data ?? [];

  if (assignmentsQuery.isLoading) {
    return (
      <div className="px-4 py-3">
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="rounded-md border bg-background p-3">
        <p className="text-xs text-muted-foreground">Chưa gán thiết bị.</p>
      </div>
    );
  }

  return (
    <Accordion
      type="multiple"
      defaultValue={assignments.map((a) => a.assignmentId)}
      className="rounded-md border bg-background divide-y"
    >
      {assignments.map((a) => (
        <AccordionItem
          key={a.assignmentId}
          value={a.assignmentId}
          className="px-3"
        >
          <AccordionTrigger className="py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <Cpu className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs font-semibold truncate">
                {a.device.label}
              </span>
              <span className="text-[11px] text-muted-foreground truncate">
                {a.device.deviceName}
              </span>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {a.sensors.length} cảm biến
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <AssignmentBlock assignment={a} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
