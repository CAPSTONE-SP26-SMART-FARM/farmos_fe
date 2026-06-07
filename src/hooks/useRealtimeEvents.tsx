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
  IotDeviceActivatedPayloadSchema,
  IotDeviceStatusChangedPayloadSchema,
  IotKitOrderCancelledPayloadSchema,
  IotKitOrderPaidPayloadSchema,
  IotKitRequestCreatedPayloadSchema,
  IotKitRequestUpdatedPayloadSchema,
  IotKitDevicesAutoAssignedPayloadSchema,
  SubscriptionDevicesAutoAssignedPayloadSchema,
  MilestoneStartReminderPayloadSchema,
  NotificationCreatedPayloadSchema,
  DailyLogSubmittedPayloadSchema,
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
import { useSelectedAlertStore } from "@/stores/selectedAlertStore";
import type {
  AlertResType,
  IncidentSeverityType,
  ListAlertsResType,
} from "@/schemaValidatation/alert";

const ALERT_TOAST_BY_SEVERITY: Record<IncidentSeverityType, "info" | "warning" | "error"> = {
  low: "info",
  medium: "warning",
  high: "warning",
  critical: "error",
};

const ALERT_SEVERITY_LABEL: Record<IncidentSeverityType, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  critical: "Nghiêm trọng",
};

function findAlertInCache(
  queryClient: QueryClient,
  alertId: string,
): AlertResType | undefined {
  const entries = queryClient.getQueriesData<ListAlertsResType>({
    queryKey: ["alerts"],
  });
  for (const [, data] of entries) {
    const found = data?.data.find((a) => a.id === alertId);
    if (found) return found;
  }
  return undefined;
}

function buildAlertToastDescription(alert: AlertResType): React.ReactNode {
  const actual = alert.actualValue != null ? Number(alert.actualValue) : NaN;
  const threshold =
    alert.thresholdValue != null ? Number(alert.thresholdValue) : NaN;
  const hasReading = Number.isFinite(actual) && Number.isFinite(threshold);
  const arrow = hasReading && actual > threshold ? "↑" : "↓";

  return (
    <div className="text-foreground/90 space-y-0.5">
      <div>
        <span className="font-medium">{ALERT_SEVERITY_LABEL[alert.severity]}</span>
        {" • "}
        <span>{alert.zoneName}</span>
      </div>
      {hasReading && (
        <div className="tabular-nums">
          Đo {actual} {arrow} ngưỡng {threshold}
        </div>
      )}
    </div>
  );
}

async function emitRichAlertToast(
  alertId: string,
  queryClient: QueryClient,
  openDialog: (id: string) => void,
): Promise<void> {
  // Cache có thể chưa kịp cập nhật ngay sau invalidate — đợi refetch xong
  // mới lookup. Nếu vẫn không thấy (alert rơi ngoài page 1 / limit) thì
  // skip rich toast, im lặng vì user vẫn thấy entry trong bell.
  await queryClient.refetchQueries({ queryKey: ["alerts"] });
  const alert = findAlertInCache(queryClient, alertId);
  if (!alert) return;

  const variant = ALERT_TOAST_BY_SEVERITY[alert.severity];
  toast[variant](alert.title, {
    description: buildAlertToastDescription(alert),
    duration: alert.severity === "critical" ? 10_000 : 6_000,
    position: "top-right",
    action: {
      label: "Xem chi tiết",
      onClick: () => openDialog(alert.id),
    },
  });
}

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
  [RealtimeEvents.IotKitDevicesAutoAssigned]: IotKitDevicesAutoAssignedPayloadSchema,
  [RealtimeEvents.SubscriptionDevicesAutoAssigned]:
    SubscriptionDevicesAutoAssignedPayloadSchema,
  [RealtimeEvents.IotDeviceActivated]: IotDeviceActivatedPayloadSchema,
  [RealtimeEvents.IotDeviceStatusChanged]: IotDeviceStatusChangedPayloadSchema,
  [RealtimeEvents.IotKitRequestCreated]: IotKitRequestCreatedPayloadSchema,
  [RealtimeEvents.IotKitRequestUpdated]: IotKitRequestUpdatedPayloadSchema,
  [RealtimeEvents.DailyLogSubmitted]: DailyLogSubmittedPayloadSchema,
};

/** Những event muốn surface lên bell / toast. `TicketMessageCreated` không
 *  trong danh sách này vì được xử lý riêng trong useTicketSubscription. */
