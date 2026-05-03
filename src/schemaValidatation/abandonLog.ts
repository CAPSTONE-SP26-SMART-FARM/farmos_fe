import { z } from "zod";

// Module 3 — TicketAbandonLog. Schema 1-1 với BE
// `farm_os_be/src/modules/ticket-lifecycle/ticket-lifecycle.model.ts:118-224`.

// BE prisma enum `AbandonResolution`. Tách rõ "system-only" RE_BROADCAST.
export const AbandonResolutionSchema = z.enum([
  "FALLBACK_AI",
  "REFUND_TICKET",
  "RE_BROADCAST",
]);

// Response schema từ BE B8 full payload.
export const AbandonLogResSchema = z.object({
  id: z.string().uuid(),
  ticketId: z.string().uuid(),
  doctorId: z.string().uuid(),
  acceptedAt: z.string().datetime(),
  abandonDetectedAt: z.string().datetime(),
  resolution: AbandonResolutionSchema,
  ownerChoice: z.string().nullable(),
  createdAt: z.string().datetime(),
});

// BE body B7: {resolution, note?} — KHÔNG phải `reason`.
export const AbandonTicketBodySchema = z.object({
  resolution: z.enum(["FALLBACK_AI", "REFUND_TICKET"]),
  note: z.string().optional(),
});

export type AbandonResolutionType = z.infer<typeof AbandonResolutionSchema>;
export type AbandonLogResType = z.infer<typeof AbandonLogResSchema>;
export type AbandonTicketBodyType = z.infer<typeof AbandonTicketBodySchema>;
// Alias cho code cũ (W3 sẽ rename).
export type AbandonResolutionBodyType = AbandonTicketBodyType;
