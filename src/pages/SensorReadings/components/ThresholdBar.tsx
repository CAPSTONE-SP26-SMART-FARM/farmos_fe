import { cn } from "@/lib/utils";

type ThresholdBarProps = {
  value: number | null;
  minValue: number;
  maxValue: number;
  threshold: {
    optimalMin: number;
    optimalMax: number;
  } | null;
};

/**
 * Visual bar showing value position relative to min/max range.
 * The optimal threshold band is highlighted.
 */
export default function ThresholdBar({
  value,
  minValue,
  maxValue,
  threshold,
}: ThresholdBarProps) {
  const range = maxValue - minValue || 1;

  const pct = (v: number) =>
    Math.max(0, Math.min(100, ((v - minValue) / range) * 100));

  const valuePct = value != null ? pct(value) : null;

  const optLeft = threshold ? pct(threshold.optimalMin) : 0;
  const optRight = threshold ? pct(threshold.optimalMax) : 0;

  const isInRange =
    value != null &&
    threshold != null &&
    value >= threshold.optimalMin &&
    value <= threshold.optimalMax;

  return (
    <div className="w-full space-y-1">
      {/* Bar */}
      <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
        {/* Optimal band */}
        {threshold && (
          <div
            className="absolute inset-y-0 bg-green-200 dark:bg-green-900/40"
            style={{ left: `${optLeft}%`, width: `${optRight - optLeft}%` }}
          />
        )}

        {/* Value marker */}
        {valuePct != null && (
          <div
            className={cn(
              "absolute top-0 h-full w-1 rounded-full -translate-x-1/2",
              isInRange
                ? "bg-green-600 dark:bg-green-400"
                : "bg-red-600 dark:bg-red-400",
            )}
            style={{ left: `${valuePct}%` }}
          />
        )}
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{minValue}</span>
        {threshold && (
          <span className="text-green-600 dark:text-green-400">
            {threshold.optimalMin} – {threshold.optimalMax}
          </span>
        )}
        <span>{maxValue}</span>
      </div>
    </div>
  );
}
