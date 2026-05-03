import { z } from "zod";

// Module 3 — TicketAddendum (append-only). Schema 1-1 với BE
// `farm_os_be/src/modules/ticket-lifecycle/ticket-lifecycle.model.ts:175-184`.

// BE prisma enum `AddendumType` — confirm 3 giá trị từ schema.prisma.
export const AddendumTypeSchema = z.enum([
  "SOLUTION_NOTE",
  "PRESCRIPTION_NOTE",
  "CORRECTION",
]);

export const AddendumResSchema = z.object({
  id: z.string().uuid(),
  ticketId: z.string().uuid(),
  // BE field: `authorId` (không phải `createdBy`).
  authorId: z.string().uuid(),
  type: AddendumTypeSchema,
  content: z.string(),
  createdAt: z.string().datetime(),
});

// BE B4 body: {type, content}.
export const AddAddendumBodySchema = z.object({
  type: AddendumTypeSchema,
  content: z.string().min(1, "Nội dung không được để trống."),
});

export type AddendumTypeType = z.infer<typeof AddendumTypeSchema>;
export type AddendumResType = z.infer<typeof AddendumResSchema>;
export type AddAddendumBodyType = z.infer<typeof AddAddendumBodySchema>;
