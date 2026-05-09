import { z } from "zod";

// Cancel form — POST /tickets/:id/cancel. BE accept body `{reason?: string}`
// (xem `farm_os_be/src/modules/ticket-v2/ticket-v2.model.ts`).
// Đây là schema V2 duy nhất web FE còn dùng (sau khi gỡ luồng tạo ticket
// và list/detail orphan).
export const CancelTicketV2BodySchema = z.object({
  reason: z.string().optional(),
});

export type CancelTicketV2BodyType = z.infer<typeof CancelTicketV2BodySchema>;
