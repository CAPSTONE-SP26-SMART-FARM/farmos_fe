// Label tiếng Việt + helper style dùng chung cho mức độ sự cố (incident
// severity). Tránh hard-code rải rác ở 14+ component.

import type {
  IncidentSeverityType,
  TicketStatusType,
} from "@/schemaValidatation/ticket";

// ── Mức độ sự cố (incident severity) ───────────────────────────────────────

export const INCIDENT_SEVERITY_LABEL: Record<IncidentSeverityType, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  critical: "Nghiêm trọng",
};

// Tone màu phân biệt theo mức nguy hiểm: xám → xanh → cam → đỏ. Dùng solid
// background + text + border (không gradient) để badge đọc rõ trên cả light
// & dark theme.
export const INCIDENT_SEVERITY_CLASS: Record<IncidentSeverityType, string> = {
  low: "bg-slate-500/10 text-slate-700 border-slate-200",
  medium: "bg-blue-500/10 text-blue-700 border-blue-200",
  high: "bg-orange-500/10 text-orange-700 border-orange-200",
  critical: "bg-red-500/10 text-red-700 border-red-200",
};

// ── Tương thích với TicketPriority enum ────────────────────────────────────
// BE đôi khi trả về giá trị `TicketPriority` (`normal` / `urgent`) trong
// field `severity` cho một số ticket cũ. Để badge không bao giờ rỗng và
// hiển thị tiếng Việt chuẩn, map cả 2 giá trị này vào dict (đặt key thường,
// không thuộc IncidentSeverityType nên dùng object lookup riêng).

const PRIORITY_FALLBACK_LABEL: Record<string, string> = {
  normal: "Bình thường",
  urgent: "Khẩn cấp",
};

const PRIORITY_FALLBACK_CLASS: Record<string, string> = {
  normal: "bg-blue-500/10 text-blue-700 border-blue-200",
  urgent: "bg-red-500/10 text-red-700 border-red-200",
};

// Class neutral fallback khi severity không match dict (BE trả case lạ /
// null). Render badge xám thay vì badge rỗng.
const SEVERITY_CLASS_FALLBACK = "bg-muted text-muted-foreground border-muted";

/**
 * Chuẩn hoá severity input thành key match dict: trim whitespace + lowercase.
 * Trả về key chuẩn nếu match severity enum hoặc priority fallback, null nếu
 * không match cả 2.
 */
function normalizeSeverity(severity: string | null | undefined): string | null {
  if (severity == null) return null;
  const key = severity.toString().trim().toLowerCase();
  if (
    key in INCIDENT_SEVERITY_LABEL ||
    key in PRIORITY_FALLBACK_LABEL
  ) {
    return key;
  }
  return null;
}

/**
 * Trả label tiếng Việt cho severity. Defensive: trim + lowercase trước khi
 * lookup, ưu tiên `IncidentSeverity` enum, fallback `TicketPriority` enum
 * (cho ticket cũ BE trả nhầm). Cảnh báo console nếu nhận giá trị lạ.
 */
export function getSeverityLabel(
  severity: string | null | undefined,
): string {
  if (severity == null) return "—";
  const key = normalizeSeverity(severity);
  if (!key) {
    if (import.meta.env.DEV) {
      console.warn("[ticketLabel] unknown severity value:", severity);
    }
    return String(severity);
  }
  return (
    INCIDENT_SEVERITY_LABEL[key as IncidentSeverityType] ??
    PRIORITY_FALLBACK_LABEL[key]
  );
}

/** Trả Tailwind class cho severity. Fallback xám khi không match. */
export function getSeverityClass(severity: string | null | undefined): string {
  const key = normalizeSeverity(severity);
  if (!key) return SEVERITY_CLASS_FALLBACK;
  return (
    INCIDENT_SEVERITY_CLASS[key as IncidentSeverityType] ??
    PRIORITY_FALLBACK_CLASS[key] ??
    SEVERITY_CLASS_FALLBACK
  );
}

// ── Trạng thái ticket (TicketStatus) ───────────────────────────────────────

export const TICKET_STATUS_LABEL: Record<TicketStatusType, string> = {
  open: "Mở",
  assigned: "Đã phân công",
  in_progress: "Đang xử lý",
  resolved: "Đã giải quyết",
  closed: "Đã đóng",
  cancelled: "Đã hủy",
};

// Tone phân biệt 6 trạng thái: open (xám) → assigned (cyan) →
// in_progress (amber) → resolved (xanh) → closed (xám mờ) → cancelled (đỏ).
export const TICKET_STATUS_CLASS: Record<TicketStatusType, string> = {
  open: "bg-slate-500/10 text-slate-700 border-slate-200",
  assigned: "bg-cyan-500/10 text-cyan-700 border-cyan-200",
  in_progress: "bg-amber-500/10 text-amber-700 border-amber-200",
  resolved: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  closed: "bg-muted text-muted-foreground border-muted",
  cancelled: "bg-red-500/10 text-red-700 border-red-200",
};

const TICKET_STATUS_CLASS_FALLBACK =
  "bg-muted text-muted-foreground border-muted";

/**
 * Chuẩn hoá status input: trim + lowercase. BE thường trả lowercase
 * (TicketIncidentResSchema) nhưng một số payload (TicketBasicResSchema dùng
 * ở `/tickets/:id/full`) trả UPPERCASE → cần lowercase trước khi lookup.
 */
function normalizeStatus(
  status: string | null | undefined,
): TicketStatusType | null {
  if (status == null) return null;
  const key = status.toString().trim().toLowerCase();
  if (key in TICKET_STATUS_LABEL) {
    return key as TicketStatusType;
  }
  return null;
}

