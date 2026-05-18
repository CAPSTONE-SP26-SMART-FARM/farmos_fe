import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Cpu,
  Layers,
  Pencil,
  Radio,
  Sprout,
} from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import {
  useManagerListProductionMilestones,
  useManagerMilestoneAssignment,
} from "@/queries/useProductionMilestone";
import { useManagerCropSeasonDetail } from "@/queries/useCropSeason";
import { useDynamicBreadcrumb } from "@/stores/breadcrumbStore";
import ManagerMilestoneTasksSection from "@/pages/ManagerPage/EmployeeTasks/ManagerMilestoneTasksSection";
import { SENSOR_TYPE_ICON } from "@/constants/iotDeviceDisplay";
import type {
  ProductionMilestoneResType,
  ProductionMilestoneStatusType,
} from "@/schemaValidatation/productionMilestone";
import { format, isValid, parse } from "date-fns";
import {
  formatMilestoneIotDeviceWithOptionalCode,
  milestoneIotModuleTypeVi,
} from "@/lib/milestone-iot-display";

// ============================================================
// Helpers
// ============================================================

const STATUS_META: Record<
  ProductionMilestoneStatusType,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  pending: { label: "Chưa diễn ra", variant: "secondary" },
  in_progress: { label: "Đang thực hiện", variant: "default" },
  completed: { label: "Hoàn thành", variant: "outline" },
};

const SENSOR_TYPE_LABELS: Record<string, string> = {
  soil_moisture: "Độ ẩm đất",
  air_temperature: "Nhiệt độ không khí",
  air_humidity: "Độ ẩm không khí",
  light_intensity: "Cường độ ánh sáng",
};

const THRESHOLD_ELIGIBLE = new Set([
  "soil_moisture",
  "air_temperature",
  "air_humidity",
  "light_intensity",
]);

const DATE_DISPLAY_FORMAT = "dd/MM/yyyy";
const DATE_PAYLOAD_FORMAT = "yyyy-MM-dd";

function parseBackendDate(value: string | null | undefined) {
  if (!value) return undefined;
  const parsed = parse(value, DATE_PAYLOAD_FORMAT, new Date());
  if (isValid(parsed)) return parsed;
  const fallback = new Date(value);
  return isValid(fallback) ? fallback : undefined;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = parseBackendDate(value);
  return parsed ? format(parsed, DATE_DISPLAY_FORMAT) : value;
}

function formatThresholdText(sensor: {
  threshold?: {
    optimalMin: number | null;
    optimalMax: number | null;
    source: string;
  };
  unit?: string | null;
}) {
  const t = sensor.threshold;
  if (!t || t.optimalMin == null || t.optimalMax == null) {
    return "Chưa cấu hình ngưỡng";
  }
  const unit = sensor.unit ? ` ${sensor.unit}` : "";
  return `${t.optimalMin} - ${t.optimalMax}${unit} (${t.source})`;
}

// ============================================================
// InfoCell
// ============================================================

function InfoCell({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="bg-muted/40 rounded-md p-3 space-y-1">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </p>
      <div className="text-sm font-medium">{value ?? "—"}</div>
    </div>
  );
}

// ============================================================
// IoT & Sensor Detail Section
// ============================================================

