import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronLeft, ChevronRight, Cpu, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useManagerListProductionMilestones,
  useManagerListMilestoneAssignments,
} from "@/queries/useProductionMilestone";
import {
  useManagerLatestSensorReadings,
  useMilestoneAssignmentsRealtime,
  useSensorReadingRealtime,
} from "@/queries/useSensorReading";
import SensorCard from "@/pages/SensorReadings/components/SensorCard";
import { useZoneSubscription } from "@/hooks/useZoneSubscription";
import { useListAlerts } from "@/queries/useAlert";
import type { AlertResType } from "@/schemaValidatation/alert";
import type { ProductionMilestoneResType } from "@/schemaValidatation/productionMilestone";
import type {
  ListMilestoneAssignmentsResType,
  MilestoneAssignmentDetailResType,
} from "@/schemaValidatation/milestoneIotDevice";
import type { CropSeasonType } from "@/types/cropSeason";
import { MILESTONE_STATUS_META } from "./helpers";
import IotCoverageWidget from "@/components/common/IotCoverageWidget";

const ALERTS_PAGE_SIZE = 5;

const ALERT_SEVERITY_COLORS: Record<string, string> = {
  low: "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-300",
  medium: "border-orange-300 bg-orange-50 dark:bg-orange-950/20 text-orange-800 dark:text-orange-300",
  high: "border-red-300 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300",
  critical: "border-red-500 bg-red-100 dark:bg-red-950/30 text-red-900 dark:text-red-200",
};

const ALERT_SEVERITY_LABEL: Record<string, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  critical: "Nghiêm trọng",
};

const ALERT_SEVERITY_DOT: Record<string, string> = {
  low: "bg-yellow-400",
  medium: "bg-orange-400",
  high: "bg-red-400",
  critical: "bg-red-600",
};

/**
 * Tra device (board) gắn với `sensorId` từ cache `useManagerListMilestoneAssignments`
 * (đã mount cho mọi milestone in_progress của tab này). BE reading payload chỉ
 * trả `device: { id, label }` nên dùng cache assignments làm nguồn `deviceName`
 * — alert chỉ hiển thị board khi milestone của sensor đó đã load (luôn đúng
 * cho page hiện tại).
 */
function useDeviceBySensorId(
  sensorId: string | null,
): { name: string; label: string | null } | null {
  const queryClient = useQueryClient();
  return useMemo(() => {
    if (!sensorId) return null;
    const entries = queryClient.getQueriesData<{
      data: ListMilestoneAssignmentsResType;
    }>({
      queryKey: ["manager", "production-milestones"],
    });
    for (const [key, res] of entries) {
      if (!Array.isArray(key) || key[key.length - 1] !== "assignments") continue;
      const assignments = res?.data?.data ?? [];
      for (const a of assignments) {
        if (a.sensors.some((s) => s.sensorId === sensorId)) {
          return { name: a.device.deviceName, label: a.device.label };
        }
      }
    }
    return null;
  }, [sensorId, queryClient]);
}

