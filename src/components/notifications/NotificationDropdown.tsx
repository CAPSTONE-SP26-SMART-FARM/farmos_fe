import { useNavigate } from "react-router";
import { BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  selectUnreadCount,
  useNotificationStore,
  type NotificationItem as NotificationItemType,
} from "@/stores/notificationStore";
import NotificationItem from "./NotificationItem";

export default function NotificationDropdown() {
  const items = useNotificationStore((s) => s.items);
  const unread = useNotificationStore(selectUnreadCount);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const clear = useNotificationStore((s) => s.clear);
  const navigate = useNavigate();

  const handleClick = (item: NotificationItemType) => {
    if (!item.read) markRead(item.id);
    if (item.href) navigate(item.href);
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
        {items.length > 0 && unread > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={markAllRead}
          >
            Đánh dấu đã đọc
          </Button>
        )}
      </div>
      <Separator />

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-muted-foreground">
          <BellOff className="h-8 w-8" />
          <p className="text-sm">Chưa có thông báo</p>
          <p className="text-xs text-center">
            Thông báo chỉ hiển thị trong phiên hiện tại.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {items.map((item, idx) => (
            <div key={item.id}>
              {idx > 0 && <Separator />}
              <NotificationItem item={item} onClick={handleClick} />
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <>
          <Separator />
          <div className="flex items-center justify-end px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={clear}
            >
              Xoá tất cả
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
