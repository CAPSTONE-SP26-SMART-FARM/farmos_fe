import { z } from "zod";
import { SolutionResSchema } from "./solution";
import { PrescriptionWithItemsResSchema } from "./prescription";
import { AddendumResSchema } from "./addendum";
import { RatingResSchema } from "./rating";
import { AbandonLogResSchema } from "./abandonLog";
import { BroadcastResSchema } from "./broadcast";

export const IncidentSeveritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);
export const TicketStatusSchema = z.enum([
  "open",
  "assigned",
  "in_progress",
  "resolved",
  "closed",
  "cancelled",
]);
export const TicketPrioritySchema = z.enum(["low", "normal", "high", "urgent"]);
export const TicketTypeSchema = z.enum(["general_support", "incident"]);

// Module 3 — Lý do đóng ticket (xuất hiện cùng `closedAt`).
export const CloseReasonSchema = z.enum([
  "CREATOR_CONFIRMED", // Creator gọi B5
  "AUTO_CLOSED", // Hệ thống tự đóng (B22) sau khi creator không action
  "AI_RESOLVED_NO_DOCTOR", // AI fallback (không Doctor accept) — không payout
  "ABANDON_REFUND", // Creator chọn REFUND_TICKET (B7)
  "ABANDON_FALLBACK_AI", // Creator chọn FALLBACK_AI (B7)
]);

export const TicketUserBriefSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  role: z.string(),
});

export const TicketZoneBriefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  farmId: z.string().uuid(),
});

export const TicketFarmBriefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  ownerId: z.string().uuid(),
});

export const TicketAttachmentInputSchema = z.object({
  url: z.string().min(1),
});

export const TicketAttachmentBriefSchema = z.object({
  id: z.string().uuid(),
  url: z.string(),
  uploadedBy: z.string().uuid(),
  createdAt: z.string().datetime(),
});

export const TicketIncidentResSchema = z.object({
  id: z.string().uuid(),
  ticketNumber: z.string(),
  ticketType: TicketTypeSchema,
  status: TicketStatusSchema,
  priority: TicketPrioritySchema,
  severity: IncidentSeveritySchema,
  title: z.string(),
  description: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
  assignedTo: z.string().uuid().nullable(),
  farmId: z.string().uuid().nullable(),
  zoneId: z.string().uuid(),
  creator: TicketUserBriefSchema,
  assignee: TicketUserBriefSchema.nullable(),
  farm: TicketFarmBriefSchema.nullable(),
  zone: TicketZoneBriefSchema.nullable(),
  attachments: z.array(TicketAttachmentBriefSchema),
  productionMilestone: z.object({
    id: z.string().uuid(),
  }),
  // ── Module 3 fields (đặt optional để không vỡ flow cũ khi feature flag off) ──
  resolvedAt: z.string().datetime().nullable().optional(),
  closedAt: z.string().datetime().nullable().optional(),
  closeReason: CloseReasonSchema.nullable().optional(),
  // BE doc: VARCHAR 64 — có thể là user UUID hoặc sentinel `'SYSTEM_AUTO_CLOSE'`.
  closedBy: z.string().nullable().optional(),
  isAIResolved: z.boolean().optional(),
  aiResolvedAt: z.string().datetime().nullable().optional(),
  payoutAt: z.string().datetime().nullable().optional(),
  payoutPercentSnapshot: z.number().nullable().optional(),
  // Tier snapshot: chỉ Admin mới render ở UI (BR-81 chặt hơn).
  payoutTierSnapshot: z.string().nullable().optional(),
});

export const CreateIncidentTicketBodySchema = z.object({
  milestoneId: z.string().uuid({ message: "Vui lòng chọn cột mốc sản xuất." }),
  title: z.string().min(1, "Tiêu đề không được để trống."),
  description: z.string().min(1, "Mô tả không được để trống."),
  severity: IncidentSeveritySchema,
  attachments: z.array(TicketAttachmentInputSchema).optional(),
});

export const ListIncidentTicketsQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