/** Trả label tiếng Việt cho status. Defensive: fallback raw value khi không match. */
export function getStatusLabel(status: string | null | undefined): string {
  if (status == null) return "—";
  const key = normalizeStatus(status);
  if (!key) {
    if (import.meta.env.DEV) {
      console.warn("[ticketLabel] unknown status value:", status);
    }
    return String(status);
  }
  return TICKET_STATUS_LABEL[key];
}

/** Trả Tailwind class cho status. Fallback xám khi không match. */
export function getStatusClass(status: string | null | undefined): string {
  const key = normalizeStatus(status);
  if (!key) return TICKET_STATUS_CLASS_FALLBACK;
  return TICKET_STATUS_CLASS[key];
}

// ── Tag đánh giá bác sĩ (free-text từ BE / mobile) ─────────────────────────
// BE docs (`docs/business/ticket-resolve-quality/02-resolve-flow.md:215`):
// "tags đều free-text, không có danh sách predefined ở phase 1". Mobile
// hiện submit snake_case English (seed: `professional / fast_response /
// clear_instructions`). FE map sang tiếng Việt + phân tone positive/negative
// để badge nhất quán với phần còn lại của UI ticket.

type RatingTagTone = "positive" | "negative" | "neutral";

interface RatingTagMeta {
  label: string;
  tone: RatingTagTone;
}

// Map normalized key (lowercase, _ và - đồng nghĩa) → label + tone.
const RATING_TAG_META: Record<string, RatingTagMeta> = {
  // ── Positive ────────────────────────────────────────────────────────────
  professional: { label: "Chuyên nghiệp", tone: "positive" },
  fast_response: { label: "Phản hồi nhanh", tone: "positive" },
  quick_response: { label: "Phản hồi nhanh", tone: "positive" },
  responsive: { label: "Phản hồi tốt", tone: "positive" },
  clear_instructions: { label: "Hướng dẫn rõ ràng", tone: "positive" },
  clear_explanation: { label: "Giải thích rõ ràng", tone: "positive" },
  detailed_explanation: { label: "Giải thích chi tiết", tone: "positive" },
  detailed_prescription: { label: "Đơn thuốc chi tiết", tone: "positive" },
  helpful: { label: "Hữu ích", tone: "positive" },
  friendly: { label: "Thân thiện", tone: "positive" },
  knowledgeable: { label: "Am hiểu chuyên môn", tone: "positive" },
  patient: { label: "Kiên nhẫn", tone: "positive" },
  dedicated: { label: "Tận tâm", tone: "positive" },
  accurate_diagnosis: { label: "Chẩn đoán chính xác", tone: "positive" },
  effective_solution: { label: "Giải pháp hiệu quả", tone: "positive" },
  close_followup: { label: "Theo dõi sát", tone: "positive" },
  quick_recovery: { label: "Hồi phục nhanh", tone: "positive" },
  // ── Negative ────────────────────────────────────────────────────────────
  slow_response: { label: "Phản hồi chậm", tone: "negative" },
  late_response: { label: "Phản hồi trễ", tone: "negative" },
  unhelpful: { label: "Chưa hữu ích", tone: "negative" },
  hard_to_reach: { label: "Khó liên lạc", tone: "negative" },
  unclear: { label: "Chưa rõ ràng", tone: "negative" },
  ineffective_solution: {
    label: "Giải pháp chưa hiệu quả",
    tone: "negative",
  },
  unprofessional: { label: "Thiếu chuyên nghiệp", tone: "negative" },
  rude: { label: "Thiếu lịch sự", tone: "negative" },
  // ── Vietnamese identity mapping (round-trip cho rating do FE web tạo) ───
  "chuyên nghiệp": { label: "Chuyên nghiệp", tone: "positive" },
  "phản hồi nhanh": { label: "Phản hồi nhanh", tone: "positive" },
  "giải thích rõ ràng": { label: "Giải thích rõ ràng", tone: "positive" },
  "đơn thuốc chi tiết": { label: "Đơn thuốc chi tiết", tone: "positive" },
  "theo dõi sát": { label: "Theo dõi sát", tone: "positive" },
  "tận tâm": { label: "Tận tâm", tone: "positive" },
  "khó liên lạc": { label: "Khó liên lạc", tone: "negative" },
  "giải pháp chưa hiệu quả": {
    label: "Giải pháp chưa hiệu quả",
    tone: "negative",
  },
};

const RATING_TAG_TONE_CLASS: Record<RatingTagTone, string> = {
  positive: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  negative: "bg-red-500/10 text-red-700 border-red-200",
  neutral: "bg-muted text-muted-foreground border-muted",
};

/**
 * Chuẩn hoá key tag: trim + lowercase + thay khoảng trắng/`-` bằng `_` để
 * match cả `fast_response`, `fast-response`, `Fast Response`...
 */
function normalizeTagKey(tag: string): string {
  return tag.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

/** Trả label tiếng Việt cho rating tag. Fallback raw value khi không match. */
export function getRatingTagLabel(tag: string): string {
  const trimmed = tag.trim();
  if (!trimmed) return tag;
  const key = normalizeTagKey(trimmed);
  // Thử 2 dạng key: snake_case (English) + lowercase nguyên (VN có dấu).
  const meta = RATING_TAG_META[key] ?? RATING_TAG_META[trimmed.toLowerCase()];
  if (!meta) {
    if (import.meta.env.DEV) {
      console.warn("[ticketLabel] unknown rating tag:", tag);
    }
    return tag;
  }
  return meta.label;
}

/** Trả Tailwind class cho rating tag dựa trên tone. */
export function getRatingTagClass(tag: string): string {
  const key = normalizeTagKey(tag);
  const meta = RATING_TAG_META[key] ?? RATING_TAG_META[tag.trim().toLowerCase()];
  return RATING_TAG_TONE_CLASS[meta?.tone ?? "neutral"];
}
