import { z } from "zod";
import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";

// ── Enums ─────────────────────────────────────────────────────────────────────
export const TicketV2StatusSchema = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CANCELLED",
  "PENDING_PAYMENT",
]);

// BE prisma enum `IncidentSeverity` lowercase (xem
// `farm_os_be/prisma/schema.prisma:170`). Phải khớp đúng case để qua zod
// `.strict()` của BE V2 Create body.
export const TicketV2SeveritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

// ── Nested objects ────────────────────────────────────────────────────────────
const CategorySnapshotSchema = z.object({
  categoryId: z.string().uuid(),
  categoryCode: z.string(),
  categoryName: z.string(),
  unitPrice: z.number(),
  commissionPercent: z.number(),
  creditType: z.string().nullable(),
});

const UserRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().optional(),
});

const FarmRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

const ZoneRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

// ── Response schemas ──────────────────────────────────────────────────────────
export const TicketV2Schema = z.object({
  id: z.string().uuid(),
  ticketNumber: z.string(),
  status: TicketV2StatusSchema,
  severity: TicketV2SeveritySchema,
  title: z.string(),
  description: z.string().nullable(),
  milestoneId: z.string().uuid().nullable(),
  categoryConfigId: z.string().uuid(),
  categorySnapshot: CategorySnapshotSchema.nullable(),
  sourceType: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: UserRefSchema.nullable().optional(),
  farm: FarmRefSchema.nullable().optional(),
  zone: ZoneRefSchema.nullable().optional(),
  assignee: UserRefSchema.nullable().optional(),
  attachments: z.array(z.string()).nullable().optional(),
});

export const TicketV2ListResSchema = PagingResponseSchema(TicketV2Schema);

// ── Ticket balance ────────────────────────────────────────────────────────────
// Khớp BE `TicketBalancePerCategorySchema`
// (`farm_os_be/src/modules/ticket-v2/ticket-v2.model.ts:43-55` `.strict()`).
// BE field name là `categoryConfigId`, có thêm `categoryCode`, `featureCode`,
// `unitPrice`. `creditType` là string required (không nullable).
export const TicketBalanceItemSchema = z.object({
  categoryConfigId: z.string().uuid(),
  categoryCode: z.string(),
  categoryName: z.string(),
  featureCode: z.string(),
  creditType: z.string(),
  unitPrice: z.number(),
  fromSubscription: z.number(),
  fromPurchased: z.number(),
  total: z.number(),
});

export const TicketBalanceResSchema = z.object({
  data: z.array(TicketBalanceItemSchema),
});

// ── Create form schema ────────────────────────────────────────────────────────
// Khớp BE `farm_os_be/src/modules/ticket-v2/ticket-v2.model.ts:14-23`
// (`.strict()` body — extra/missing field → 422).
//   milestoneId:      uuidSchema (REQUIRED)
//   categoryConfigId: uuidSchema (REQUIRED)
//   title:            string min(1)
//   description:      string min(1) (REQUIRED — không phải optional)
//   severity:         IncidentSeveritySchema (lowercase)
//   attachments:      array<{url: string}> (optional)
export const TicketAttachmentInputSchema = z.object({
  url: z.string().min(1),
});

export const CreateTicketV2BodySchema = z.object({
  milestoneId: z.string().uuid("Vui lòng chọn cột mốc sản xuất."),
  categoryConfigId: z.string().uuid("Vui lòng chọn danh mục ticket."),
  title: z
    .string()
    .min(1, "Tiêu đề không được để trống.")
    .max(200, "Tiêu đề không quá 200 ký tự."),
  description: z.string().min(1, "Mô tả không được để trống."),
  severity: TicketV2SeveritySchema,
  attachments: z.array(TicketAttachmentInputSchema).optional(),
});

// ── Cancel form schema ────────────────────────────────────────────────────────
export const CancelTicketV2BodySchema = z.object({
  reason: z.string().optional(),
});

// ── Query schema ──────────────────────────────────────────────────────────────
export const ListTicketV2QuerySchema = PagingRequestSchema.extend({
  status: TicketV2StatusSchema.optional(),
  severity: TicketV2SeveritySchema.optional(),
  assigneeId: z.string().uuid().optional(),
  farmId: z.string().uuid().optional(),
  zoneId: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

// ── Inferred types ────────────────────────────────────────────────────────────
export type TicketV2StatusType = z.infer<typeof TicketV2StatusSchema>;
export type TicketV2SeverityType = z.infer<typeof TicketV2SeveritySchema>;
export type TicketV2Type = z.infer<typeof TicketV2Schema>;
export type TicketV2ListResType = z.infer<typeof TicketV2ListResSchema>;
export type TicketBalanceItemType = z.infer<typeof TicketBalanceItemSchema>;
export type TicketBalanceResType = z.infer<typeof TicketBalanceResSchema>;
export type CreateTicketV2BodyType = z.infer<typeof CreateTicketV2BodySchema>;
export type CancelTicketV2BodyType = z.infer<typeof CancelTicketV2BodySchema>;
export type ListTicketV2QueryType = z.infer<typeof ListTicketV2QuerySchema>;
