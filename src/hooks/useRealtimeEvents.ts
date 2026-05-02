import { useEffect, useLayoutEffect, useRef } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useNavigate, type NavigateFunction } from "react-router";
import { toast } from "sonner";
import { getSocketInstance } from "@/lib/socket";
import { useSocketStore } from "@/stores/socketStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useAuthStore } from "@/stores/authStore";
import { RealtimeEvents, type RealtimeEventName } from "@/constants/realtime";
import type { RoleNameType } from "@/constants/role";
import {
  AlertCreatedPayloadSchema,
  IncidentTicketCreatedPayloadSchema,
  IncidentTicketEndedPayloadSchema,
  InvoiceCheckoutPayloadSchema,
  InvoicePaidPayloadSchema,
  IotKitOrderCancelledPayloadSchema,
  IotKitOrderPaidPayloadSchema,
  MilestoneStartReminderPayloadSchema,
  NotificationCreatedPayloadSchema,
  SensorAlertRecoveredPayloadSchema,
  SensorHardwarePayloadSchema,
  SensorTimeoutPayloadSchema,
  SubscriptionActivatedPayloadSchema,
  SubscriptionCheckoutPayloadSchema,
} from "@/schemaValidatation/realtime";
import type { ZodSchema } from "zod";
import {
  buildNotificationFromEvent,
  shouldToast,
} from "@/components/notifications/notificationMeta";
import type {
  NotificationItem,
  NotificationSeverity,
} from "@/stores/notificationStore";

/**
 * Event router trung tâm — mount 1 lần trong DashboardLayout. Trách nhiệm:
 *  - Đăng ký listener cho mọi event BE quan tâm (scope owner/manager/admin).
 *  - Validate payload bằng Zod, skip nếu fail.
 *  - Dispatch: notificationStore.add + toast (nếu meta) + invalidate query.
 *  - Sau reconnect (lần >= 2): invalidate các query nhóm để bắt kịp event miss.
 */
const EVENT_SCHEMAS: Partial<Record<RealtimeEventName, ZodSchema>> = {
  [RealtimeEvents.AlertCreated]: AlertCreatedPayloadSchema,
  [RealtimeEvents.SensorAlertRecovered]: SensorAlertRecoveredPayloadSchema,
  [RealtimeEvents.SensorHardwareIssueDetected]: SensorHardwarePayloadSchema,
  [RealtimeEvents.SensorTimeoutDetected]: SensorTimeoutPayloadSchema,
  [RealtimeEvents.SensorTimeoutRecovered]: SensorTimeoutPayloadSchema,
  [RealtimeEvents.NotificationCreated]: NotificationCreatedPayloadSchema,
  [RealtimeEvents.IncidentTicketCreated]: IncidentTicketCreatedPayloadSchema,
  [RealtimeEvents.IncidentTicketEnded]: IncidentTicketEndedPayloadSchema,
  [RealtimeEvents.MilestoneStartReminder]: MilestoneStartReminderPayloadSchema,
  [RealtimeEvents.SubscriptionCheckoutRequired]:
    SubscriptionCheckoutPayloadSchema,
  [RealtimeEvents.SubscriptionActivated]: SubscriptionActivatedPayloadSchema,
  [RealtimeEvents.InvoiceCheckoutCreated]: InvoiceCheckoutPayloadSchema,
  [RealtimeEvents.InvoicePaid]: InvoicePaidPayloadSchema,
  [RealtimeEvents.IotKitOrderPaid]: IotKitOrderPaidPayloadSchema,
  [RealtimeEvents.IotKitOrderCancelled]: IotKitOrderCancelledPayloadSchema,
};

/** Những event muốn surface lên bell / toast. `TicketMessageCreated` không
 *  trong danh sách này vì được xử lý riêng trong useTicketSubscription. */
const NOTIFY_EVENTS: RealtimeEventName[] = [
  RealtimeEvents.AlertCreated,
  RealtimeEvents.SensorAlertRecovered,
  RealtimeEvents.SensorHardwareIssueDetected,
  RealtimeEvents.SensorTimeoutDetected,
  RealtimeEvents.SensorTimeoutRecovered,
  RealtimeEvents.NotificationCreated,
  RealtimeEvents.IncidentTicketCreated,
  RealtimeEvents.IncidentTicketEnded,
  RealtimeEvents.MilestoneStartReminder,
  RealtimeEvents.SubscriptionCheckoutRequired,
  RealtimeEvents.SubscriptionActivated,
  RealtimeEvents.InvoiceCheckoutCreated,
  RealtimeEvents.InvoicePaid,
  RealtimeEvents.IotKitOrderPaid,
  RealtimeEvents.IotKitOrderCancelled,
];

