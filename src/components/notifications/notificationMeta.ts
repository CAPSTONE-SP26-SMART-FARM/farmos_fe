import {
  NotificationKind,
  RealtimeEvents,
  type NotificationKindType,
  type RealtimeEventName,
} from "@/constants/realtime";
import { RoleName, type RoleNameType } from "@/constants/role";
import type {
  NotificationItem,
  NotificationSeverity,
} from "@/stores/notificationStore";

interface BuildArgs {
  event: RealtimeEventName;
  payload: Record<string, unknown>;
  role: RoleNameType;
  receivedAt?: number;
}

interface EventMeta {
  kind: NotificationKindType;
  severity: NotificationSeverity;
  title: string;
  description?: string;
  shouldToast: boolean;
  buildHref?: (payload: Record<string, unknown>, role: RoleNameType) =>
    | string
    | undefined;
  buildDedupId?: (
    event: RealtimeEventName,
    payload: Record<string, unknown>,
  ) => string;
}

/** Chỉ owner/manager có dashboard phù hợp. Admin dùng polling — href fallback về admin routes. */
function dashboardBase(role: RoleNameType): string {
  switch (role) {
    case RoleName.Owner:
      return "/dashboard/owner";
    case RoleName.Manager:
      return "/dashboard/manager";
    case RoleName.Admin:
      return "/dashboard/admin";
    default:
      return "/dashboard";
  }
}

function strField(payload: Record<string, unknown>, key: string): string | undefined {
  const v = payload[key];
  return typeof v === "string" ? v : undefined;
}

const META: Partial<Record<RealtimeEventName, EventMeta>> = {
  [RealtimeEvents.AlertCreated]: {
    kind: NotificationKind.SensorAlert,
    severity: "error",
    title: "Cảnh báo cảm biến",
    shouldToast: true,
    buildHref: (p, role) => {
      const zoneId = strField(p, "zoneId");
      return zoneId
        ? `${dashboardBase(role)}/sensor-dashboard?zoneId=${zoneId}`
        : `${dashboardBase(role)}/sensor-dashboard`;
    },
    buildDedupId: (event, p) => strField(p, "alertId") ?? fallbackId(event, p),
  },
  [RealtimeEvents.SensorAlertRecovered]: {
    kind: NotificationKind.SensorRecovery,
    severity: "success",
    title: "Cảm biến đã phục hồi",
    shouldToast: false,
    buildHref: (p, role) => {
      const zoneId = strField(p, "zoneId");
      return zoneId
        ? `${dashboardBase(role)}/sensor-dashboard?zoneId=${zoneId}`
        : undefined;
    },
    buildDedupId: (event, p) =>
      strField(p, "alertId") ?? fallbackId(event, p),
  },
  [RealtimeEvents.SensorHardwareIssueDetected]: {
    kind: NotificationKind.SensorHardware,
    severity: "error",
    title: "Phát hiện sự cố phần cứng cảm biến",
    shouldToast: true,
    buildHref: (p, role) => {
      const zoneId = strField(p, "zoneId");
      return zoneId
        ? `${dashboardBase(role)}/sensor-dashboard?zoneId=${zoneId}`
        : `${dashboardBase(role)}/sensor-dashboard`;
    },
    buildDedupId: (event, p) =>
      [strField(p, "sensorId"), strField(p, "zoneId")]
        .filter(Boolean)
        .join(":") || fallbackId(event, p),
  },
  [RealtimeEvents.SensorTimeoutDetected]: {
    kind: NotificationKind.SensorTimeout,
    severity: "warning",
    title: "Cảm biến mất tín hiệu",
    shouldToast: true,
    buildHref: (p, role) => {
      const zoneId = strField(p, "zoneId");
      return zoneId
        ? `${dashboardBase(role)}/sensor-dashboard?zoneId=${zoneId}`
        : `${dashboardBase(role)}/sensor-dashboard`;
    },
    buildDedupId: (event, p) =>
      [strField(p, "sensorId"), strField(p, "zoneId")]
        .filter(Boolean)
        .join(":") || fallbackId(event, p),
  },
  [RealtimeEvents.SensorTimeoutRecovered]: {
    kind: NotificationKind.SensorOnline,
    severity: "success",
    title: "Cảm biến đã kết nối lại",
    shouldToast: false,
    buildHref: (p, role) => {
      const zoneId = strField(p, "zoneId");
      return zoneId
        ? `${dashboardBase(role)}/sensor-dashboard?zoneId=${zoneId}`
        : undefined;
    },
    buildDedupId: (event, p) =>
      [strField(p, "sensorId"), strField(p, "zoneId")]
        .filter(Boolean)
        .join(":") || fallbackId(event, p),
  },
  [RealtimeEvents.NotificationCreated]: {
    kind: NotificationKind.Generic,
    severity: "info",
    title: "Thông báo",
    shouldToast: false,
    buildHref: (p) =>
      strField(p, "redirectUrl") ?? strField(p, "href"),
    buildDedupId: (event, p) => strField(p, "id") ?? fallbackId(event, p),
  },
  [RealtimeEvents.IncidentTicketCreated]: {
    kind: NotificationKind.TicketCreated,
    severity: "info",
    title: "Ticket sự cố mới",
    shouldToast: true,
    buildHref: (_p, role) => `${dashboardBase(role)}/tickets`,
    buildDedupId: (event, p) =>
      `${event}:${strField(p, "ticketId") ?? "unknown"}`,
  },
  [RealtimeEvents.IncidentTicketEnded]: {
    kind: NotificationKind.TicketEnded,
    severity: "info",
    title: "Ticket sự cố đã kết thúc",
    shouldToast: false,
    buildHref: (_p, role) => `${dashboardBase(role)}/tickets`,
    buildDedupId: (event, p) =>
      `${event}:${strField(p, "ticketId") ?? "unknown"}`,
  },
  [RealtimeEvents.MilestoneStartReminder]: {
    kind: NotificationKind.Milestone,
    severity: "info",
    title: "Nhắc mốc sản xuất",
    shouldToast: true,
    buildHref: (_p, role) => `${dashboardBase(role)}/crop-seasons`,
    buildDedupId: (event, p) =>
      strField(p, "milestoneId") ?? fallbackId(event, p),
  },
  [RealtimeEvents.SubscriptionCheckoutRequired]: {
    kind: NotificationKind.BillingCheckout,
    severity: "info",
    title: "Cần thanh toán đăng ký",
    shouldToast: true,
    buildHref: (p) => {
      const invoiceId = strField(p, "invoiceId");
      return invoiceId
        ? `/dashboard/owner/payments/${invoiceId}`
        : "/dashboard/owner/payments";
    },
    buildDedupId: (event, p) =>
      strField(p, "subscriptionId") ??
      strField(p, "invoiceId") ??
      fallbackId(event, p),
  },
  [RealtimeEvents.InvoiceCheckoutCreated]: {
    kind: NotificationKind.BillingCheckout,
    severity: "info",
    title: "Hoá đơn mới — thanh toán",
    shouldToast: true,
    buildHref: (p) => {
      const invoiceId = strField(p, "invoiceId");
      return invoiceId
        ? `/dashboard/owner/payments/${invoiceId}`
        : "/dashboard/owner/payments";
    },
    buildDedupId: (event, p) =>
      strField(p, "invoiceId") ?? fallbackId(event, p),
  },
  [RealtimeEvents.SubscriptionActivated]: {
    kind: NotificationKind.BillingPaid,
    severity: "success",
    title: "Đăng ký đã kích hoạt",
    shouldToast: true,
    buildHref: () => "/dashboard/owner/subscriptions",
    buildDedupId: (event, p) =>
      strField(p, "subscriptionId") ?? fallbackId(event, p),
  },
  [RealtimeEvents.InvoicePaid]: {
    kind: NotificationKind.BillingPaid,
    severity: "success",
    title: "Hoá đơn đã thanh toán",
    shouldToast: true,
    buildHref: (p) => {
      const invoiceId = strField(p, "invoiceId");
      return invoiceId
        ? `/dashboard/owner/payments/${invoiceId}`
        : "/dashboard/owner/payments";
    },
    buildDedupId: (event, p) =>
      strField(p, "invoiceId") ?? fallbackId(event, p),
  },
  [RealtimeEvents.IotKitOrderPaid]: {
    kind: NotificationKind.IotKitOrderPaid,
    severity: "success",
    title: "Đơn Bộ Kit IoT đã thanh toán",
    shouldToast: true,
    buildHref: (p) => {
      const orderId = strField(p, "orderId");
      return orderId
        ? `/dashboard/owner/iot-kits/orders/${orderId}`
        : "/dashboard/owner/iot-kits";
    },
    buildDedupId: (_event, p) =>
      `iot_kit_order_paid:${strField(p, "orderId") ?? "unknown"}`,
  },
  [RealtimeEvents.IotKitOrderCancelled]: {
    kind: NotificationKind.IotKitOrderCancelled,
    severity: "warning",
    title: "Đơn Bộ Kit IoT đã huỷ",
    shouldToast: true,
    buildHref: (p) => {
      const orderId = strField(p, "orderId");
      return orderId
        ? `/dashboard/owner/iot-kits/orders/${orderId}`
        : "/dashboard/owner/iot-kits";
    },
    buildDedupId: (_event, p) =>
      `iot_kit_order_cancelled:${strField(p, "orderId") ?? "unknown"}`,
  },
};