const NOTIFY_EVENTS: RealtimeEventName[] = [
  RealtimeEvents.AlertCreated,
  RealtimeEvents.SensorAlertRecovered,
  RealtimeEvents.SensorHardwareIssueDetected,
  // SensorTimeoutDetected / SensorTimeoutRecovered KHÔNG vào bell — BE đã emit
  // `notification.created` riêng (chi tiết tên kit + zone, throttle 1/board/24h)
  // cho cả timeout lẫn recovery. 2 event này phát per-sensor, không throttle, payload
  // không có title/content → nếu vào bell sẽ đẻ noti generic "Cảm biến mất tín hiệu"
  // trùng lặp (mỗi sensor 1 cái). Cùng lý do với IotKitRequest bên dưới. Sensor card
  // tô đỏ qua IotDeviceStatusChanged, không phụ thuộc 2 event này.
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
    position: "top-right" as const,
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
      queryClient.invalidateQueries({ queryKey: ["alerts", "list"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
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
      queryClient.invalidateQueries({ queryKey: ["iot-kits"] });
      return;
    case RealtimeEvents.InvoiceCheckoutCreated:
    case RealtimeEvents.InvoicePaid:
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["iot-kits"] });
      return;
    case RealtimeEvents.IotKitOrderPaid:
    case RealtimeEvents.IotKitOrderCancelled:
      queryClient.invalidateQueries({ queryKey: ["iot-kits"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      return;
    case RealtimeEvents.IotKitDevicesAutoAssigned:
    case RealtimeEvents.SubscriptionDevicesAutoAssigned:
      queryClient.invalidateQueries({ queryKey: ["iot-kits"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      return;
    case RealtimeEvents.MilestoneStartReminder:
      queryClient.invalidateQueries({ queryKey: ["production-milestones"] });
      return;
    case RealtimeEvents.IotDeviceActivated:
    case RealtimeEvents.IotDeviceStatusChanged:
      // Refresh device list/detail + milestone IoT assignment (row hiển thị device.status).
      // Owner + manager dùng key namespace riêng — invalidate cả 2, role mismatch no-op.
      // IotDeviceActivated: ingest flip inactive/error → active.
      // IotDeviceStatusChanged: cron flip active → error (sensor timeout) + các flow status khác.
      queryClient.invalidateQueries({ queryKey: ["owner", "iot-devices"] });
      queryClient.invalidateQueries({ queryKey: ["manager", "iot-devices"] });
      queryClient.invalidateQueries({
        queryKey: ["owner", "production-milestones"],
      });
      queryClient.invalidateQueries({
        queryKey: ["manager", "production-milestones"],
      });
      return;
    case RealtimeEvents.NotificationCreated:
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      return;
    case RealtimeEvents.DailyLogSubmitted:
      // Farmer ghi / cập nhật nhật ký — manager + owner cần refresh list nhật ký
      // của zone / farm. Bell + toast đã đi qua `notification.created` riêng,
      // event này CHỈ invalidate query (không add vào notification store).
      queryClient.invalidateQueries({ queryKey: ["daily-logs"] });
      return;
    case RealtimeEvents.IotKitRequestCreated:
    case RealtimeEvents.IotKitRequestUpdated: {
      // Refresh listMy (owner) + listAdmin + detail. KHÔNG vào bell — BE đã
      // emit `notification.created` riêng cho mỗi action quan trọng (claim,
      // resolve, accept-schedule…) → tránh đếm trùng.
      queryClient.invalidateQueries({ queryKey: ["iot-kit-requests"] });
      const id = typeof payload.id === "string" ? payload.id : undefined;
      if (id) {
        queryClient.invalidateQueries({
          queryKey: ["iot-kit-requests", id],
        });
      }
      // complete-install flip device install→inactive trong cùng tx — refresh
      // device list ngay (BE cũng emit IotDeviceStatusChanged riêng, nhưng
      // invalidate ở đây làm UI snappier không phụ thuộc thứ tự event).
      queryClient.invalidateQueries({ queryKey: ["owner", "iot-devices"] });
      queryClient.invalidateQueries({ queryKey: ["manager", "iot-devices"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "iot-devices"] });
      return;
    }
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
    openAlertDialog: (id: string) => void;
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

  // Toast riêng cho AlertCreated: giàu data + action mở dialog detail
  // global thay vì navigate (xem GlobalAlertDetailDialog). Vẫn tiếp tục
  // build notification cho bell qua flow chung phía dưới.
  if (event === RealtimeEvents.AlertCreated) {
    const alertId = typeof payload.alertId === "string" ? payload.alertId : null;
    if (alertId) {
      void emitRichAlertToast(alertId, ctx.queryClient, ctx.openAlertDialog);
    }
  }

  // Toast riêng cho IotDeviceActivated / IotDeviceStatusChanged — không vào bell
  // (info-level, không phải alert). Format dynamic theo label + zoneName từ
  // payload BE; fallback "Thiết bị IoT" nếu thiếu data (BE đảm bảo có nhưng
  // schema để optional cho backward-compat).
  if (
    event === RealtimeEvents.IotDeviceActivated ||
    event === RealtimeEvents.IotDeviceStatusChanged
  ) {
    const label =
      typeof payload.deviceLabel === "string" && payload.deviceLabel.trim()
        ? payload.deviceLabel.trim()
        : typeof payload.deviceName === "string" && payload.deviceName.trim()
          ? payload.deviceName.trim()
          : null;
    const zoneName =
      typeof payload.zoneName === "string" && payload.zoneName.trim()
        ? payload.zoneName.trim()
        : null;

    const subject = label ? `Bộ kit ${label}` : "Bộ kit IoT";
    const location = zoneName ? ` tại khu vực ${zoneName}` : "";
    const fromStatus = payload.fromStatus;
    const toStatus = payload.toStatus;

    const pos = { position: "top-right" as const };
    if (event === RealtimeEvents.IotDeviceActivated) {
      if (fromStatus === "error") {
        toast.success(`${subject}${location} đã hoạt động trở lại`, pos);
      } else if (fromStatus === "inactive") {
        toast.success(`${subject}${location} đã kết nối lần đầu`, pos);
      }
    } else if (event === RealtimeEvents.IotDeviceStatusChanged) {
      // Toast nhẹ cho flow start-install / complete-install / cron error:
      //  - purchase → install: admin vừa bấm "Bắt đầu lắp đặt" — owner thấy
      //                        "đang được lắp đặt".
      //  - install → inactive: admin vừa bấm "Báo lắp xong" — owner thấy
      //                        "đã lắp xong, đợi kết nối".
      //  - active → error: cron timeout — toast destructive (chi tiết cần
      //                    thay kit đã đi qua NotificationCreated → bell).
      // Các transition khác không toast (admin update bằng tay đã có noti DB).
      if (fromStatus === "purchase" && toStatus === "install") {
        toast.info(`${subject}${location} đang được lắp đặt`, pos);
      } else if (fromStatus === "install" && toStatus === "inactive") {
        toast.success(`${subject}${location} đã lắp xong, đang chờ kết nối`, pos);
      } else if (fromStatus === "active" && toStatus === "error") {
        toast.error(`${subject}${location} đã gặp sự cố, vui lòng kiểm tra`, pos);
      }
    }
  }

  // Toast nhẹ cho admin khi có Iot Kit Request mới (FAULT_REPORT hoặc auto-create
  // INSTALL_SCHEDULE). Owner đã được BE emit `notification.created` riêng (vào
  // bell) nên skip toast bên owner để tránh trùng. Admin chưa có notification.
  if (
    event === RealtimeEvents.IotKitRequestCreated &&
    ctx.role === "admin"
  ) {
    const type = typeof payload.type === "string" ? payload.type : null;
    const reqNumber =
      typeof payload.requestNumber === "string" ? payload.requestNumber : null;
    const prefix = reqNumber ? `Yêu cầu ${reqNumber}` : "Có yêu cầu IoT mới";
    const pos = { position: "top-right" as const };
    if (type === "INSTALL_SCHEDULE") {
      toast.info(`${prefix} — chủ trang trại cần lắp đặt kit`, pos);
    } else if (type === "FAULT_REPORT") {
      toast.warning(`${prefix} — báo lỗi thiết bị`, pos);
    } else {
      toast.info(prefix, pos);
    }
  }

  if (!NOTIFY_EVENTS.includes(event)) return;

  const item = buildNotificationFromEvent({
    event,
    payload,
    role: ctx.role,
  });
  if (!item) return;

  ctx.add(item);

  if (shouldToast(event, payload)) {
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
  const openAlertDialog = useSelectedAlertStore((s) => s.open);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Ref để handler không cần rebind mỗi khi navigate/queryClient refresh ref.
  const ctxRef = useRef({ role, queryClient, navigate, add, openAlertDialog });
  useLayoutEffect(() => {
    ctxRef.current = { role, queryClient, navigate, add, openAlertDialog };
  });

  useEffect(() => {
    const socket = getSocketInstance();
    if (!socket || !connected || !role) return;

    const handlers = new Map<RealtimeEventName, (raw: unknown) => void>();

    const allEvents: RealtimeEventName[] = [
      ...NOTIFY_EVENTS,
      RealtimeEvents.SensorReadingChanged,
      RealtimeEvents.TicketMessageCreated,
      RealtimeEvents.IotKitDevicesAutoAssigned,
      RealtimeEvents.SubscriptionDevicesAutoAssigned,
      RealtimeEvents.IotDeviceActivated,
      RealtimeEvents.IotDeviceStatusChanged,
      RealtimeEvents.IotKitRequestCreated,
      RealtimeEvents.IotKitRequestUpdated,
      RealtimeEvents.DailyLogSubmitted,
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
          openAlertDialog: ctx.openAlertDialog,
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
