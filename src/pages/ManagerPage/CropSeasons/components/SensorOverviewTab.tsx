import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Radio,
  Search,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useManagerListProductionMilestones,
  useManagerListMilestoneAssignments,
  useManagerSearchMilestoneAssignments,
} from "@/queries/useProductionMilestone";
import useDebounce from "@/hooks/useDebounce";
import {
  DEVICE_STATUS_VALUES,
  type DeviceStatusType,
} from "@/schemaValidatation/milestoneIotDevice";
import {
  DEVICE_STATUS_META,
  DeviceStatusBadge,
} from "./MilestoneAssignmentsList";
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
import { cn } from "@/lib/utils";
import { MILESTONE_STATUS_META } from "./helpers";
import IotCoverageWidget from "@/components/common/IotCoverageWidget";
import { ReportFaultButton } from "@/components/iot-kit-request/ReportFaultButton";

const KIT_PAGE_SIZE = 5;
const STATUS_FILTER_ALL = "__all__";

// Thứ tự hiển thị card cảm biến cố định để tránh nhảy vị trí mỗi khi
// `useManagerLatestSensorReadings` refetch (polling 60s + invalidate socket).
// BE trả `data` không stable-sort nên phải sort ở FE; sensorId là tiebreaker.
const SENSOR_TYPE_ORDER: Record<string, number> = {
  soil_moisture: 0,
  air_temperature: 1,
  air_humidity: 2,
  light_intensity: 3,
};