export const TicketIncidentListResSchema = z.object({
  data: z.array(TicketIncidentResSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
});

export type IncidentSeverityType = z.infer<typeof IncidentSeveritySchema>;
export type TicketStatusType = z.infer<typeof TicketStatusSchema>;
export type TicketPriorityType = z.infer<typeof TicketPrioritySchema>;
export type CloseReasonType = z.infer<typeof CloseReasonSchema>;
export type TicketIncidentResType = z.infer<typeof TicketIncidentResSchema>;
export type TicketUserBriefType = z.infer<typeof TicketUserBriefSchema>;
export type TicketFarmBriefType = z.infer<typeof TicketFarmBriefSchema>;
export type TicketZoneBriefType = z.infer<typeof TicketZoneBriefSchema>;
export type CreateIncidentTicketBodyType = z.infer<
  typeof CreateIncidentTicketBodySchema
>;
export type ListIncidentTicketsQueryType = z.infer<
  typeof ListIncidentTicketsQuerySchema
>;
export type TicketIncidentListResType = z.infer<
  typeof TicketIncidentListResSchema
>;

// ── Module 3 — TicketFullResSchema (B8 GET /tickets/:id/full) ─────────────
// Schema 1-1 với BE
// `farm_os_be/src/modules/ticket-lifecycle/ticket-lifecycle.model.ts:226-260`.
//
// QUAN TRỌNG: BE response lồng `{ticket: {...}, solution, prescription, addenda,
// rating, broadcasts, abandonLogs}` — KHÔNG flat extend như trước. Field
// `ticket` chỉ chứa shape lite (TicketBasicResSchema), KHÔNG có
// creator/assignee/farm/zone join (pending decision với BE — UI cần thì
// gọi separate hoặc BE bổ sung).

// BE prisma enum mirror.
export const TicketStatusUpperSchema = z.enum([
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
]);

export const TicketBasicResSchema = z.object({
  id: z.string().uuid(),
  ticketNumber: z.string(),
  status: TicketStatusUpperSchema,
  priority: z.string(),
  severity: z.string(),
  title: z.string(),
  description: z.string(),
  createdBy: z.string().uuid(),
  assignedTo: z.string().uuid().nullable(),
  farmId: z.string().uuid().nullable(),
  zoneId: z.string().uuid(),
  categoryConfigId: z.string().uuid().nullable(),
  unitPriceSnapshot: z.number().nullable(),
  source: z.string().nullable(),
  resolvedAt: z.string().datetime().nullable(),
  resolvedBy: z.string().uuid().nullable(),
  closedAt: z.string().datetime().nullable(),
  closedBy: z.string().nullable(),
  closeReason: CloseReasonSchema.nullable(),
  isAIResolved: z.boolean(),
  aiResolvedAt: z.string().datetime().nullable(),
  payoutAt: z.string().datetime().nullable().optional(),
  payoutPercentSnapshot: z.number().nullable().optional(),
  payoutTierSnapshot: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// P2-2 — `pendingFallbackChoice` ở TOP-LEVEL của FullRes (sibling của `ticket`,
// không phải nested trong `ticket`). Khớp BE
// `farm_os_be/src/modules/ticket-lifecycle/ticket-lifecycle.model.ts:265-269`.
// Optional để backward-compat nếu BE cũ chưa rollout flag này.
export const TicketFullResSchema = z.object({
  ticket: TicketBasicResSchema,
  solution: SolutionResSchema.nullable(),
  prescription: PrescriptionWithItemsResSchema.nullable(),
  addenda: z.array(AddendumResSchema),
  rating: RatingResSchema.nullable(),
  broadcasts: z.array(BroadcastResSchema),
  abandonLogs: z.array(AbandonLogResSchema),
  pendingFallbackChoice: z.boolean().optional(),
});

// ── Body schemas — Module 3 actions ──────────────────────────────────────

// B5 — POST /tickets/:id/close
// BE accept body `{confirmed: boolean (default true), note?: string}`.
export const CloseTicketBodySchema = z.object({
  confirmed: z.boolean().optional(), // default true ở BE
  note: z.string().optional(),
});

// B2 — POST /tickets/:id/resolve (Doctor — mobile, FE web không gọi)
// Schema để FE share type cho Admin Ticket Detail render solution preview.
const Solution4Fields = {
  rootCause: z.string().min(20, "Tối thiểu 20 ký tự."),
  rootCauseReason: z.string().min(20, "Tối thiểu 20 ký tự."),
  treatment: z.string().min(20, "Tối thiểu 20 ký tự."),
  prevention: z.string().min(20, "Tối thiểu 20 ký tự."),
};

export const ResolveTicketBodySchema = z.object({
  ...Solution4Fields,
  severityNote: z.string().nullable().optional(),
  prescription: z
    .object({
      generalNotes: z.string().nullable().optional(),
      // PrescriptionItemInputSchema sẽ import từ prescription.ts ở caller
      // để tránh circular import. Type-check vẫn ok qua z.unknown() interim.
      items: z.array(z.unknown()).min(1),
    })
    .optional(),
});

export type TicketStatusUpperType = z.infer<typeof TicketStatusUpperSchema>;
export type TicketBasicResType = z.infer<typeof TicketBasicResSchema>;
export type TicketFullResType = z.infer<typeof TicketFullResSchema>;
export type CloseTicketBodyType = z.infer<typeof CloseTicketBodySchema>;
export type ResolveTicketBodyType = z.infer<typeof ResolveTicketBodySchema>;
