import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** Timestamp (ms) lần fetch gần nhất — thường từ `query.dataUpdatedAt`. */
  updatedAt: number;
  /** Khoảng refetch (ms). */
  intervalMs: number;
  /** Đang refetch → hiển thị spinner. */
  isFetching?: boolean;
  className?: string;
};

const CIRCUMFERENCE = 2 * Math.PI * 7; // r=7

export default function RefreshCountdown({
  updatedAt,
  intervalMs,
  isFetching,
  className,
}: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  if (!updatedAt) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs text-muted-foreground",
          className,
        )}
      >
        <RefreshCw className="h-3 w-3 animate-spin" />
        Đang tải…
      </span>
    );
  }

  const elapsed = Math.max(0, now - updatedAt);
  const remainingMs = Math.max(0, intervalMs - elapsed);
  const remainingSec = Math.ceil(remainingMs / 1000);
  const progress = Math.min(1, elapsed / intervalMs);
  // Vẽ ngược: vòng đầy → rỗng dần (đếm ngược).
  const dashOffset = CIRCUMFERENCE * progress;
  const isImminent = remainingSec <= 3;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs tabular-nums",
        isImminent ? "text-primary" : "text-muted-foreground",
        className,
      )}
      title={`Tự động làm mới mỗi ${Math.round(intervalMs / 1000)}s`}
    >
      <span className="relative inline-flex h-4 w-4 items-center justify-center">
        <svg viewBox="0 0 16 16" className="absolute inset-0">
          <circle
            cx="8"
            cy="8"
            r="7"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeWidth="1.5"
          />
          <circle
            cx="8"
            cy="8"
            r="7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform="rotate(-90 8 8)"
            style={{ transition: "stroke-dashoffset 0.25s linear" }}
          />
        </svg>
        {isFetching && (
          <RefreshCw className="h-2 w-2 relative animate-spin" />
        )}
      </span>
      {isFetching ? (
        <span>Đang cập nhật…</span>
      ) : (
        <span>Làm mới sau {remainingSec}s</span>
      )}
    </span>
  );
}
