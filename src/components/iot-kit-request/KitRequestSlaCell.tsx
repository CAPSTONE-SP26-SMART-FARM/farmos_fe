import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type {
  KitRequestResType,
  KitRequestStatusType,
  KitRequestTypeType,
} from "@/schemaValidatation/iotKitRequest";

/**
 * Cell hiển thị thời gian cam kết của kit request — chia 2 cell riêng:
 *  - `KitRequestDeadlineCell`: hạn chót (slaDeadline) + overdue + owner báo
 *    quá hạn
 *  - `KitRequestScheduleCell`: lịch hẹn admin chốt (scheduledAt) — label
 *    theo type
 *
 * Dùng chung cho 3 trang: owner / admin / manager.
 */

const TERMINAL_STATUSES: KitRequestStatusType[] = [
  "resolved",
  "rejected",
  "cancelled",
];

const fmt = (iso: string) =>
  format(new Date(iso), "HH:mm dd/MM/yyyy", { locale: vi });

// ============================================================
// Cell 1 — Hạn chót
// ============================================================

type DeadlineCellProps = Pick<
  KitRequestResType,
  "status" | "slaDeadline" | "metadata"
>;

export function KitRequestDeadlineCell({
  status,
  slaDeadline,
  metadata,
}: DeadlineCellProps) {
  const overdueReportedAt = metadata?.ownerOverdueReportedAt ?? null;
  const isTerminal = TERMINAL_STATUSES.includes(status);
  const isOverdue =
    !!slaDeadline &&
    !isTerminal &&
    new Date(slaDeadline).getTime() < Date.now();

  if (!slaDeadline && !overdueReportedAt) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {slaDeadline && (
        <div className="flex flex-col">
          <span
            className={
              isOverdue
                ? "text-xs font-medium text-destructive"
                : "text-xs text-muted-foreground"
            }
          >
            {isOverdue ? "Quá hạn" : "Hạn chót"}
          </span>
          <span
            className={
              isOverdue
                ? "text-sm font-medium text-destructive"
                : "text-sm font-medium"
            }
          >
            {fmt(slaDeadline)}
          </span>
        </div>
      )}
      {overdueReportedAt && (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-destructive">
            Chủ trại báo quá hạn
          </span>
          <span className="text-sm font-medium text-destructive">
            {fmt(overdueReportedAt)}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Cell 2 — Lịch hẹn
// ============================================================

type ScheduleCellProps = Pick<KitRequestResType, "type" | "scheduledAt">;

export function KitRequestScheduleCell({
  type,
  scheduledAt,
}: ScheduleCellProps) {
  if (!scheduledAt) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const label = scheduleLabelByType(type);

  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{fmt(scheduledAt)}</span>
    </div>
  );
}

function scheduleLabelByType(type: KitRequestTypeType): string {
  if (type === "RECOVERY_SCHEDULE") return "Hẹn thu hồi";
  if (type === "FAULT_REPORT") return "Hẹn thay";
  return "Hẹn lắp";
}
