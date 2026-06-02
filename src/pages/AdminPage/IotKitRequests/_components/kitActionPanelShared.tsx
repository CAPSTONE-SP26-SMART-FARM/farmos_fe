import { format, isValid, parse } from "date-fns";
import { vi } from "date-fns/locale";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tiện ích dùng chung cho các action panel inline của kit request
 * (lắp đặt / thu hồi / thay thiết bị). Mục tiêu: gom mọi thao tác vào đúng
 * 1 dialog chi tiết, hiển thị dạng card nhiều bước — không mở dialog lồng nhau.
 */

// Khung giờ làm việc 07:00 – 18:00, cách 15 phút.
export const KIT_TIME_SLOTS: string[] = buildTimeSlots();

function buildTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 7; h <= 18; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

/** Ghép `yyyy-MM-dd` + `HH:mm` thành ISO string; trả "" nếu thiếu/không hợp lệ. */
export function composeKitScheduleIso(date: string, time: string): string {
  if (!date || !time) return "";
  const parsed = parse(`${date} ${time}`, "yyyy-MM-dd HH:mm", new Date());
  if (!isValid(parsed)) return "";
  return parsed.toISOString();
}

/** Số thứ tự bước trong card. */
export function StepBadge({
  active,
  children,
}: {
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

/** Ô xanh báo "đã lên lịch vào ..." — thay cho việc mở lại form khi đã chốt giờ. */
export function ScheduledSummary({
  title,
  scheduledAt,
}: {
  title: string;
  scheduledAt: string;
}) {
  const label = format(new Date(scheduledAt), "HH:mm 'ngày' dd/MM/yyyy", {
    locale: vi,
  });
  return (
    <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-900/50 dark:bg-emerald-950/30">
      <CheckCircle2
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
      />
      <div>
        <p className="font-medium text-emerald-900 dark:text-emerald-200">
          {title}
        </p>
        <p className="text-emerald-800/80 dark:text-emerald-200/80">
          Hẹn vào {label}.
        </p>
      </div>
    </div>
  );
}
