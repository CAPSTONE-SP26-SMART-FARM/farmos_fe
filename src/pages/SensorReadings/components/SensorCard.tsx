import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Droplets,
  Thermometer,
  Sprout,
  Sun,
  type LucideIcon,
} from "lucide-react";
import type { LatestSensorReadingResType } from "@/schemaValidatation/sensorReading";
import ThresholdBar from "./ThresholdBar";
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

// Sensor card không hiển thị status badge nào (Cảnh báo / Hoạt động / Lỗi).
// Khi board ESP32 lỗi thì cả 4 sensor cùng câm — board header đã thể hiện trạng
// thái chung qua DeviceStatusBadge + dot đỏ, không cần lặp ở sensor.

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

        {/* Timestamp — bỏ status badge, board header đã hiển thị lỗi chung */}
        {reading.timestamp && (
          <div className="flex justify-end">
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(reading.timestamp), {
                addSuffix: true,
                locale: vi,
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
