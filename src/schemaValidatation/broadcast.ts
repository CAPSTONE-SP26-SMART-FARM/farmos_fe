import { z } from "zod";

// Module 3 — TicketBroadcast. Schema 1-1 với BE
// `farm_os_be/src/modules/ticket-lifecycle/ticket-lifecycle.model.ts:202-211`.
// BE field: `notifiedAt` (không phải `sentAt`).

// BE prisma enum `TicketBroadcastStatus`.
export const BroadcastStatusSchema = z.enum([
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "IGNORED",
]);

export const BroadcastResSchema = z.object({
  id: z.string().uuid(),
  ticketId: z.string().uuid(),
  doctorId: z.string().uuid(),
  status: BroadcastStatusSchema,
  notifiedAt: z.string().datetime(),
  respondedAt: z.string().datetime().nullable(),
});

export type BroadcastStatusType = z.infer<typeof BroadcastStatusSchema>;
export type BroadcastResType = z.infer<typeof BroadcastResSchema>;
