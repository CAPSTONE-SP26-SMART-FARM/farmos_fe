import type {
  KitRequestDirectionType,
  KitRequestStatusType,
  KitRequestTypeType,
} from "@/schemaValidatation/iotKitRequest";

/**
 * Label tiếng Việt cho UI Iot Kit Request. KHÔNG dùng raw enum trên UI
 * (rule 17 — 100% tiếng Việt cho user). Mọi component muốn render status /
 * type / direction phải đi qua map ở đây.
 */

export const KIT_REQUEST_STATUS_LABEL: Record<KitRequestStatusType, string> = {
  pending: "Chờ tiếp nhận",
  in_progress: "Đang xử lý",
  accepted: "Đã chốt lịch",
  resolved: "Đã xử lý xong",
  rejected: "Đã từ chối",
  cancelled: "Đã hủy",
};

export const KIT_REQUEST_TYPE_LABEL: Record<KitRequestTypeType, string> = {
  FAULT_REPORT: "Báo lỗi thiết bị",
  INSTALL_SCHEDULE: "Lịch lắp đặt",
  RECOVERY_SCHEDULE: "Thu hồi thiết bị",
};

export const KIT_REQUEST_DIRECTION_LABEL: Record<
  KitRequestDirectionType,
  string
> = {
  OWNER_TO_ADMIN: "Chủ trại gửi quản trị",
  ADMIN_TO_OWNER: "Quản trị gửi chủ trại",
};

/**
 * Map sang `variant` chuẩn của shadcn Badge. Wrap component badge tự
 * apply màu phù hợp — không hardcode className màu ở đây.
 */
export type KitRequestBadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline";

export const KIT_REQUEST_STATUS_BADGE_VARIANT: Record<
  KitRequestStatusType,
  KitRequestBadgeVariant
> = {
  pending: "secondary",
  in_progress: "default",
  accepted: "default",
  resolved: "outline",
  rejected: "destructive",
  cancelled: "outline",
};

/**
 * Lý do tạo request — lưu trong metadata. Phân biệt nguồn trigger để admin
 * biết bối cảnh xử lý (vd thu hồi cuối vụ ≠ thu hồi do hết gói thuê).
 */
export const KIT_REQUEST_RECOVERY_REASON_LABEL: Record<
  "milestone_transition" | "cropseason_completed" | "subscription_ended",
  string
> = {
  milestone_transition: "Chuyển sang vụ mới",
  cropseason_completed: "Vụ mùa đã kết thúc",
  subscription_ended: "Gói thuê đã kết thúc",
};

export const KIT_REQUEST_INSTALL_REASON_LABEL: Record<
  "crop_approved" | "milestone_started",
  string
> = {
  crop_approved: "Duyệt vụ mùa mới",
  milestone_started: "Bắt đầu giai đoạn mới",
};

/**
 * Đích đến của thiết bị sau khi thu hồi xong.
 *  - `purchase`  : vẫn thuộc chủ trại (gói thuê còn) — chờ vụ sau dùng lại.
 *  - `available` : trả về kho hệ thống (gói thuê đã kết thúc) — không thuộc chủ trại nữa.
 */
export const KIT_REQUEST_BOARD_OUTCOME_LABEL: Record<
  "purchase" | "available",
  string
> = {
  purchase: "Giữ cho chủ trại dùng tiếp",
  available: "Trả về kho hệ thống",
};

/** Status được coi là "đang mở" — chưa kết thúc. Owner tab "Đang mở" dùng. */
export const OPEN_KIT_REQUEST_STATUSES: KitRequestStatusType[] = [
  "pending",
  "in_progress",
  "accepted",
];

/** Status terminal — kết thúc, không action được nữa. */
export const TERMINAL_KIT_REQUEST_STATUSES: KitRequestStatusType[] = [
  "resolved",
  "rejected",
  "cancelled",
];

export const isOpenKitRequest = (status: KitRequestStatusType): boolean =>
  OPEN_KIT_REQUEST_STATUSES.includes(status);

export const isTerminalKitRequest = (status: KitRequestStatusType): boolean =>
  TERMINAL_KIT_REQUEST_STATUSES.includes(status);