const ALERTS_PAGE_SIZE = 5;

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
      if (!Array.isArray(key) || key[key.length - 1] !== "assignments")
        continue;
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
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${ALERT_SEVERITY_DOT[alert.severity] ?? "bg-muted"}`}
            />
            <Badge
              variant="outline"
              className={`text-xs ${ALERT_SEVERITY_COLORS[alert.severity] ?? ""}`}
            >
              {ALERT_SEVERITY_LABEL[alert.severity]}
            </Badge>
          </div>
          <DialogTitle className="text-base leading-snug">
            {alert.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground leading-relaxed">
            {alert.message}
          </p>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
              <p className="text-xs text-muted-foreground mb-1">Giá trị đo</p>
              <p className="font-mono font-semibold text-base">
                {alert.actualValue ?? "—"}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
              <p className="text-xs text-muted-foreground mb-1">
                Ngưỡng an toàn
              </p>
              <p className="font-mono font-semibold text-base">
                {alert.thresholdValue ?? "—"}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Khu vực</span>
              <span className="font-medium text-foreground">
                {alert.zoneName}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Trang trại</span>
              <span className="font-medium text-foreground">
                {alert.farmName}
              </span>
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
                    <span className="ml-1 font-mono text-muted-foreground">
                      ({device.label})
                    </span>
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Thời điểm</span>
              <span className="font-medium text-foreground">
                {new Date(alert.createdAt).toLocaleString("vi-VN")}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AlertsPanel({ isLoading, zoneId }: { isLoading: boolean; zoneId: string }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AlertResType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const query = useListAlerts(
    { page, limit: ALERTS_PAGE_SIZE, zoneId },
    !!zoneId,
  );
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
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            className="h-14 w-full rounded-lg"
          />
        ))}
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
            <span
              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${ALERT_SEVERITY_DOT[a.severity] ?? "bg-muted"}`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 h-4 shrink-0 ${ALERT_SEVERITY_COLORS[a.severity] ?? ""}`}
                >
                  {ALERT_SEVERITY_LABEL[a.severity]}
                </Badge>
                <p className="font-semibold truncate leading-tight">
                  {a.title}
                </p>
              </div>
              <p className="opacity-70 truncate">{a.message}</p>
            </div>
            <div className="shrink-0 text-right space-y-0.5">
              <p className="font-mono font-semibold">{a.actualValue ?? "—"}</p>
              <p className="font-mono opacity-60 text-[10px]">
                / {a.thresholdValue ?? "—"}
              </p>
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

      <AlertDetailDialog
        alert={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}

function KitReadingsBody({
  assignmentId,
  backUrl,
}: {
  assignmentId: string;
  /**
   * Optional — khi truyền, sensor detail page sẽ dùng URL này làm điểm về
   * (qua query param `from`). Vd: từ milestone view muốn quay lại đúng tab
   * cảm biến của mốc thay vì zone landing mặc định.
   */
  backUrl?: string;
}) {
  const navigate = useNavigate();
  const readingsQuery = useManagerLatestSensorReadings(
    assignmentId,
    !!assignmentId,
  );
  const rawReadings = readingsQuery.data?.data ?? [];
  const readings = useMemo(() => {
    return [...rawReadings].sort((a, b) => {
      const oa = SENSOR_TYPE_ORDER[a.sensorType] ?? 99;
      const ob = SENSOR_TYPE_ORDER[b.sensorType] ?? 99;
      if (oa !== ob) return oa - ob;
      return a.sensorId.localeCompare(b.sensorId);
    });
  }, [rawReadings]);
  // Skip device lifecycle — `useMilestoneAssignmentsRealtime` ở MilestoneSensorSection
  // đã cover IotDevice* events, tránh trùng invalidate cùng query key.
  useSensorReadingRealtime(assignmentId, "manager", {
    skipDeviceLifecycle: true,
  });

  function goToDetail(sensorId: string) {
    const base = `/dashboard/manager/sensor-readings/${assignmentId}/sensors/${sensorId}`;
    const url = backUrl ? `${base}?from=${encodeURIComponent(backUrl)}` : base;
    navigate(url);
  }

  return (
    <div className="p-3">
      {readingsQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              className="h-36"
            />
          ))}
        </div>
      ) : readings.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Chưa có dữ liệu cảm biến
        </p>
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
  );
}

function KitReadingsSection({
  assignment,
  showDeviceHeading,
  backUrl,
  milestoneStatus,
}: {
  assignment: MilestoneAssignmentDetailResType;
  showDeviceHeading: boolean;
  backUrl?: string;
  milestoneStatus?: string;
}) {
  const [open, setOpen] = useState(false);
  const assignmentId = assignment.assignmentId;
  const device = assignment.device;
  const sensorCount = assignment.sensors?.length ?? 0;
  // Khi board active nhưng milestone chưa start (vd reuse từ M trước), board
  // đang ở trạng thái "Chờ giai đoạn bắt đầu" — dot phải khớp badge (zinc),
  // không show xanh "đang chảy data" gây hiểu nhầm.
  const isWaitingMilestoneStart =
    device?.status === "active" && milestoneStatus === "pending";
  const statusDot = isWaitingMilestoneStart
    ? "bg-zinc-400"
    : device?.status === "active"
      ? "bg-emerald-500"
      : device?.status === "error"
        ? "bg-red-500"
        : "bg-amber-500";

  // Khi không có header → không có trigger; mount body trực tiếp để giữ
  // tương thích ngược (hiện tại mọi caller đều truyền showDeviceHeading=true).
  if (!showDeviceHeading || !device) {
    return (
      <div className="rounded-xl border-2 border-muted-foreground/20 bg-background shadow-sm overflow-hidden">
        <KitReadingsBody
          assignmentId={assignmentId}
          backUrl={backUrl}
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-muted-foreground/20 bg-background shadow-sm overflow-hidden">
      <div className="flex items-center bg-muted/70 hover:bg-muted border-b-2 border-muted-foreground/15 transition-colors">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={Boolean(open)}
          className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 text-left cursor-pointer min-w-0"
        >
          <div className="relative flex items-center justify-center h-9 w-9 rounded-md bg-background border shadow-sm shrink-0">
            <Cpu className="h-4 w-4 text-foreground/70" />
            <span
              className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-muted/70 ${statusDot}`}
            />
          </div>
          <div className="flex flex-col min-w-0 flex-1 leading-tight">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-semibold text-foreground truncate font-mono">
                {device.label || device.deviceName}
              </span>
            </div>
            {sensorCount > 0 && (
              <span className="text-[10px] text-muted-foreground font-medium">
                {sensorCount} cảm biến
              </span>
            )}
          </div>
          <div className="shrink-0">
            <DeviceStatusBadge
              status={device.status}
              milestoneStatus={milestoneStatus}
            />
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
        <div className="shrink-0 pr-2">
          <ReportFaultButton
            iotDeviceId={device.deviceId}
            deviceLabel={device.label || device.deviceName}
            deviceStatus={device.status as DeviceStatusType}
            variant="outline"
            size="sm"
          />
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="kit-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <KitReadingsBody
              assignmentId={assignmentId}
              backUrl={backUrl}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MilestoneSensorSection({
  milestone,
  backUrl,
}: {
  milestone: ProductionMilestoneResType;
  backUrl?: string;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(STATUS_FILTER_ALL);
  const debouncedSearch = useDebounce(search.trim(), 400);

  // Keep full-list query alive so `useDeviceBySensorId` can resolve sensors
  // to devices from cache regardless of the active search/filter/page.
  const fullListQuery = useManagerListMilestoneAssignments(milestone.id, true);
  const fullAssignments = fullListQuery.data?.data?.data ?? [];

  const searchQuery = useManagerSearchMilestoneAssignments(
    milestone.id,
    {
      page,
      limit: KIT_PAGE_SIZE,
      q: debouncedSearch || undefined,
      status:
        statusFilter === STATUS_FILTER_ALL
          ? undefined
          : (statusFilter as DeviceStatusType),
    },
    !!milestone.id,
  );
  const body = searchQuery.data?.data;
  const assignments = body?.data ?? [];
  const pageMeta = body?.meta;

  const zoneId = fullAssignments[0]?.zoneId ?? assignments[0]?.zoneId ?? "";
  useZoneSubscription(zoneId || undefined);

  const meta = MILESTONE_STATUS_META[milestone.status] ?? {
    label: milestone.status,
    variant: "secondary" as const,
  };

  const isFiltering = !!debouncedSearch || statusFilter !== STATUS_FILTER_ALL;
  const initialLoading = fullListQuery.isLoading && searchQuery.isLoading;

  if (!initialLoading && fullAssignments.length === 0) return null;

  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
  };
  const handleStatusChange = (v: string) => {
    setStatusFilter(v);
    setPage(1);
  };

  const totalLabel = pageMeta?.totalItems ?? fullAssignments.length;
  const hasMultipleKits = totalLabel > 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-muted-foreground shrink-0">
            #{milestone.milestoneOrder}
          </span>
          <p className="font-semibold truncate">{milestone.stageName}</p>
          <Badge
            variant={meta.variant}
            className={cn("text-xs shrink-0", meta.className)}
          >
            {meta.label}
          </Badge>
          {hasMultipleKits && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4 shrink-0"
            >
              {totalLabel} bộ kit
            </Badge>
          )}
        </div>
        <Separator className="flex-1" />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Tìm theo nhãn thiết bị (K001, W002...)"
            className="h-8 pl-7 text-xs"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              value={STATUS_FILTER_ALL}
              className="text-xs"
            >
              Tất cả trạng thái
            </SelectItem>
            {DEVICE_STATUS_VALUES.map((s) => (
              <SelectItem
                key={s}
                value={s}
                className="text-xs"
              >
                {DEVICE_STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {searchQuery.isLoading ? (
        <Skeleton className="h-48 w-full rounded-lg" />
      ) : assignments.length === 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/20 px-3 py-3 text-xs text-muted-foreground">
          {isFiltering
            ? "Không có thiết bị khớp bộ lọc"
            : "Chưa gán thiết bị IoT cho mốc này"}
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => (
            <KitReadingsSection
              key={a.assignmentId}
              assignment={a}
              showDeviceHeading
              backUrl={backUrl}
              milestoneStatus={milestone.status}
            />
          ))}
        </div>
      )}

      {pageMeta && pageMeta.totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">
            Trang {pageMeta.page}/{pageMeta.totalPages} · {pageMeta.totalItems}{" "}
            thiết bị
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={!pageMeta.hasPreviousPage}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={!pageMeta.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SensorOverviewTab({
  cropSeason,
}: {
  cropSeason: CropSeasonType;
}) {
  // Subscribe zone-room ở cấp tab để badge install → active cập nhật ngay
  // dù user chưa mở dialog chi tiết bo mạch.
  useZoneSubscription(cropSeason.zoneId);
  useMilestoneAssignmentsRealtime("manager");

  const listQuery = useManagerListProductionMilestones(cropSeason.id, {
    page: 1,
    limit: 50,
  });
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
            {[1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                className="h-36"
              />
            ))}
          </div>
        </div>
        <div className="w-72 space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="h-12 w-full"
            />
          ))}
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
            <p className="text-sm text-muted-foreground">
              Chưa có mốc công việc nào đang chạy
            </p>
          </div>
        ) : (
          milestones.map((m) => (
            <MilestoneSensorSection
              key={m.id}
              milestone={m}
            />
          ))
        )}
      </div>
      <div className="w-72 xl:w-80 shrink-0">
        <div className="sticky top-4 space-y-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <h4 className="text-sm font-semibold">Cảnh báo</h4>
          </div>
          <AlertsPanel
            isLoading={listQuery.isLoading}
            zoneId={cropSeason.zoneId}
          />
        </div>
      </div>
    </div>
  );
}