function fallbackId(
  event: RealtimeEventName,
  payload: Record<string, unknown>,
): string {
  const bucket = Math.floor(Date.now() / 1000);
  return `${event}:${JSON.stringify(payload)}:${bucket}`;
}

export function getEventMeta(event: RealtimeEventName): EventMeta | undefined {
  return META[event];
}

/**
 * Chuyển 1 event BE thành 1 NotificationItem chuẩn hoá. Trả về `null` nếu
 * event không có meta (không dùng cho bell) — caller tự xử lý invalidate
 * query riêng.
 */
export function buildNotificationFromEvent(
  args: BuildArgs,
): NotificationItem | null {
  const meta = getEventMeta(args.event);
  if (!meta) return null;

  const id =
    meta.buildDedupId?.(args.event, args.payload) ??
    fallbackId(args.event, args.payload);

  const title = strField(args.payload, "title") ?? meta.title;
  const description =
    strField(args.payload, "content") ??
    strField(args.payload, "message") ??
    meta.description;

  const href =
    meta.buildHref?.(args.payload, args.role) ??
    strField(args.payload, "redirectUrl") ??
    strField(args.payload, "href");

  return {
    id,
    kind: meta.kind,
    event: args.event,
    title,
    description: description ?? meta.description,
    href,
    severity: meta.severity,
    createdAt: args.receivedAt ?? Date.now(),
    read: false,
    payload: args.payload,
  };
}

export function shouldToast(
  event: RealtimeEventName,
  payload?: Record<string, unknown>,
): boolean {
  if (
    event === RealtimeEvents.NotificationCreated &&
    strField(payload ?? {}, "type") === "invoice_expired"
  ) {
    return true;
  }
  return META[event]?.shouldToast ?? false;
}
