import { Badge } from "@/components/ui/badge";
import {
  KIT_REQUEST_BOARD_OUTCOME_LABEL,
  KIT_REQUEST_DIRECTION_LABEL,
  KIT_REQUEST_INSTALL_REASON_LABEL,
  KIT_REQUEST_RECOVERY_REASON_LABEL,
  KIT_REQUEST_STATUS_BADGE_VARIANT,
  KIT_REQUEST_STATUS_LABEL,
  KIT_REQUEST_TYPE_LABEL,
} from "@/constants/iotKitRequestLabel";
import type {
  KitRequestDirectionType,
  KitRequestStatusType,
  KitRequestTypeType,
} from "@/schemaValidatation/iotKitRequest";
import {
  AlertTriangle,
  ArrowLeftRight,
  CalendarClock,
  CheckCircle2,
  PackageOpen,
  Sprout,
  Tractor,
  Warehouse,
  XCircle,
} from "lucide-react";

/**
 * Badge tái sử dụng cho mọi page Iot Kit Request. Tách thành component
 * vì sẽ xuất hiện ở: cell bảng (owner + admin), filter chip, detail
 * sheet header, decision page card.
 */

export function KitRequestStatusBadge({
  status,
  className,
}: {
  status: KitRequestStatusType;
  className?: string;
}) {
  return (
    <Badge
      variant={KIT_REQUEST_STATUS_BADGE_VARIANT[status]}
      className={className}
    >
      {KIT_REQUEST_STATUS_LABEL[status]}
    </Badge>
  );
}

export function KitRequestTypeBadge({
  type,
  className,
}: {
  type: KitRequestTypeType;
  className?: string;
}) {
  const Icon =
    type === "FAULT_REPORT"
      ? AlertTriangle
      : type === "RECOVERY_SCHEDULE"
        ? PackageOpen
        : CalendarClock;
  return (
    <Badge
      variant="outline"
      className={`gap-1 ${className ?? ""}`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {KIT_REQUEST_TYPE_LABEL[type]}
    </Badge>
  );
}

export function KitRequestDirectionBadge({
  direction,
  className,
}: {
  direction: KitRequestDirectionType;
  className?: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={className}
    >
      {KIT_REQUEST_DIRECTION_LABEL[direction]}
    </Badge>
  );
}

/**
 * Badge cho lý do tạo recovery request — màu phân biệt mức độ nghiêm trọng:
 *  - subscription_ended → đỏ (terminal, board về kho hệ thống, không thể đảo ngược)
 *  - cropseason_completed → vàng (vụ vừa kết thúc, board chờ vụ sau)
 *  - milestone_transition → xanh dương (chuyển giai đoạn, hoạt động bình thường)
 */
export function KitRequestRecoveryReasonBadge({
  reason,
  className,
}: {
  reason: "milestone_transition" | "cropseason_completed" | "subscription_ended";
  className?: string;
}) {
  const Icon =
    reason === "subscription_ended"
      ? XCircle
      : reason === "cropseason_completed"
        ? CheckCircle2
        : ArrowLeftRight;
  const colorClass =
    reason === "subscription_ended"
      ? "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
      : reason === "cropseason_completed"
        ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
        : "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300";
  return (
    <Badge
      variant="outline"
      className={`gap-1 ${colorClass} ${className ?? ""}`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {KIT_REQUEST_RECOVERY_REASON_LABEL[reason]}
    </Badge>
  );
}

/**
 * Badge cho đích đến của board sau khi complete-recovery.
 *  - purchase  → xanh lá (vẫn thuộc chủ trại)
 *  - available → xám (về kho hệ thống, không còn thuộc chủ trại)
 */
export function KitRequestBoardOutcomeBadge({
  outcome,
  className,
}: {
  outcome: "purchase" | "available";
  className?: string;
}) {
  const Icon = outcome === "purchase" ? Tractor : Warehouse;
  const colorClass =
    outcome === "purchase"
      ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
      : "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300";
  return (
    <Badge
      variant="outline"
      className={`gap-1 ${colorClass} ${className ?? ""}`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {KIT_REQUEST_BOARD_OUTCOME_LABEL[outcome]}
    </Badge>
  );
}

/**
 * Badge cho lý do tạo install request.
 */
export function KitRequestInstallReasonBadge({
  reason,
  className,
}: {
  reason: "crop_approved" | "milestone_started";
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={`gap-1 ${className ?? ""}`}
    >
      <Sprout className="h-3 w-3" aria-hidden />
      {KIT_REQUEST_INSTALL_REASON_LABEL[reason]}
    </Badge>
  );
}
