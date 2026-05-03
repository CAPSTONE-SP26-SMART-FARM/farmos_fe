import { z } from "zod";

// Module 3 — TicketRating. Schema 1-1 với BE
// `farm_os_be/src/modules/ticket-lifecycle/ticket-lifecycle.model.ts:107-200`.
// UNIQUE per ticket; chỉ creator được rate; AI ticket KHÔNG được rate.
//
// QUAN TRỌNG:
//  - BE field là `feedback` (không phải `comment`).
//  - Stars max 5 (BE hard-cap, KHÔNG đọc từ system-config).
//  - Response field `invalidationReason` (không phải `invalidatedReason`).
//  - Response có `ratedBy`, `doctorId`. `tags` là `any` (không strict array).

export const RatingResSchema = z.object({
  id: z.string().uuid(),
  ticketId: z.string().uuid(),
  ratedBy: z.string().uuid(),
  doctorId: z.string().uuid(),
  stars: z.number().int(),
  feedback: z.string().nullable(),
  tags: z.unknown().nullable(),
  invalidatedAt: z.string().datetime().nullable(),
  invalidatedBy: z.string().uuid().nullable(),
  invalidationReason: z.string().nullable(),
  createdAt: z.string().datetime(),
});

// BE strict — chỉ accept đúng 3 field.
export const SubmitRatingBodySchema = z.object({
  stars: z.number().int().min(1).max(5),
  feedback: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

// BE B17 invalidate — body field là `reason` ([B17 controller — pending])
// hoặc trùng nghĩa `invalidationReason`. Confirm với BE khi B17 ship.
export const InvalidateRatingBodySchema = z.object({
  reason: z
    .string()
    .min(10, "Lý do tối thiểu 10 ký tự.")
    .max(500, "Lý do tối đa 500 ký tự."),
});

export type RatingResType = z.infer<typeof RatingResSchema>;
export type SubmitRatingBodyType = z.infer<typeof SubmitRatingBodySchema>;
export type InvalidateRatingBodyType = z.infer<
  typeof InvalidateRatingBodySchema
>;
// Alias cho code cũ tham chiếu CreateRatingBodyType (W3 sẽ migrate).
export type CreateRatingBodyType = SubmitRatingBodyType;
