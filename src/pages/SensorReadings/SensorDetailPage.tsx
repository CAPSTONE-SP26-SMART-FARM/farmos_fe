import { useMemo } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import {
  ArrowLeft,
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Cpu,
  Droplets,
  Sprout,
  Sun,
  Thermometer,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  refetchIntervalFor,
  useManagerLatestSensorReadings,
  useOwnerLatestSensorReadings,
  useSensorReadingRealtime,
  useSensorSeriesInterval,
  useSensorStats,
} from "@/queries/useSensorReading";
import {
  useManagerListMilestoneAssignments,
  useOwnerListMilestoneAssignments,
} from "@/queries/useProductionMilestone";
import { useZoneSubscription } from "@/hooks/useZoneSubscription";
import type {
  LatestSensorReadingResType,
  SensorIntervalType,
  SensorStatsPeriodType,
} from "@/schemaValidatation/sensorReading";
import SegmentedControl from "./components/SegmentedControl";
import SensorStatBadge from "./components/SensorStatBadge";
import SensorIntervalChart from "./components/SensorIntervalChart";
import RefreshCountdown from "./components/RefreshCountdown";

type SensorStatus = NonNullable<LatestSensorReadingResType["sensorStatus"]>;

const SENSOR_STATUS_META: Record<
  SensorStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Hoạt động",
    className:
      "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  inactive: {
    label: "Tạm dừng",
    className:
      "border-slate-300 bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
  },
  calibration: {
    label: "Hiệu chuẩn",
    className:
      "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  },
  // Theo rule FE: gom error + damaged về cùng nhãn "Lỗi" màu đỏ.
  error: {
    label: "Lỗi",
    className:
      "border-red-300 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  },
  damaged: {
    label: "Lỗi",
    className:
      "border-red-300 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  },
};

const SENSOR_META: Record<
  string,
  { label: string; icon: LucideIcon; unit: string }
> = {
  soil_moisture: { label: "Độ ẩm đất", icon: Droplets, unit: "%" },
  air_temperature: {
    label: "Nhiệt độ không khí",
    icon: Thermometer,
    unit: "°C",
  },
  air_humidity: { label: "Độ ẩm không khí", icon: Sprout, unit: "%" },
  light_intensity: { label: "Cường độ sáng", icon: Sun, unit: "%" },
};

const INTERVAL_OPTIONS: ReadonlyArray<{
  value: SensorIntervalType;
  label: string;
}> = [
  { value: "10s", label: "10s" },
  { value: "1m", label: "1 phút" },
  { value: "1h", label: "1 giờ" },
  { value: "1D", label: "1 ngày" },
  { value: "1W", label: "1 tuần" },
  { value: "1M", label: "1 tháng" },
];

const PERIOD_OPTIONS: ReadonlyArray<{
  value: SensorStatsPeriodType;
  label: string;
}> = [
  { value: "today", label: "Hôm nay" },
  { value: "7d", label: "7 ngày" },
  { value: "10d", label: "10 ngày" },
];

const DEFAULT_INTERVAL: SensorIntervalType = "10s";
const DEFAULT_PERIOD: SensorStatsPeriodType = "today";

function isInterval(v: string | null): v is SensorIntervalType {
  return !!v && INTERVAL_OPTIONS.some((o) => o.value === v);
}
function isPeriod(v: string | null): v is SensorStatsPeriodType {
  return !!v && PERIOD_OPTIONS.some((o) => o.value === v);
}

export default function SensorDetailPage() {
  const { assignmentId = "", sensorId = "" } = useParams<{
    assignmentId: string;
    sensorId: string;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isOwner = location.pathname.startsWith("/dashboard/owner/");
  const role = isOwner ? "owner" : "manager";
  const dashboardPrefix = isOwner ? "/dashboard/owner" : "/dashboard/manager";

  const intervalParam = searchParams.get("interval");
  const periodParam = searchParams.get("period");
  const interval: SensorIntervalType = isInterval(intervalParam)
    ? intervalParam
    : DEFAULT_INTERVAL;
  const period: SensorStatsPeriodType = isPeriod(periodParam)
    ? periodParam
    : DEFAULT_PERIOD;

  const setInterval = (v: SensorIntervalType) => {
    const next = new URLSearchParams(searchParams);
    next.set("interval", v);
    setSearchParams(next, { replace: true });
  };
  const setPeriod = (v: SensorStatsPeriodType) => {
    const next = new URLSearchParams(searchParams);
    next.set("period", v);
    setSearchParams(next, { replace: true });
  };

  // Page phục vụ cả manager và owner — detect role qua URL prefix
  // (giống PlanVsActualPage). Cùng shape response → switch hook là đủ,
  // không cần fork component riêng.
  const managerLatest = useManagerLatestSensorReadings(assignmentId, !isOwner);
  const ownerLatest = useOwnerLatestSensorReadings(assignmentId, isOwner);
  const latestQuery = isOwner ? ownerLatest : managerLatest;
  useSensorReadingRealtime(assignmentId || undefined, role);
  useZoneSubscription(latestQuery.data?.zoneId);

  // Lấy deviceName + deviceCode từ assignment list theo milestoneId
  // (latest endpoint chỉ trả `device.label` — không có name).
  const milestoneId = latestQuery.data?.milestoneId ?? "";
  const managerAssignments = useManagerListMilestoneAssignments(
    milestoneId,
    !!milestoneId && !isOwner,
  );
  const ownerAssignments = useOwnerListMilestoneAssignments(
    milestoneId,
    !!milestoneId && isOwner,
  );
  const assignmentsQuery = isOwner ? ownerAssignments : managerAssignments;
  const assignmentDevice = useMemo(() => {
    const list = assignmentsQuery.data?.data?.data ?? [];
    return list.find((a) => a.assignmentId === assignmentId)?.device;
  }, [assignmentsQuery.data, assignmentId]);

  const goBack = () => {
    // Caller có thể truyền `?from=<encoded URL>` để override điểm về (vd: từ
    // milestone detail page muốn quay lại đúng tab cảm biến của milestone đó,
    // không phải zone landing).
    const fromParam = searchParams.get("from");
    if (fromParam && fromParam.startsWith("/dashboard/")) {
      navigate(fromParam);
      return;
    }
    const zid = latestQuery.data?.zoneId;
    if (zid) {
      navigate(`${dashboardPrefix}/crop-seasons?zoneId=${zid}&tab=sensors`);
    } else {
      navigate(-1);
    }
  };

  const reading = useMemo<LatestSensorReadingResType | undefined>(
    () => latestQuery.data?.data.find((s) => s.sensorId === sensorId),
    [latestQuery.data, sensorId],
  );

  const meta = reading
    ? (SENSOR_META[reading.sensorType] ?? {
        label: reading.sensorType,
        icon: Activity,
        unit: "",
      })
    : null;
  const Icon = meta?.icon ?? Activity;

  const statsQuery = useSensorStats(assignmentId, sensorId, period);
  const seriesQuery = useSensorSeriesInterval(assignmentId, sensorId, interval);
  const stats = statsQuery.data;
  const series = seriesQuery.data;
  const isStatsLoading = statsQuery.isLoading;
  const isSeriesLoading = seriesQuery.isLoading;

  // ── Loading / not-found states ─────────────────────────────────────────
  if (latestQuery.isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (!reading || !meta) {
    return (
      <div className="p-6 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={goBack}
          className="-ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Không tìm thấy cảm biến trong assignment này.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 -ml-1"
            onClick={goBack}
            title="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
              <h1 className="text-xl font-semibold truncate">{meta.label}</h1>
              {reading.sensorStatus && (
                <Badge
                  variant="outline"
                  className={`text-xs shrink-0 ${SENSOR_STATUS_META[reading.sensorStatus].className}`}
                >
                  {SENSOR_STATUS_META[reading.sensorStatus].label}
                </Badge>
              )}
            </div>
            {(assignmentDevice || reading.device) && (
              <div className="flex items-center gap-1.5 mt-1">
                <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {assignmentDevice?.deviceName}
                  {(assignmentDevice?.deviceCode ?? reading.device?.label) && (
                    <>
                      {assignmentDevice?.deviceName ? " · " : null}
                      <span className="font-mono">
                        {assignmentDevice?.deviceCode ?? reading.device?.label}
                      </span>
                    </>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Period selector + Stats badges */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Thống kê
          </h2>
          <SegmentedControl
            value={period}
            onChange={setPeriod}
            options={PERIOD_OPTIONS}
          />
        </div>
        {(() => {
          const periodLabel =
            PERIOD_OPTIONS.find((o) => o.value === period)?.label.toLowerCase() ??
            period;
          // Khi bộ IoT hỏng (error/damaged), giá trị "hiện tại" thực ra là số đo
          // cuối cùng trước khi hỏng → đổi nhãn + tone để user không hiểu nhầm.
          const isSensorBroken =
            reading.sensorStatus === "error" ||
            reading.sensorStatus === "damaged";
          const currentLabel = isSensorBroken
            ? "Giá trị cuối ghi nhận"
            : "Giá trị hiện tại";
          const currentTone = isSensorBroken ? "danger" : "primary";
          return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SensorStatBadge
            label={currentLabel}
            value={stats?.currentValue ?? null}
            unit={meta.unit}
            icon={Activity}
            tone={currentTone}
            isLoading={isStatsLoading}
          />
          <SensorStatBadge
            label={`Thấp nhất (${periodLabel})`}
            value={stats?.minValue ?? null}
            unit={meta.unit}
            icon={ArrowDown}
            tone="success"
            isLoading={isStatsLoading}
          />
          <SensorStatBadge
            label={`Cao nhất (${periodLabel})`}
            value={stats?.maxValue ?? null}
            unit={meta.unit}
            icon={ArrowUp}
            tone="warn"
            isLoading={isStatsLoading}
          />
          <SensorStatBadge
            label={`Số cảnh báo (${periodLabel})`}
            value={stats?.alertCount ?? null}
            icon={AlertTriangle}
            tone={stats && stats.alertCount > 0 ? "danger" : "default"}
            isLoading={isStatsLoading}
          />
        </div>
          );
        })()}
      </div>

      {/* Chart */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Biểu đồ theo thời gian
            </h2>
          </div>
          <SegmentedControl
            value={interval}
            onChange={setInterval}
            options={INTERVAL_OPTIONS}
          />
        </div>
        <div className="flex justify-end">
          {(() => {
            const refetchMs = refetchIntervalFor(interval);
            if (!refetchMs) return null;
            return (
              <RefreshCountdown
                updatedAt={seriesQuery.dataUpdatedAt}
                intervalMs={refetchMs}
                isFetching={seriesQuery.isFetching}
              />
            );
          })()}
        </div>
        <SensorIntervalChart
          interval={interval}
          series={series}
          reading={reading}
          label={meta.label}
          unit={meta.unit}
          isLoading={isSeriesLoading}
        />
      </div>
    </div>
  );
}