function IotSensorSection({
  assignment,
}: {
  assignment: {
    device: {
      deviceName: string;
      deviceCode: string;
      deviceType: string;
      isDeleted?: boolean;
    };
    assignedAt?: string;
    sensors: Array<{
      sensorName: string;
      sensorType: string;
      status: string;
      threshold: {
        source: string;
        optimalMin: number | null;
        optimalMax: number | null;
      };
      unit: string | null;
    }>;
  } | null;
}) {
  if (!assignment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Cpu className="h-4 w-4" />
            Thiết bị IoT & Cảm biến
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Chưa gán thiết bị IoT cho mốc này.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sensors = assignment.sensors ?? [];
  const eligibleSensors = sensors.filter((s) =>
    THRESHOLD_ELIGIBLE.has(s.sensorType),
  );
  const configuredThresholds = eligibleSensors.filter(
    (s) => s.threshold?.source !== "none",
  );
  const moduleTypeVi = milestoneIotModuleTypeVi(assignment.device.deviceType);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Cpu className="h-4 w-4" />
          Thiết bị IoT & Cảm biến
        </CardTitle>
        <CardDescription>
          Thông tin thiết bị và cảm biến đã liên kết
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Device info */}
        <div className="rounded-md border p-3 space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
            Thiết bị
          </p>
          <p className="text-sm font-medium">
            {formatMilestoneIotDeviceWithOptionalCode(assignment.device)}
          </p>
          {moduleTypeVi ? (
            <p className="text-xs text-muted-foreground">
              Loại: {moduleTypeVi}
            </p>
          ) : null}
          {assignment.assignedAt && (
            <p className="text-xs text-muted-foreground">
              Gán lúc: {formatDate(assignment.assignedAt)}
            </p>
          )}
          {assignment.device.isDeleted && (
            <p className="text-xs text-destructive">
              Thiết bị đã bị xóa mềm; dữ liệu hiển thị từ lịch sử gán.
            </p>
          )}
        </div>

        {/* Sensor summary */}
        <div className="grid grid-cols-2 gap-3">
          <InfoCell
            icon={<Radio className="h-3 w-3" />}
            label="Cảm biến liên kết"
            value={
              sensors.length > 0 ? (
                `${sensors.length} cảm biến`
              ) : (
                <span className="text-muted-foreground">Chưa có</span>
              )
            }
          />
          <InfoCell
            label="Ngưỡng đã cấu hình"
            value={
              eligibleSensors.length > 0 ? (
                `${configuredThresholds.length}/${eligibleSensors.length} cảm biến`
              ) : (
                <span className="text-muted-foreground">
                  Không có cảm biến đủ điều kiện
                </span>
              )
            }
          />
        </div>

        {/* Sensor detail list */}
        {sensors.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Chi tiết cảm biến
              </p>
              <div className="space-y-1">
                {sensors.map((s, i) => {
                  const SIcon = SENSOR_TYPE_ICON[s.sensorType];
                  return (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium inline-flex items-center gap-1.5">
                        {SIcon && <SIcon className="h-3.5 w-3.5 text-primary" />}
                        {s.sensorName ||
                          SENSOR_TYPE_LABELS[s.sensorType] ||
                          s.sensorType}
                      </span>
                      <Badge
                        variant="outline"
                        className="ml-2 text-xs capitalize"
                      >
                        {s.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatThresholdText(s)}
                    </span>
                  </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Main Overview Page
// ============================================================

export default function ManagerMilestoneOverviewPage() {
  const { cropSeasonId, milestoneId } = useParams<{
    cropSeasonId: string;
    milestoneId: string;
  }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const csId = cropSeasonId ?? "";
  const msId = milestoneId ?? "";
  const zoneId = searchParams.get("zoneId")?.trim() ?? "";

  const cropSeasonsUrl = zoneId
    ? `/dashboard/manager/crop-seasons?zoneId=${encodeURIComponent(zoneId)}`
    : "/dashboard/manager/crop-seasons";
  const milestonesUrl = zoneId
    ? `/dashboard/manager/crop-seasons/${csId}/milestones?zoneId=${encodeURIComponent(zoneId)}`
    : `/dashboard/manager/crop-seasons/${csId}/milestones`;

  const stepPageUrl = zoneId
    ? `/dashboard/manager/crop-seasons/${csId}/milestones/${msId}?zoneId=${encodeURIComponent(zoneId)}`
    : `/dashboard/manager/crop-seasons/${csId}/milestones/${msId}`;

  // Queries
  const cropSeasonQuery = useManagerCropSeasonDetail(csId);
  const cropSeason = cropSeasonQuery.data?.data;
  const cropSeasonLabel = cropSeason?.cropName ?? "Mùa vụ";

  const listQuery = useManagerListProductionMilestones(csId, {
    page: 1,
    limit: 100,
  });
  const milestones = listQuery.data?.data.data ?? [];
  const milestone = milestones.find(
    (m: ProductionMilestoneResType) => m.id === msId,
  );

  useDynamicBreadcrumb(
    `/dashboard/manager/crop-seasons/${csId}`,
    cropSeason?.cropName,
  );
  useDynamicBreadcrumb(
    `/dashboard/manager/crop-seasons/${csId}/milestones/${msId}/overview`,
    milestone?.stageName,
  );

  const assignmentQuery = useManagerMilestoneAssignment(msId, !!msId);
  const assignment = assignmentQuery.data?.data?.data ?? null;

  // Loading
  if (listQuery.isLoading || cropSeasonQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Not found
  if (!milestone) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(milestonesUrl)}
          className="-ml-2 gap-1 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Không tìm thấy mốc sản xuất.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={cropSeasonsUrl}>Quản lý mùa vụ</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={milestonesUrl}>{cropSeasonLabel}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              #{milestone.milestoneOrder} {milestone.stageName}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(milestonesUrl)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                #{milestone.milestoneOrder} {milestone.stageName}
              </h1>
              <Badge variant={STATUS_META[milestone.status].variant}>
                {STATUS_META[milestone.status].label}
              </Badge>
            </div>
            {milestone.expectedStartDate && (
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(milestone.expectedStartDate)}
                {milestone.expectedEndDate
                  ? ` → ${formatDate(milestone.expectedEndDate)}`
                  : ""}
              </p>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <Link to={stepPageUrl}>
            <Pencil className="h-4 w-4 mr-2" />
            Cấu hình mốc
          </Link>
        </Button>
      </div>

      {/* Overview Section — Dates & Crop Season */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4" />
            Tổng quan
          </CardTitle>
          <CardDescription>
            Thông tin ngày tháng và mùa vụ liên quan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date info */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoCell
              icon={<CalendarIcon className="h-3 w-3" />}
              label="Bắt đầu dự kiến"
              value={formatDate(milestone.expectedStartDate)}
            />
            <InfoCell
              icon={<CalendarIcon className="h-3 w-3" />}
              label="Kết thúc dự kiến"
              value={formatDate(milestone.expectedEndDate)}
            />
            <InfoCell
              icon={<CalendarIcon className="h-3 w-3" />}
              label="Bắt đầu thực tế"
              value={formatDate(milestone.actualStartDate)}
            />
            <InfoCell
              icon={<CalendarIcon className="h-3 w-3" />}
              label="Kết thúc thực tế"
              value={formatDate(milestone.actualEndDate)}
            />
          </div>

          {/* Crop season info */}
          {cropSeason && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <InfoCell
                  icon={<Sprout className="h-3 w-3" />}
                  label="Mùa vụ"
                  value={
                    <span>
                      {cropSeason.cropName}
                      {cropSeason.variety && (
                        <span className="text-muted-foreground ml-1">
                          — {cropSeason.variety}
                        </span>
                      )}
                    </span>
                  }
                />
                <InfoCell
                  label="Cập nhật lần cuối"
                  value={formatDate(milestone.updatedAt)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* IoT & Sensors */}
      <IotSensorSection assignment={assignment} />

      {/* Tasks — read-only */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nhiệm vụ & Nông dân</CardTitle>
          <CardDescription>
            Danh sách nhiệm vụ đã gán cho mốc sản xuất
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManagerMilestoneTasksSection
            milestoneId={msId}
            canEdit={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
