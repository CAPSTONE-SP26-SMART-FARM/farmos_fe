import { z } from "zod";

export const TicketMessageSenderSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  avatarUrl: z.string().nullable(),
});

export const TicketMessageAttachmentSchema = z.object({
  id: z.string().uuid(),
  url: z.string(),
  uploadedBy: z.string().uuid(),
  createdAt: z.string().datetime(),
});

export const TicketMessageResSchema = z.object({
  id: z.string().uuid(),
  ticketId: z.string().uuid(),
  senderId: z.string().uuid(),
  sender: TicketMessageSenderSchema,
  message: z.string(),
  isInternal: z.boolean(),
  createdAt: z.string().datetime(),
  attachments: z.array(TicketMessageAttachmentSchema),
});

export const CreateTicketMessageBodySchema = z.object({
  message: z.string().min(1, "Nội dung không được để trống."),
  isInternal: z.boolean().optional(),
  attachmentIds: z.array(z.string().uuid()).optional(),
  clientMessageId: z.string().min(1).max(128).optional(),
});

export const ListTicketMessagesQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

export const TicketMessageListResSchema = z.object({
  data: z.array(TicketMessageResSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
});

export type TicketMessageResType = z.infer<typeof TicketMessageResSchema>;
export type CreateTicketMessageBodyType = z.infer<
  typeof CreateTicketMessageBodySchema
>;
export type ListTicketMessagesQueryType = z.infer<
  typeof ListTicketMessagesQuerySchema
>;
export type TicketMessageListResType = z.infer<
  typeof TicketMessageListResSchema
>;
