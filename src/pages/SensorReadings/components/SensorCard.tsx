import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Droplets,
  Thermometer,
  Sprout,
  Sun,
  CircleCheck,
  CirclePause,
  Wrench,
  CircleAlert,
  type LucideIcon,
} from "lucide-react";
import type { LatestSensorReadingResType } from "@/schemaValidatation/sensorReading";
import StatusBadge from "./StatusBadge";
import ThresholdBar from "./ThresholdBar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const SENSOR_META: Record<
  string,
  { label: string; icon: LucideIcon; unit: string }
> = {
  soil_moisture: { label: "Độ ẩm đất", icon: Droplets, unit: "%" },
  air_temperature: { label: "Nhiệt độ KK", icon: Thermometer, unit: "°C" },
  air_humidity: { label: "Độ ẩm KK", icon: Sprout, unit: "%" },
  light_intensity: { label: "Cường độ sáng", icon: Sun, unit: "%" },
};

// Theo rule FE: "IoT error đơn giản: hiển thị 1 status error duy nhất" —
// gom `error` + `damaged` về cùng badge "Lỗi". `active` ẩn vì là default OK.
type SensorStatus = NonNullable<LatestSensorReadingResType["sensorStatus"]>;

const SENSOR_STATUS_META: Record<
  Exclude<SensorStatus, "active">,
  { label: string; icon: LucideIcon; className: string }
> = {
  inactive: {
    label: "Tạm dừng",
    icon: CirclePause,
    className:
      "border-slate-300 bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
  },
  calibration: {
    label: "Hiệu chuẩn",
    icon: Wrench,
    className:
      "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  },
  error: {
    label: "Lỗi",
    icon: CircleAlert,
    className:
      "border-red-300 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  },
  damaged: {
    label: "Lỗi",
    icon: CircleAlert,
    className:
      "border-red-300 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  },
};

function SensorStatusChip({ status }: { status: SensorStatus | undefined }) {
  if (!status || status === "active") {
    return (
      <Badge
        variant="outline"
        className="h-5 gap-1 border-emerald-300 bg-emerald-50 px-1.5 text-[10px] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
      >
        <CircleCheck className="h-3 w-3" />
        Hoạt động
      </Badge>
    );
  }
  const meta = SENSOR_STATUS_META[status];
  const Icon = meta.icon;
  return (
    <Badge
      variant="outline"
      className={cn("h-5 gap-1 px-1.5 text-[10px]", meta.className)}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
}

type SensorCardProps = {
  reading: LatestSensorReadingResType;
};

export default function SensorCard({ reading }: SensorCardProps) {
  const meta = SENSOR_META[reading.sensorType] ?? {
    label: reading.sensorType,
    icon: Thermometer,
    unit: "",
  };
  const Icon = meta.icon;
  const hasValue = reading.value != null && reading.timestamp != null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">{meta.label}</CardTitle>
        </div>
        <StatusBadge
          isSafe={reading.isSafe}
          hasValue={hasValue}
        />
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Value */}
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold tabular-nums">
            {hasValue ? reading.value : "—"}
          </span>
          {hasValue && (
            <span className="text-sm text-muted-foreground">{meta.unit}</span>
          )}
        </div>

        {/* Threshold bar */}
        <ThresholdBar
          value={reading.value}
          minValue={reading.minValue}
          maxValue={reading.maxValue}
          threshold={reading.threshold}
        />

        {/* Status + timestamp */}
        <div className="flex items-center justify-between gap-2">
          <SensorStatusChip status={reading.sensorStatus} />
          {reading.timestamp && (
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(reading.timestamp), {
                addSuffix: true,
                locale: vi,
              })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
