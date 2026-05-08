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
    type: z.string().optional(),
    title: z.string().optional(),
    content: z.string().optional(),
    message: z.string().optional(),
    severity: z.string().optional(),
    href: z.string().optional(),
    redirectUrl: z.string().optional(),
    invoiceId: z.string().optional(),
    invoiceNumber: z.string().optional(),
    referenceType: z.string().optional(),
    referenceId: z.string().optional(),
    createdAt: z.string().optional(),
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
    status: z.string().optional(),
    referenceType: z.string().optional(),
    referenceId: z.string().optional(),
    totalAmount: z.number().optional(),
  })
  .passthrough();
export type InvoicePaidPayloadType = z.infer<typeof InvoicePaidPayloadSchema>;

export const IotKitOrderPaidPayloadSchema = z
  .object({
    orderId: z.string(),
    orderNumber: z.string().optional(),
    totalAmount: z.union([z.number(), z.string()]).optional(),
  })
  .passthrough();
export type IotKitOrderPaidPayloadType = z.infer<
  typeof IotKitOrderPaidPayloadSchema
>;

export const IotKitOrderCancelledPayloadSchema = z
  .object({
    orderId: z.string(),
    cancelReason: z.string().nullable().optional(),
  })
  .passthrough();
export type IotKitOrderCancelledPayloadType = z.infer<
  typeof IotKitOrderCancelledPayloadSchema
>;

/** BE: auto-assign boards after kit invoice paid */
export const IotKitDevicesAutoAssignedPayloadSchema = z
  .object({
    orderId: z.string().optional(),
    assigned: z.number().optional(),
    total: z.number().optional(),
  })
  .passthrough();

/** BE: auto-assign boards after subscription activated */
export const SubscriptionDevicesAutoAssignedPayloadSchema = z
  .object({
    subscriptionId: z.string().optional(),
    assigned: z.number().optional(),
    total: z.number().optional(),
  })
  .passthrough();

// ── Module 3 — Ticket Quality & DQS realtime payloads ─────────────────────
// Shape pending decision 9.8 (BE chia sẻ TS type/OpenAPI). Hiện đặt field
// tối thiểu + .passthrough() để nhận field phụ.

export const TicketAssignedPayloadSchema = z
  .object({
    ticketId: z.string(),
    doctorId: z.string(),
    farmId: z.string().optional(),
    zoneId: z.string().optional(),
    doctor: z
      .object({
        id: z.string(),
        fullName: z.string().optional(),
      })
      .partial()
      .passthrough()
      .optional(),
  })
  .passthrough();
export type TicketAssignedPayloadType = z.infer<
  typeof TicketAssignedPayloadSchema
>;

export const TicketResolvedPayloadSchema = z
  .object({
    ticketId: z.string(),
    farmId: z.string().optional(),
    zoneId: z.string().optional(),
    resolvedAt: z.string().optional(),
    isAIResolved: z.boolean().optional(),
  })
  .passthrough();
export type TicketResolvedPayloadType = z.infer<
  typeof TicketResolvedPayloadSchema
>;

export const TicketClosedPayloadSchema = z
  .object({
    ticketId: z.string(),
    farmId: z.string().optional(),
    zoneId: z.string().optional(),
    closedAt: z.string().optional(),
    closedBy: z.string().optional(),
    closeReason: z.string().optional(),
  })
  .passthrough();
export type TicketClosedPayloadType = z.infer<typeof TicketClosedPayloadSchema>;

export const TicketFallbackRequiredPayloadSchema = z
  .object({
    ticketId: z.string(),
    farmId: z.string().optional(),
    zoneId: z.string().optional(),
    doctorId: z.string().optional(),
    silenceMinutes: z.number().optional(),
  })
  .passthrough();
export type TicketFallbackRequiredPayloadType = z.infer<
  typeof TicketFallbackRequiredPayloadSchema
>;

export const WalletCreditedPayloadSchema = z
  .object({
    doctorId: z.string(),
    amount: z.number(),
    ticketId: z.string().optional(),
  })
  .passthrough();
export type WalletCreditedPayloadType = z.infer<
  typeof WalletCreditedPayloadSchema
>;

export const DqsTierChangedPayloadSchema = z
  .object({
    doctorId: z.string(),
    oldTier: z.string().optional(),
    newTier: z.string(),
    snapshotDate: z.string().optional(),
  })
  .passthrough();
export type DqsTierChangedPayloadType = z.infer<
  typeof DqsTierChangedPayloadSchema
>;

// BE existing event `prescription.incident.created` — emit khi Doctor tạo/reissue prescription.
// Listener (TicketDetailPanelV2) dùng để invalidate `tickets.full(id)` lại.
export const PrescriptionCreatedPayloadSchema = z
  .object({
    ticketId: z.string(),
    prescriptionId: z.string().optional(),
    farmId: z.string().optional(),
    zoneId: z.string().optional(),
  })
  .passthrough();
export type PrescriptionCreatedPayloadType = z.infer<
  typeof PrescriptionCreatedPayloadSchema
>;
