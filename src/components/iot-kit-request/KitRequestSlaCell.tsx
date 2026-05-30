import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type {
  KitRequestResType,
  KitRequestStatusType,
} from "@/schemaValidatation/iotKitRequest";

/**
 * Cell hiển thị thời gian cam kết của request kit IoT.
 * Dùng chung cho 3 trang: owner / admin / manager.
 *
 * Hiển thị tối đa 2 dòng:
 *   - "Hẹn lắp/thay/thu hồi: ..."  → scheduledAt (admin chốt giờ ghé)
 *   - "Hạn chót: ..."              → slaDeadline (cam kết phải lắp xong trước)
 *
 * Theo BE hiện tại:
 *   - INSTALL_SCHEDULE: có slaDeadline, không scheduledAt
 *   - SWAP / RECOVERY: có scheduledAt, không slaDeadline
 *
 * Hạn chót quá deadline + request chưa đóng → highlight đỏ.
 */

const TERMINAL_STATUSES: KitRequestStatusType[] = [
  "resolved",
  "rejected",
  "cancelled",
];

const fmt = (iso: string) =>
  format(new Date(iso), "HH:mm dd/MM/yyyy", { locale: vi });

export function KitRequestSlaCell({
  type,
  status,
  slaDeadline,
  scheduledAt,
  metadata,
}: Pick<
  KitRequestResType,
  "type" | "status" | "slaDeadline" | "scheduledAt" | "metadata"
>) {
  const overdueReportedAt = metadata?.ownerOverdueReportedAt ?? null;
  const isTerminal = TERMINAL_STATUSES.includes(status);

  const scheduledLabel =
    type === "RECOVERY_SCHEDULE"
      ? "Hẹn thu hồi"
      : type === "FAULT_REPORT"
        ? "Hẹn thay"
        : "Hẹn lắp";

  const isOverdue =
    !!slaDeadline &&
    !isTerminal &&
    new Date(slaDeadline).getTime() < Date.now();

  if (!scheduledAt && !slaDeadline && !overdueReportedAt) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {scheduledAt && (
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">
            {scheduledLabel}
          </span>
          <span className="text-sm font-medium">{fmt(scheduledAt)}</span>
        </div>
      )}
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
