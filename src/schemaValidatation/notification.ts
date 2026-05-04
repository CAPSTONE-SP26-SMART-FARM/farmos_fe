import { z } from "zod";

// Mirror BE `NotificationType` Prisma enum.
export const NotificationTypeSchema = z.enum([
  "sensor_alert",
  "incident_ticket",
  "system_update",
  "payment_reminder",
  "new_message",
]);
export type NotificationTypeType = z.infer<typeof NotificationTypeSchema>;

// Mirror BE NotificationResSchema.
export const NotificationResSchema = z.object({
  id: z.string().uuid(),
  type: NotificationTypeSchema,
  title: z.string(),
  content: z.string(),
  redirectUrl: z.string().nullable(),
  isRead: z.boolean(),
  createdAt: z.string().datetime(),
});
export type NotificationResType = z.infer<typeof NotificationResSchema>;

// BE accepts only page + limit (strict).
export const ListNotificationsQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
});
export type ListNotificationsQueryType = z.infer<
  typeof ListNotificationsQuerySchema
>;

export const NotificationPagingMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export const ListNotificationsResSchema = z.object({
  data: z.array(NotificationResSchema),
  meta: NotificationPagingMetaSchema,
});
export type ListNotificationsResType = z.infer<
  typeof ListNotificationsResSchema
>;

export const MarkNotificationReadBodySchema = z.object({
  isRead: z.boolean(),
});
export type MarkNotificationReadBodyType = z.infer<
  typeof MarkNotificationReadBodySchema
>;