function toastBySeverity(
  severity: NotificationSeverity,
  title: string,
  opts?: { description?: string; action?: { label: string; onClick: () => void } },
): void {
  const payload = {
    description: opts?.description,
    action: opts?.action,
  };
  switch (severity) {
    case "error":
      toast.error(title, payload);
      return;
    case "warning":
      toast.warning(title, payload);
      return;
    case "success":
      toast.success(title, payload);
      return;
    default:
      toast.info(title, payload);
  }
}

function invalidateByEvent(
  event: RealtimeEventName,
  payload: Record<string, unknown>,
  queryClient: QueryClient,
): void {
  switch (event) {
    case RealtimeEvents.AlertCreated:
    case RealtimeEvents.SensorAlertRecovered:
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      return;
    case RealtimeEvents.IncidentTicketCreated:
    case RealtimeEvents.IncidentTicketEnded:
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      return;
    case RealtimeEvents.TicketMessageCreated: {
      const ticketId =
        typeof payload.ticketId === "string" ? payload.ticketId : undefined;
      if (ticketId) {
        queryClient.invalidateQueries({
          queryKey: ["tickets", ticketId, "messages"],
        });
      }
      return;
    }
    case RealtimeEvents.SubscriptionCheckoutRequired:
    case RealtimeEvents.SubscriptionActivated:
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      return;
    case RealtimeEvents.InvoiceCheckoutCreated:
    case RealtimeEvents.InvoicePaid:
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      return;
    case RealtimeEvents.IotKitOrderPaid:
    case RealtimeEvents.IotKitOrderCancelled:
      queryClient.invalidateQueries({ queryKey: ["iot-kits"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      return;
    case RealtimeEvents.MilestoneStartReminder:
      queryClient.invalidateQueries({ queryKey: ["production-milestones"] });
      return;
    default:
      return;
  }
}

function handleEvent(
  event: RealtimeEventName,
  raw: unknown,
  ctx: {
    role: RoleNameType;
    queryClient: QueryClient;
    navigate: NavigateFunction;
    add: (item: NotificationItem) => void;
  },
): void {
  const schema = EVENT_SCHEMAS[event];
  let payload: Record<string, unknown>;
  if (schema) {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      console.warn(`[realtime] invalid payload for ${event}`, parsed.error);
      return;
    }
    payload = (parsed.data ?? {}) as Record<string, unknown>;
  } else {
    payload = (raw ?? {}) as Record<string, unknown>;
  }

  invalidateByEvent(event, payload, ctx.queryClient);

  if (!NOTIFY_EVENTS.includes(event)) return;

  const item = buildNotificationFromEvent({
    event,
    payload,
    role: ctx.role,
  });
  if (!item) return;

  ctx.add(item);

  if (shouldToast(event)) {
    toastBySeverity(item.severity, item.title, {
      description: item.description,
      action: item.href
        ? {
            label: "Xem",
            onClick: () => ctx.navigate(item.href!),
          }
        : undefined,
    });
  }
}

export function useRealtimeEvents(): void {
  const connected = useSocketStore((s) => s.connected);
  const reconnectCount = useSocketStore((s) => s.reconnectCount);
  const role = useAuthStore((s) => s.user?.role) as RoleNameType | undefined;
  const add = useNotificationStore((s) => s.add);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Ref để handler không cần rebind mỗi khi navigate/queryClient refresh ref.
  const ctxRef = useRef({ role, queryClient, navigate, add });
  useLayoutEffect(() => {
    ctxRef.current = { role, queryClient, navigate, add };
  });

  useEffect(() => {
    const socket = getSocketInstance();
    if (!socket || !connected || !role) return;

    const handlers = new Map<RealtimeEventName, (raw: unknown) => void>();

    const allEvents: RealtimeEventName[] = [
      ...NOTIFY_EVENTS,
      RealtimeEvents.SensorReadingChanged,
      RealtimeEvents.TicketMessageCreated,
    ];

    for (const event of allEvents) {
      const handler = (raw: unknown) => {
        const ctx = ctxRef.current;
        if (!ctx.role) return;
        handleEvent(event, raw, {
          role: ctx.role,
          queryClient: ctx.queryClient,
          navigate: ctx.navigate,
          add: ctx.add,
        });
      };
      handlers.set(event, handler);
      socket.on(event, handler);
    }

    return () => {
      for (const [event, handler] of handlers) {
        socket.off(event, handler);
      }
    };
  }, [connected, role]);

  // Sau reconnect (lần >=2) → invalidate các nhóm query để hồi phục state.
  useEffect(() => {
    if (reconnectCount === 0) return;
    queryClient.invalidateQueries({ queryKey: ["tickets"] });
    queryClient.invalidateQueries({ queryKey: ["alerts"] });
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    queryClient.invalidateQueries({ queryKey: ["iot-kits"] });
  }, [reconnectCount, queryClient]);
}
