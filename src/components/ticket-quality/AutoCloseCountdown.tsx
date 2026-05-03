import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  useSystemConfigValue,
  useTicketSystemConfigs,
} from "@/queries/useSystemConfig";
import { differenceInSeconds, parseISO } from "date-fns";
import { Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface AutoCloseCountdownProps {
  /** ISO datetime — thường là `ticket.resolvedAt`. */
  resolvedAt: string | null | undefined;
  /** Optional callback khi countdown chạm 0. */
  onTimeUp?: () => void;
}

// Component countdown auto-close (BR-74 + B22).
// Đọc 2 system-config: `ticket.auto_close_hours` (window total) và
// `ticket.auto_close_notify_at_fraction` (vd 0.667 = 2/3 → highlight đỏ).
// Tick mỗi 30s. Cleanup interval khi unmount.

const TICK_INTERVAL_MS = 30_000;

function formatRemaining(totalSeconds: number): string {
  if (totalSeconds <= 0) return "Đã quá hạn — hệ thống sẽ sớm tự đóng";
  const totalMinutes = Math.floor(totalSeconds / 60);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ngày`);
  if (hours > 0) parts.push(`${hours} giờ`);
  if (parts.length === 0 || (parts.length < 2 && days === 0)) {
    parts.push(`${minutes} phút`);
  }
  return `Còn ${parts.join(" ")} trước khi tự đóng`;
}

export default function AutoCloseCountdown({
  resolvedAt,
  onTimeUp,
}: AutoCloseCountdownProps) {
  // Trigger initial fetch system-configs. Hook return cached data for 2 hooks.
  useTicketSystemConfigs();
  const { value: autoCloseHours } = useSystemConfigValue<number>(
    "ticket.",
    "ticket.auto_close_hours",
  );
  const { value: notifyFraction } = useSystemConfigValue<number>(
    "ticket.",
    "ticket.auto_close_notify_at_fraction",
  );

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(
      () => setNow(Date.now()),
      TICK_INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, []);

  const computed = useMemo(() => {
    if (!resolvedAt || !autoCloseHours) return null;
    const start = parseISO(resolvedAt).getTime();
    const totalSec = autoCloseHours * 3600;
    const elapsedSec = Math.max(
      0,
      Math.floor(differenceInSeconds(new Date(now), new Date(start))),
    );
    const remainingSec = Math.max(0, totalSec - elapsedSec);
    const percent = Math.min(100, (elapsedSec / totalSec) * 100);
    const fraction = notifyFraction ?? 0.667;
    const isUrgent = percent >= fraction * 100;
    return { totalSec, elapsedSec, remainingSec, percent, isUrgent };
  }, [resolvedAt, autoCloseHours, notifyFraction, now]);

  useEffect(() => {
    if (computed && computed.remainingSec === 0 && onTimeUp) {
      onTimeUp();
    }
  }, [computed, onTimeUp]);

  // Đang load config hoặc chưa có resolvedAt → không render.
  if (!computed) {
    return null;
  }

  return (
    <div
      className="rounded-md border p-3 space-y-2"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <Clock
            className={cn(
              "h-4 w-4",
              computed.isUrgent
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          />
          <span
            className={cn(
              "font-medium",
              computed.isUrgent && "text-destructive",
            )}
          >
            {formatRemaining(computed.remainingSec)}
          </span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {Math.floor(computed.percent)}%
        </span>
      </div>
      <Progress
        value={computed.percent}
        className={cn(
          "h-2",
          computed.isUrgent && "[&>div]:bg-destructive",
        )}
      />
    </div>
  );
}
