import { memo, useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LatestSensorReadingResType } from "@/schemaValidatation/sensorReading";
import {
  classifySensorStatus,
  getSensorMeta,
  STATUS_META,
  formatThresholdRange,
  type SensorStatus,
} from "../utils/sensorDashboard";
import ThresholdBar from "./ThresholdBar";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { CircleDashed } from "lucide-react";

type DashboardSensorCardProps = {
  reading: LatestSensorReadingResType;
};

export default memo(function DashboardSensorCard({
  reading,
}: DashboardSensorCardProps) {
  const meta = getSensorMeta(reading.sensorType);
  const status: SensorStatus = classifySensorStatus(reading);
  const statusMeta = STATUS_META[status];
  const hasValue = reading.value != null && reading.timestamp != null;

  // Empty state: sensor chưa có dữ liệu → card hiển thị placeholder neutral,
  // khác hẳn các trạng thái health (normal/warning/critical).
  const Icon = hasValue ? meta.icon : CircleDashed;

  // Detect value change → flash animation
  const prevValueRef = useRef(reading.value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (
      prevValueRef.current !== reading.value &&
      prevValueRef.current != null
    ) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1200);
      return () => clearTimeout(t);
    }
    prevValueRef.current = reading.value;
  }, [reading.value]);

  return (
    <Card
      className={cn(
        "relative transition-all duration-300",
        !hasValue && "border-dashed bg-muted/20",
        flash && "ring-2 ring-blue-400/60 dark:ring-blue-500/40",
      )}
    >
      {/* Status dot — chỉ hiển thị khi có dữ liệu */}
      {hasValue && (
        <div
          className={cn(
            "absolute top-3 right-3 h-2.5 w-2.5 rounded-full",
            statusMeta.dotColor,
            status === "critical" && "animate-pulse",
          )}
        />
      )}

      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              hasValue ? statusMeta.bgColor : "bg-muted",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4",
                hasValue ? statusMeta.color : "text-muted-foreground",
              )}
            />
          </div>
          <div>
            <CardTitle
              className={cn(
                "text-sm font-medium leading-none",
                !hasValue && "text-muted-foreground",
              )}
            >
              {meta.label}
            </CardTitle>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {formatThresholdRange(reading.threshold, meta.unit)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-4 pb-4">
        {/* Value display */}
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              "text-2xl font-bold tabular-nums transition-colors duration-300",
              hasValue ? statusMeta.color : "text-muted-foreground/60",
              flash && "text-blue-600 dark:text-blue-400",
            )}
          >
            {hasValue ? meta.format(reading.value!) : "—"}
          </span>
        </div>

        {/* Status label — khác hẳn giữa có dữ liệu và chưa có */}
        {hasValue ? (
          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
              statusMeta.bgColor,
              statusMeta.color,
            )}
          >
            <div
              className={cn("h-1.5 w-1.5 rounded-full", statusMeta.dotColor)}
            />
            {statusMeta.label}
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-muted-foreground/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            <CircleDashed className="h-3 w-3" />
            Chưa có dữ liệu
          </div>
        )}

        {/* Threshold bar */}
        <ThresholdBar
          value={reading.value}
          minValue={reading.minValue}
          maxValue={reading.maxValue}
          threshold={reading.threshold}
        />

        {/* Last seen */}
        <p className="text-[11px] text-muted-foreground">
          {reading.timestamp
            ? `Cập nhật ${formatDistanceToNow(new Date(reading.timestamp), { addSuffix: true, locale: vi })}`
            : "Chưa nhận dữ liệu"}
        </p>
      </CardContent>
    </Card>
  );
});
