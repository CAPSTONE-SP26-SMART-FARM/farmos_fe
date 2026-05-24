import { useMemo } from "react";
import { useNavigate } from "react-router";
import { BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  selectUnreadCount,
  useNotificationStore,
  type NotificationItem as NotificationItemType,
} from "@/stores/notificationStore";
import { NotificationKind, RealtimeEvents } from "@/constants/realtime";
import {
  useListNotifications,
  useMarkAllRead,
  useMarkNotificationRead,
  useUnreadCount,
} from "@/queries/useNotification";
import type { NotificationResType, NotificationTypeType } from "@/schemaValidatation/notification";
import type { NotificationKindType, RealtimeEventName } from "@/constants/realtime";
import type { NotificationSeverity } from "@/stores/notificationStore";
import NotificationItem from "./NotificationItem";

const TYPE_TO_KIND: Record<NotificationTypeType, NotificationKindType> = {
  sensor_alert: NotificationKind.SensorAlert,
  incident_ticket: NotificationKind.TicketCreated,
  system_update: NotificationKind.Generic,
  payment_reminder: NotificationKind.BillingCheckout,
  new_message: NotificationKind.Generic,
};

const TYPE_TO_SEVERITY: Record<NotificationTypeType, NotificationSeverity> = {
  sensor_alert: "warning",
  incident_ticket: "error",
  system_update: "info",
  payment_reminder: "warning",
  new_message: "info",
};

const TYPE_TO_EVENT: Record<NotificationTypeType, RealtimeEventName> = {
  sensor_alert: RealtimeEvents.AlertCreated,
  incident_ticket: RealtimeEvents.IncidentTicketCreated,
  system_update: RealtimeEvents.NotificationCreated,
  payment_reminder: RealtimeEvents.NotificationCreated,
  new_message: RealtimeEvents.NotificationCreated,
};

function apiNotifToStoreItem(n: NotificationResType): NotificationItemType {
  return {
    id: n.id,
    kind: TYPE_TO_KIND[n.type],
    event: TYPE_TO_EVENT[n.type],
    title: n.title,
    description: n.content || undefined,
    href: n.redirectUrl ?? undefined,
    severity: TYPE_TO_SEVERITY[n.type],
    createdAt: new Date(n.createdAt).getTime(),
    read: n.isRead,
    payload: null,
  };
}

export default function NotificationDropdown() {
  const storeItems = useNotificationStore((s) => s.items);
  const storeClear = useNotificationStore((s) => s.clear);
  const navigate = useNavigate();

  const { data: apiData } = useListNotifications({ page: 1, limit: 20 });
  const { data: serverUnread = 0 } = useUnreadCount();
  const { mutate: markReadApi } = useMarkNotificationRead();
  const { mutate: markAllReadApi } = useMarkAllRead();

  const storeIds = useMemo(
    () => new Set(storeItems.map((i) => i.id)),
    [storeItems],
  );

  const apiMapped = useMemo(
    () =>
      (apiData?.data ?? [])
        .filter((n) => !storeIds.has(n.id))
        .map(apiNotifToStoreItem),
    [apiData, storeIds],
  );

  const merged = useMemo(
    () =>
      [...storeItems, ...apiMapped].sort((a, b) => b.createdAt - a.createdAt),
    [storeItems, apiMapped],
  );

  const storeUnread = useNotificationStore(selectUnreadCount);
  const unread = Math.max(serverUnread, storeUnread);

  const handleClick = (item: NotificationItemType) => {
    if (!item.read) {
      markReadApi({ id: item.id, isRead: true });
    }
    if (item.href) navigate(item.href);
  };

  const handleMarkAllRead = () => {
    markAllReadApi();
  };

  return (
    <div className="flex max-h-[70vh] flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Thông báo</p>
          <p className="text-xs text-muted-foreground">
            {unread > 0 ? `${unread} chưa đọc` : "Tất cả đã đọc"}
          </p>
        </div>
        {merged.length > 0 && unread > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleMarkAllRead}
          >
            Đánh dấu đã đọc
          </Button>
        )}
      </div>
      <Separator />

      {merged.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-muted-foreground">
          <BellOff className="h-8 w-8" />
          <p className="text-sm">Chưa có thông báo</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {merged.map((item, idx) => (
            <div key={item.id}>
              {idx > 0 && <Separator />}
              <NotificationItem item={item} onClick={handleClick} />
            </div>
          ))}
        </div>
      )}

      {merged.length > 0 && (
        <>
          <Separator />
          <div className="flex items-center justify-end px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={storeClear}
            >
              Xoá tất cả
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
