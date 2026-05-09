import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Cpu, Radio } from "lucide-react";
import { format } from "date-fns";
import { useOwnerMilestoneAssignment } from "@/queries/useProductionMilestone";
import {
  formatMilestoneIotDeviceWithOptionalCode,
  milestoneIotModuleTypeVi,
} from "@/lib/milestone-iot-display";

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

export function MilestoneIotDetail({ milestoneId }: { milestoneId: string }) {
  const assignmentQuery = useOwnerMilestoneAssignment(milestoneId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assignment = (assignmentQuery.data?.data as any)?.data ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sensors: any[] = assignment?.sensors ?? [];
  const moduleTypeVi =
    assignment != null
      ? milestoneIotModuleTypeVi(assignment.device.deviceType)
      : undefined;

  if (assignmentQuery.isLoading) {
    return (
      <div className="px-4 py-3">
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-background p-3 space-y-2">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Lớp vật lý</p>
        <p className="text-xs font-semibold flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5" />
          Thiết bị IoT
        </p>
        {!assignment ? (
          <p className="text-xs text-muted-foreground">Chưa gán thiết bị.</p>
        ) : (
          <div className="rounded-md border p-2.5 bg-background text-sm space-y-0.5">
            <p className="font-medium text-xs">
              {formatMilestoneIotDeviceWithOptionalCode(assignment.device)}
            </p>
            {moduleTypeVi ? (
              <p className="text-muted-foreground text-xs">
                Loại: {moduleTypeVi}
              </p>
            ) : null}
            <p className="text-muted-foreground text-xs">
              Thời điểm gán:{" "}
              {assignment.assignedAt ? format(new Date(assignment.assignedAt), "dd/MM/yyyy") : "—"}
            </p>
            {assignment.device.isDeleted && (
              <p className="text-xs text-destructive">
                Thiết bị đã bị xóa mềm; dữ liệu hiển thị từ lịch sử gán.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-md border bg-background p-3 space-y-2">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Lớp giám sát</p>
        <p className="text-xs font-semibold flex items-center gap-1.5">
          <Radio className="h-3.5 w-3.5" />
          Cảm biến + ngưỡng
        </p>
        {!assignment ? (
          <p className="text-xs text-muted-foreground">Cần gán thiết bị trước khi quản lý cảm biến.</p>
        ) : sensors.length === 0 ? (
          <p className="text-xs text-muted-foreground">Chưa liên kết cảm biến.</p>
        ) : (
          <div className="space-y-1">
            {sensors.map((s) => (
              <div
                key={s.bindingId}
                className="flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs bg-background"
              >
                <div>
                  <span className="font-medium">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
