import type { LucideIcon } from "lucide-react";
import { Droplets, Thermometer, Sprout, Sun } from "lucide-react";
import type { LatestSensorReadingResType } from "@/schemaValidatation/sensorReading";

// ── Sensor status classification ───────────────────────────────────────

export type SensorStatus = "normal" | "warning" | "critical" | "stale";

export function classifySensorStatus(
  reading: LatestSensorReadingResType,
): SensorStatus {
  // Không classify "stale" dựa trên tuổi timestamp — UI hiển thị giá trị
  // latest từ API bất kể thời điểm. Trạng thái health phụ thuộc threshold.
  if (reading.value == null) return "normal";

  if (reading.threshold == null) return reading.isSafe ? "normal" : "warning";

  if (reading.isSafe) return "normal";

  // Determine severity by how far outside the threshold
  const { optimalMin, optimalMax } = reading.threshold;
  const range = optimalMax - optimalMin || 1;
  const deviation =
    reading.value < optimalMin
      ? (optimalMin - reading.value) / range
      : (reading.value - optimalMax) / range;

  return deviation > 0.5 ? "critical" : "warning";
}

// ── Status display metadata ────────────────────────────────────────────

export const STATUS_META: Record<
  SensorStatus,
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  normal: {
    label: "Bình thường",
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    dotColor: "bg-emerald-500",
  },
  warning: {
    label: "Cảnh báo",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    dotColor: "bg-amber-500",
  },
  critical: {
    label: "Nguy hiểm",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/40",
    dotColor: "bg-red-500",
  },
  stale: {
    label: "Mất tín hiệu",
    color: "text-gray-500 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-900/40",
    dotColor: "bg-gray-400",
  },
};

// ── Sensor type metadata ───────────────────────────────────────────────

export const SENSOR_TYPE_META: Record<
  string,
  {
    label: string;
    icon: LucideIcon;
    unit: string;
    format: (v: number) => string;
  }
> = {
  soil_moisture: {
    label: "Độ ẩm đất",
    icon: Droplets,
    unit: "%",
    format: (v) => `${v.toFixed(1)}%`,
  },
  air_temperature: {
    label: "Nhiệt độ không khí",
    icon: Thermometer,
    unit: "°C",
    format: (v) => `${v.toFixed(1)}°C`,
  },
  air_humidity: {
    label: "Độ ẩm không khí",
    icon: Sprout,
    unit: "%",
    format: (v) => `${v.toFixed(1)}%`,
  },
  light_intensity: {
    label: "Cường độ sáng",
    icon: Sun,
    unit: "%",
    format: (v) => `${Math.round(v)}%`,
  },
};

export function getSensorMeta(sensorType: string) {
  return (
    SENSOR_TYPE_META[sensorType] ?? {
      label: sensorType,
      icon: Thermometer,
      unit: "",
      format: (v: number) => String(v),
    }
  );
}

// ── Format threshold display ───────────────────────────────────────────

export function formatThresholdRange(
  threshold: { optimalMin: number; optimalMax: number } | null,
  unit: string,
): string {
  if (!threshold) return "Chưa cấu hình";
  return `${threshold.optimalMin}–${threshold.optimalMax}${unit}`;
}

// ── Aggregate stats from multiple assignments ──────────────────────────

export interface DashboardStats {
  total: number;
  normal: number;
  warning: number;
  critical: number;
  stale: number;
}

export function aggregateStats(
  readings: LatestSensorReadingResType[],
): DashboardStats {
  const stats: DashboardStats = {
    total: readings.length,
    normal: 0,
    warning: 0,
    critical: 0,
    stale: 0,
  };

  for (const r of readings) {
    // Sensor chưa có dữ liệu → không đếm vào health buckets để tránh
    // inflate "Bình thường". Hiển thị trên card bằng empty state riêng.
    if (r.value == null || r.timestamp == null) continue;
    const status = classifySensorStatus(r);
    stats[status]++;
  }

  return stats;
}

// ── Worst-case status for a group ──────────────────────────────────────

const SEVERITY_ORDER: SensorStatus[] = ["critical", "warning", "normal"];

export function worstStatus(
  readings: LatestSensorReadingResType[],
): SensorStatus {
  const validReadings = readings.filter(
    (r) => r.value != null && r.timestamp != null,
  );
  if (validReadings.length === 0) return "normal";
  const statuses = validReadings.map(classifySensorStatus);
  return SEVERITY_ORDER.find((s) => statuses.includes(s)) ?? "normal";
}
