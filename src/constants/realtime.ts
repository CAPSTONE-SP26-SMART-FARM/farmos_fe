/**
 * Mirror 1:1 của `farm_os_be/src/realtime/realtime.events.ts`.
 * Khi BE thêm / đổi event, cập nhật file này và các Zod schema tương ứng.
 */
export const RealtimeEvents = {
  SensorReadingChanged: "sensor.reading.changed",
  AlertCreated: "alert.created",
  SensorAlertRecovered: "sensor.alert.recovered",
  NotificationCreated: "notification.created",
  SensorHardwareIssueDetected: "sensor.hardware.detected",
  SensorTimeoutDetected: "sensor.timeout.detected",
  SensorTimeoutRecovered: "sensor.timeout.recovered",
  IncidentTicketCreated: "ticket.incident.created",
  IncidentTicketEnded: "ticket.incident.ended",
  TicketMessageCreated: "ticket.message.created",
  MilestoneStartReminder: "milestone:start_reminder",
  SubscriptionCheckoutRequired: "subscription.checkout.required",
  SubscriptionActivated: "subscription.activated",
  InvoiceCheckoutCreated: "invoice.checkout.created",
  InvoicePaid: "invoice.paid",
  IotKitOrderPaid: "iot_kit_order.paid",
  IotKitOrderCancelled: "iot_kit_order.cancelled",
  // ── Module 3 — Ticket Quality & DQS ──
  // QUAN TRỌNG: BE realtime.events.ts hiện CHƯA emit 5 event ticket-lifecycle
  // bên dưới (chỉ định nghĩa trên FE để chuẩn bị). Khi BE Module 3 ship
  // (B22/B23 + ticket-lifecycle service emit), các event này sẽ tự kích
  // hoạt FE listener — không cần sửa code FE.
  // FE listener đã defensive (`.safeParse()` skip nếu payload không match).
  TicketAssigned: "ticket.assigned",
  TicketResolved: "ticket.resolved",
  TicketClosed: "ticket.closed",
  TicketFallbackRequired: "ticket.fallback-required",
  DqsTierChanged: "dqs.tier_changed",
  // BE thực: `doctor.wallet.credited` (không phải `wallet.credited`).
  // BE đã có sẵn (line 13 realtime.events.ts).
  WalletCredited: "doctor.wallet.credited",
  // BE đã có sẵn — emit khi prescription được tạo/reissue.
  PrescriptionCreated: "prescription.incident.created",
} as const;
export type RealtimeEventName =
  (typeof RealtimeEvents)[keyof typeof RealtimeEvents];

export const NotificationKind = {
  SensorAlert: "sensor_alert",
  SensorRecovery: "sensor_recovery",
  SensorHardware: "sensor_hardware",
  SensorTimeout: "sensor_timeout",
  SensorOnline: "sensor_online",
  TicketCreated: "ticket_created",
  TicketEnded: "ticket_ended",
  Milestone: "milestone",
  BillingCheckout: "billing_checkout",
  BillingPaid: "billing_paid",
  IotKitOrderPaid: "iot_kit_order_paid",
  IotKitOrderCancelled: "iot_kit_order_cancelled",
  // Module 3
  TicketAssigned: "ticket_assigned",
  TicketResolved: "ticket_resolved",
  TicketClosed: "ticket_closed",
  TicketFallbackRequired: "ticket_fallback_required",
  WalletCredited: "wallet_credited",
  DqsTierChanged: "dqs_tier_changed",
  Generic: "notification",
} as const;
export type NotificationKindType =
  (typeof NotificationKind)[keyof typeof NotificationKind];

export const NOTIFICATION_MAX_ITEMS = 50;
export const NOTIFICATION_THROTTLE_MS = 5_000;
export const REALTIME_INVALIDATE_DEBOUNCE_MS = 500;

export const RealtimeClientEvents = {
  ZoneSubscribe: "zone.subscribe",
  TicketSubscribe: "ticket.subscribe",
} as const;

export type RealtimeAck = { ok: boolean } & Record<string, unknown>;
