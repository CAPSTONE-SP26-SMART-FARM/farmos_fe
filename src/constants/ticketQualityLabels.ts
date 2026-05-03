// Module 3 — Label tiếng Việt + helper render cho UI Ticket Quality.
// Tập trung 1 file để tránh hard-code rải rác (mục I10 v2 doc).
//
// Quy tắc:
// - TIER_LABEL & TIER_BADGE_CLASS chỉ render ở UI Admin (BR-81 chặt hơn —
//   Owner/Manager/Doctor public KHÔNG được thấy tier).
// - Mọi class màu là solid (Tailwind semantic + opacity), KHÔNG gradient.

import type { CloseReasonType } from "@/schemaValidatation/ticket";
import type { AbandonResolutionType } from "@/schemaValidatation/abandonLog";
import type { AddendumTypeType } from "@/schemaValidatation/addendum";
import type { BroadcastStatusType } from "@/schemaValidatation/broadcast";
import type { TierType } from "@/schemaValidatation/dqs";
import type { PrescriptionStatusType } from "@/schemaValidatation/prescription";

// ── Lý do đóng ticket ─────────────────────────────────────────────────────
export const CLOSE_REASON_LABEL: Record<CloseReasonType, string> = {
  CREATOR_CONFIRMED: "Người tạo xác nhận",
  AUTO_CLOSED: "Hệ thống tự đóng",
  AI_RESOLVED_NO_DOCTOR: "AI xử lý (không có bác sĩ)",
  ABANDON_REFUND: "Hoàn ticket về quota",
  ABANDON_FALLBACK_AI: "Chuyển sang AI",
};

// Solid badge class (không gradient).
export const CLOSE_REASON_BADGE_CLASS: Record<CloseReasonType, string> = {
  CREATOR_CONFIRMED: "bg-emerald-500/10 text-emerald-700",
  AUTO_CLOSED: "bg-muted text-foreground",
  AI_RESOLVED_NO_DOCTOR: "bg-amber-500/10 text-amber-700",
  ABANDON_REFUND: "bg-red-500/10 text-red-700",
  ABANDON_FALLBACK_AI: "bg-amber-500/10 text-amber-700",
};

// ── Abandon resolution ────────────────────────────────────────────────────
export const ABANDON_RESOLUTION_LABEL: Record<AbandonResolutionType, string> = {
  FALLBACK_AI: "Chuyển sang AI xử lý",
  REFUND_TICKET: "Hoàn ticket về quota",
  RE_BROADCAST: "Phát lại cho bác sĩ khác", // chỉ system gọi
};

// ── Addendum type ─────────────────────────────────────────────────────────
export const ADDENDUM_TYPE_LABEL: Record<AddendumTypeType, string> = {
  SOLUTION_NOTE: "Bổ sung giải pháp",
  PRESCRIPTION_NOTE: "Bổ sung đơn thuốc",
  CORRECTION: "Đính chính",
};

// ── Broadcast status ──────────────────────────────────────────────────────
export const BROADCAST_STATUS_LABEL: Record<BroadcastStatusType, string> = {
  PENDING: "Đang chờ",
  ACCEPTED: "Đã nhận",
  REJECTED: "Đã từ chối",
  IGNORED: "Bỏ qua (hết thời gian)",
};

export const BROADCAST_STATUS_DOT_CLASS: Record<BroadcastStatusType, string> = {
  PENDING: "bg-muted-foreground",
  ACCEPTED: "bg-emerald-600",
  REJECTED: "bg-red-600",
  IGNORED: "bg-amber-600",
};

// ── Tier (CHỈ Admin được render) ──────────────────────────────────────────
export const TIER_LABEL: Record<TierType, string> = {
  BRONZE: "Đồng",
  SILVER: "Bạc",
  GOLD: "Vàng",
  PLATINUM: "Bạch kim",
};

// Solid colour, không gradient.
export const TIER_BADGE_CLASS: Record<TierType, string> = {
  BRONZE: "bg-amber-500/10 text-amber-700 border-amber-200",
  SILVER: "bg-zinc-300/40 text-zinc-700 border-zinc-300",
  GOLD: "bg-yellow-500/15 text-yellow-700 border-yellow-300",
  PLATINUM: "bg-cyan-500/15 text-cyan-700 border-cyan-300",
};

// ── 5 tiêu chí điểm chất lượng bác sĩ (theo quy chế DQS, 30 ngày gần nhất) ──
// Trọng số: đánh giá 40%, tần suất 20%, đúng hạn 20%, tỷ lệ nhận 10%, trực tuyến 10%.
export const DQS_SUBSCORE_LABEL = {
  ratingScore: "Đánh giá sao trung bình",
  frequencyScore: "Tần suất xử lý",
  slaScore: "Đúng hạn",
  acceptanceScore: "Tỷ lệ nhận ticket",
  onlineScore: "Thời lượng trực tuyến",
} as const;

export const DQS_SUBSCORE_WEIGHT: Record<
  keyof typeof DQS_SUBSCORE_LABEL,
  number
> = {
  ratingScore: 40,
  frequencyScore: 20,
  slaScore: 20,
  acceptanceScore: 10,
  onlineScore: 10,
};

export const DQS_SUBSCORE_HINT: Record<
  keyof typeof DQS_SUBSCORE_LABEL,
  string
> = {
  ratingScore:
    "Trung bình số sao mà người tạo ticket đánh giá bác sĩ trong 30 ngày qua.",
  frequencyScore:
    "Số ticket bác sĩ đã xử lý so với mục tiêu trong 30 ngày qua.",
  slaScore:
    "Tỷ lệ bác sĩ tiếp nhận ticket đúng giờ và xử lý xong trong vòng 24 giờ.",
  acceptanceScore:
    "Số ticket bác sĩ chấp nhận trên tổng số ticket được hệ thống gửi đến.",
  onlineScore: "Tổng thời lượng bác sĩ trực tuyến trong 30 ngày qua.",
};

// ── Prescription status ───────────────────────────────────────────────────
export const PRESCRIPTION_STATUS_LABEL: Record<PrescriptionStatusType, string> =
  {
    ISSUED: "Đang hiệu lực",
    SUPERSEDED: "Đã thay thế",
    CANCELLED: "Đã huỷ",
  };

// ── Withdrawal warning ────────────────────────────────────────────────────
export function withdrawalWarning(days: number | null | undefined): string {
  if (!days || days <= 0) return "";
  return `Thời gian ngừng thuốc trước thu hoạch: ${days} ngày.`;
}

// ── Rating tag options (dropdown predefined; tránh để user free-text khó aggregate) ──
export const RATING_TAG_OPTIONS: readonly string[] = [
  "Phản hồi nhanh",
  "Giải thích rõ ràng",
  "Đơn thuốc chi tiết",
  "Theo dõi sát",
  "Tận tâm",
  "Khó liên lạc",
  "Giải pháp chưa hiệu quả",
] as const;
