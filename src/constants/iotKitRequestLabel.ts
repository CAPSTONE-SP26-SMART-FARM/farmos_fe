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
