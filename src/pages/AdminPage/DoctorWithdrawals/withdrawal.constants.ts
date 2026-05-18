import type { WithdrawalStatus } from "@/schemaValidatation/doctorWithdrawal";

export const STATUS_LABELS: Record<WithdrawalStatus, string> = {
  pending: "Chờ duyệt",
  in_progress: "Đang xử lý",
  paid: "Đã chuyển khoản",
  done: "Hoàn thành",
  rejected: "Bị từ chối",
  cancelled: "Đã huỷ",
  not_received: "Chưa nhận tiền",
};

export const STATUS_VARIANT: Record<
  WithdrawalStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  in_progress: "outline",
  paid: "outline",
  done: "default",
  rejected: "destructive",
  cancelled: "secondary",
  not_received: "outline",
};

export const STATUS_CLASS: Partial<Record<WithdrawalStatus, string>> = {
  in_progress: "border-blue-500 text-blue-600",
  paid: "border-purple-500 text-purple-600",
  not_received: "border-orange-500 text-orange-600",
};
