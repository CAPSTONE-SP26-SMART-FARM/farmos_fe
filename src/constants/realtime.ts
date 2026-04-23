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
