import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Props {
  /** % tiến độ 0..100 */
  value: number;
  className?: string;
  /** Ẩn nhãn % nếu chỉ cần thanh */
  showLabel?: boolean;
  /** Độ rộng thanh (Tailwind class), mặc định w-24 */
  barClassName?: string;
}

/**
 * Thanh % tiến độ của một nhiệm vụ. Dùng chung cho cả manager và owner.
 * Màu thanh đổi theo mức: <40% xám, 40-99% xanh dương, 100% xanh lá.
 */
export function TaskProgressBar({
  value,
  className,
  showLabel = true,
  barClassName,
}: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));

  const indicatorColor =
    pct >= 100
      ? "[&_[data-slot=progress-indicator]]:bg-emerald-600"
      : pct >= 40
        ? "[&_[data-slot=progress-indicator]]:bg-primary"
        : "[&_[data-slot=progress-indicator]]:bg-muted-foreground";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Progress
        value={pct}
        className={cn("h-1.5 w-24", indicatorColor, barClassName)}
        aria-label={`Tiến độ ${pct}%`}
      />
      {showLabel && (
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          {pct}%
        </span>
      )}
    </div>
  );
}