function AlertDetailDialog({
  alert,
  open,
  onOpenChange,
}: {
  alert: AlertResType | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const device = useDeviceBySensorId(alert?.sensorId ?? null);
  if (!alert) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${ALERT_SEVERITY_DOT[alert.severity] ?? "bg-muted"}`} />
            <Badge
              variant="outline"
              className={`text-xs ${ALERT_SEVERITY_COLORS[alert.severity] ?? ""}`}
            >
              {ALERT_SEVERITY_LABEL[alert.severity]}
            </Badge>
          </div>
          <DialogTitle className="text-base leading-snug">{alert.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground leading-relaxed">{alert.message}</p>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
              <p className="text-xs text-muted-foreground mb-1">Giá trị đo</p>
              <p className="font-mono font-semibold text-base">{alert.actualValue ?? "—"}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
              <p className="text-xs text-muted-foreground mb-1">Ngưỡng an toàn</p>
              <p className="font-mono font-semibold text-base">{alert.thresholdValue ?? "—"}</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Khu vực</span>
              <span className="font-medium text-foreground">{alert.zoneName}</span>
            </div>
            <div className="flex justify-between">
              <span>Trang trại</span>
              <span className="font-medium text-foreground">{alert.farmName}</span>
            </div>
            {device && (
              <div className="flex justify-between">
                <span className="inline-flex items-center gap-1">
                  <Cpu className="h-3 w-3" />
                  Bo mạch
                </span>
                <span className="font-medium text-foreground">
                  {device.name}
                  {device.label && (
                    <span className="ml-1 font-mono text-muted-foreground">({device.label})</span>
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Loại cảnh báo</span>
              <span className="font-medium text-foreground">{alert.alertType}</span>
            </div>
            <div className="flex justify-between">
              <span>Thời điểm</span>
              <span className="font-medium text-foreground">
                {new Date(alert.createdAt).toLocaleString("vi-VN")}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Trạng thái</span>
              <span className={`font-medium ${alert.isResolved ? "text-green-600" : "text-destructive"}`}>
                {alert.isResolved ? "Đã xử lý" : "Chưa xử lý"}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AlertsPanel({ isLoading }: { isLoading: boolean }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AlertResType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const query = useListAlerts({ page, limit: ALERTS_PAGE_SIZE });
  const raw = query.data?.data ?? [];
  const meta = query.data?.meta;
  const alerts = raw.filter((a) => !a.isResolved);
  const totalItems = meta?.totalItems ?? 0;
  const totalPages = meta?.totalPages ?? 1;

  function handleClick(a: AlertResType) {
    setSelected(a);
    setDialogOpen(true);
  }

  if (isLoading || query.isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
      </div>
    );
  }

  if (alerts.length === 0 && page === 1) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center border rounded-lg bg-muted/20">
        <AlertTriangle className="h-8 w-8 text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground">Không có cảnh báo nào</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1.5">
        {alerts.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => handleClick(a)}
            className={`w-full text-left flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs transition-colors hover:brightness-95 cursor-pointer ${ALERT_SEVERITY_COLORS[a.severity] ?? ""}`}
          >
            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${ALERT_SEVERITY_DOT[a.severity] ?? "bg-muted"}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 h-4 shrink-0 ${ALERT_SEVERITY_COLORS[a.severity] ?? ""}`}
                >
                  {ALERT_SEVERITY_LABEL[a.severity]}
                </Badge>
                <p className="font-semibold truncate leading-tight">{a.title}</p>
              </div>
              <p className="opacity-70 truncate">{a.message}</p>
            </div>
            <div className="shrink-0 text-right space-y-0.5">
              <p className="font-mono font-semibold">{a.actualValue ?? "—"}</p>
              <p className="font-mono opacity-60 text-[10px]">/ {a.thresholdValue ?? "—"}</p>
            </div>
          </button>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground">
            {totalItems} cảnh báo · trang {page}/{totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <AlertDetailDialog alert={selected} open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

function KitReadingsSection({
  assignment,
  showDeviceHeading,
}: {
  assignment: MilestoneAssignmentDetailResType;
  showDeviceHeading: boolean;
}) {
  const navigate = useNavigate();
  const assignmentId = assignment.assignmentId;
  const readingsQuery = useManagerLatestSensorReadings(assignmentId, !!assignmentId);
  const readings = readingsQuery.data?.data ?? [];
  useSensorReadingRealtime(assignmentId, "manager");

  function goToDetail(sensorId: string) {
    navigate(
      `/dashboard/manager/sensor-readings/${assignmentId}/sensors/${sensorId}`,
    );
  }

  const device = assignment.device;
  const statusActive = device?.status === "active";
  const statusDot = statusActive
    ? "bg-emerald-500"
    : device?.status === "error"
      ? "bg-red-500"
      : "bg-amber-500";

  return (
    <div className="rounded-xl border-2 border-muted-foreground/20 bg-background shadow-sm overflow-hidden">
      {showDeviceHeading && device && (
        <div className="flex items-center gap-2.5 bg-muted/70 border-b-2 border-muted-foreground/15 px-3.5 py-2.5">
          <div className="relative flex items-center justify-center h-9 w-9 rounded-md bg-background border shadow-sm shrink-0">
            <Cpu className="h-4 w-4 text-foreground/70" />
            <span
              className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-muted/70 ${statusDot}`}
            />
          </div>
          <div className="flex flex-col min-w-0 flex-1 leading-tight">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-semibold text-foreground truncate">
                {device.deviceName}
              </span>
              {device.label && (
                <span className="font-mono text-xs text-muted-foreground shrink-0">
                  {device.label}
                </span>
              )}
            </div>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
              {device.deviceType}
            </span>
          </div>
          <Badge
            variant={statusActive ? "default" : "outline"}
            className="text-[10px] px-2 py-0 h-5 shrink-0 bg-background"
          >
            {device.status}
          </Badge>
        </div>
      )}
      <div className="p-3">
        {readingsQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36" />)}
          </div>
        ) : readings.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Chưa có dữ liệu cảm biến</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {readings.map((r) => (
              <button
                key={r.sensorId}
                type="button"
                onClick={() => goToDetail(r.sensorId)}
                className="text-left rounded-lg transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                title="Xem chi tiết cảm biến"
              >
                <SensorCard reading={r} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MilestoneSensorSection({ milestone }: { milestone: ProductionMilestoneResType }) {
  const assignmentsQuery = useManagerListMilestoneAssignments(milestone.id, true);
  const assignments = assignmentsQuery.data?.data?.data ?? [];
  const zoneId = assignments[0]?.zoneId ?? "";
  useZoneSubscription(zoneId || undefined);
  const meta = MILESTONE_STATUS_META[milestone.status] ?? {
    label: milestone.status,
    variant: "secondary" as const,
  };

  if (assignmentsQuery.isLoading) return <Skeleton className="h-48 w-full rounded-lg" />;
  if (assignments.length === 0) return null;

  const hasMultipleKits = assignments.length > 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-muted-foreground shrink-0">
            #{milestone.milestoneOrder}
          </span>
          <p className="font-semibold truncate">{milestone.stageName}</p>
          <Badge variant={meta.variant} className="text-xs shrink-0">{meta.label}</Badge>
          {hasMultipleKits && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
              {assignments.length} bộ kit
            </Badge>
          )}
        </div>
        <Separator className="flex-1" />
      </div>
      <div className="space-y-4">
        {assignments.map((a) => (
          <KitReadingsSection
            key={a.assignmentId}
            assignment={a}
            showDeviceHeading
          />
        ))}
      </div>
    </div>
  );
}

export function SensorOverviewTab({ cropSeason }: { cropSeason: CropSeasonType }) {
  // Subscribe zone-room ở cấp tab để badge install → active cập nhật ngay
  // dù user chưa mở dialog chi tiết bo mạch.
  useZoneSubscription(cropSeason.zoneId);
  useMilestoneAssignmentsRealtime("manager");

  const listQuery = useManagerListProductionMilestones(cropSeason.id, { page: 1, limit: 50 });
  const milestones = (listQuery.data?.data.data ?? [])
    .filter((m) => m.status === "in_progress")
    .slice()
    .sort((a, b) => a.milestoneOrder - b.milestoneOrder);

  if (listQuery.isLoading) {
    return (
      <div className="flex gap-4">
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36" />)}
          </div>
        </div>
        <div className="w-72 space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-5 min-h-90">
      <div className="flex-1 min-w-0 space-y-6">
        {/* Manager không có endpoint kit-list nên không hiển thị picker —
            vẫn xem được zoneArea / currentActive / status. */}
        <IotCoverageWidget zoneId={cropSeason.zoneId} />
        {milestones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border rounded-md bg-muted/20">
            <Radio className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Chưa có mốc công việc nào đang chạy</p>
          </div>
        ) : (
          milestones.map((m) => <MilestoneSensorSection key={m.id} milestone={m} />)
        )}
      </div>
      <div className="w-72 xl:w-80 shrink-0">
        <div className="sticky top-4 space-y-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <h4 className="text-sm font-semibold">Cảnh báo</h4>
          </div>
          <AlertsPanel isLoading={listQuery.isLoading} />
        </div>
      </div>
    </div>
  );
}
