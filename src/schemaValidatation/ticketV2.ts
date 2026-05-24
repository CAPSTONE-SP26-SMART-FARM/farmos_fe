import { z } from "zod";
import {
  TicketIncidentResSchema,
  TicketStatusSchema,
} from "./ticket";

// Cancel form — POST /tickets/:id/cancel. BE accept body `{reason?: string}`
// (xem `farm_os_be/src/modules/ticket-v2/ticket-v2.model.ts`).
export const CancelTicketV2BodySchema = z.object({
  reason: z.string().optional(),
});

export type CancelTicketV2BodyType = z.infer<typeof CancelTicketV2BodySchema>;

// ── List v2 — GET /tickets ───────────────────────────────────────────────
// BE hierarchical scope: tự lọc theo role caller (owner / manager / admin /
// farmer / doctor). FE chỉ cần truyền filter tuỳ ý (milestoneId / farmId /
// zoneId / status / categoryConfigId / dateRange).
export const ListTicketsV2QuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  farmId: z.string().uuid().optional(),
  zoneId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
  status: TicketStatusSchema.optional(),
  categoryConfigId: z.string().uuid().optional(),
  dateRange: z.string().optional(),
});

export type ListTicketsV2QueryType = z.infer<typeof ListTicketsV2QuerySchema>;

// TicketV2 response = TicketIncident + thêm 4 snapshot field.
export const TicketV2ResSchema = TicketIncidentResSchema.extend({
  categoryConfigId: z.string().uuid().nullable(),
  unitPriceSnapshot: z.number().nullable(),
  commissionPercentSnapshot: z.number().nullable(),
  source: z.string().nullable(),
  sourceLedgerId: z.string().uuid().nullable(),
});

export const ListTicketsV2ResSchema = z.object({
  data: z.array(TicketV2ResSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
});

export type TicketV2ResType = z.infer<typeof TicketV2ResSchema>;
export type ListTicketsV2ResType = z.infer<typeof ListTicketsV2ResSchema>;
