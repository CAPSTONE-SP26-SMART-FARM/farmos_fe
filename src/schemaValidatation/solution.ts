import { z } from "zod";

// Module 3 — TicketSolution. Schema 1-1 với BE
// `farm_os_be/src/modules/ticket-lifecycle/ticket-lifecycle.model.ts:128-142`.
// Bốn trường giải pháp do Doctor (hoặc AI fallback) ghi sau resolve.
// Immutable — bổ sung qua TicketAddendum.

export const SolutionSourceSchema = z.enum(["DOCTOR", "AI"]);

export const SolutionResSchema = z.object({
  id: z.string().uuid(),
  ticketId: z.string().uuid(),
  // BE field: `authorId` (không phải `createdBy`).
  authorId: z.string(),
  source: SolutionSourceSchema,
  rootCause: z.string(),
  rootCauseReason: z.string(),
  treatment: z.string(),
  prevention: z.string(),
  severityNote: z.string().nullable(),
  language: z.string(),
  createdAt: z.string().datetime(),
});

export type SolutionSourceType = z.infer<typeof SolutionSourceSchema>;
export type SolutionResType = z.infer<typeof SolutionResSchema>;
