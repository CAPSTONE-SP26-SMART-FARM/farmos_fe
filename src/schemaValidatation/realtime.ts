import { z } from "zod";

/**
 * Zod schemas cho payload realtime. BE là external boundary — mọi payload
 * phải parse thành công trước khi đưa vào store / trigger UI. Parse fail
 * → console.warn + skip (không crash).
 *
 * Các schema đều dùng `.passthrough()` để chấp nhận field phụ BE có thể
 * thêm mà không break FE (BE emit lightweight payload và FE không enforce
 * strict shape).
 */

export const SensorReadingChangedPayloadSchema = z
  .object({
    assignmentId: z.string(),
    zoneId: z.string(),
    milestoneId: z.string().optional(),
    farmId: z.string().optional(),
  })
  .passthrough();
export type SensorReadingChangedPayloadType = z.infer<
  typeof SensorReadingChangedPayloadSchema
>;

export const AlertCreatedPayloadSchema = z
  .object({
    alertId: z.string().optional(),
    zoneId: z.string(),
    farmId: z.string().optional(),
    severity: z.string().optional(),
    message: z.string().optional(),
    createdAt: z.string().optional(),
  })
  .passthrough();
export type AlertCreatedPayloadType = z.infer<typeof AlertCreatedPayloadSchema>;

export const SensorAlertRecoveredPayloadSchema = z
  .object({
    zoneId: z.string(),
    farmId: z.string().optional(),
    alertId: z.string().optional(),
  })
  .passthrough();
export type SensorAlertRecoveredPayloadType = z.infer<
  typeof SensorAlertRecoveredPayloadSchema
>;

export const SensorHardwarePayloadSchema = z
  .object({
    farmId: z.string(),
    zoneId: z.string().optional(),
    sensorId: z.string().optional(),
    message: z.string().optional(),
  })
  .passthrough();
export type SensorHardwarePayloadType = z.infer<
  typeof SensorHardwarePayloadSchema
>;

export const SensorTimeoutPayloadSchema = z
  .object({
    farmId: z.string(),
    zoneId: z.string().optional(),
    sensorId: z.string().optional(),
  })
  .passthrough();
export type SensorTimeoutPayloadType = z.infer<
  typeof SensorTimeoutPayloadSchema
>;

export const NotificationCreatedPayloadSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().optional(),
    message: z.string().optional(),
    severity: z.string().optional(),
    href: z.string().optional(),
  })
  .passthrough();
export type NotificationCreatedPayloadType = z.infer<
  typeof NotificationCreatedPayloadSchema
>;

export const IncidentTicketCreatedPayloadSchema = z
  .object({
    ticketId: z.string(),
    farmId: z.string().optional(),
    zoneId: z.string().optional(),
    replay: z.boolean().optional(),
  })
  .passthrough();
export type IncidentTicketCreatedPayloadType = z.infer<
  typeof IncidentTicketCreatedPayloadSchema
>;

export const IncidentTicketEndedPayloadSchema = z
  .object({
    ticketId: z.string(),
    farmId: z.string().optional(),
    zoneId: z.string().optional(),
  })
  .passthrough();
export type IncidentTicketEndedPayloadType = z.infer<
  typeof IncidentTicketEndedPayloadSchema
>;

export const TicketMessageCreatedPayloadSchema = z
  .object({
    ticketId: z.string(),
    messageId: z.string(),
    senderId: z.string().optional(),
    isInternal: z.boolean().optional(),
  })
  .passthrough();
export type TicketMessageCreatedPayloadType = z.infer<
  typeof TicketMessageCreatedPayloadSchema
>;

export const MilestoneStartReminderPayloadSchema = z
  .object({
    milestoneId: z.string().optional(),
    cropSeasonId: z.string().optional(),
    zoneId: z.string().optional(),
    farmId: z.string().optional(),
    title: z.string().optional(),
  })
  .passthrough();
export type MilestoneStartReminderPayloadType = z.infer<
  typeof MilestoneStartReminderPayloadSchema
>;

export const SubscriptionCheckoutPayloadSchema = z
  .object({
    subscriptionId: z.string().optional(),
    invoiceId: z.string().optional(),
    checkoutUrl: z.string().optional(),
  })
  .passthrough();
export type SubscriptionCheckoutPayloadType = z.infer<
  typeof SubscriptionCheckoutPayloadSchema
>;

export const SubscriptionActivatedPayloadSchema = z
  .object({
    subscriptionId: z.string().optional(),
    planName: z.string().optional(),
  })
  .passthrough();
export type SubscriptionActivatedPayloadType = z.infer<
  typeof SubscriptionActivatedPayloadSchema
>;

export const InvoiceCheckoutPayloadSchema = z
  .object({
    invoiceId: z.string(),
    checkoutUrl: z.string().optional(),
    totalAmount: z.number().optional(),
  })
  .passthrough();
export type InvoiceCheckoutPayloadType = z.infer<
  typeof InvoiceCheckoutPayloadSchema
>;

export const InvoicePaidPayloadSchema = z
  .object({
    invoiceId: z.string(),
    totalAmount: z.number().optional(),
  })
  .passthrough();
export type InvoicePaidPayloadType = z.infer<typeof InvoicePaidPayloadSchema>;
