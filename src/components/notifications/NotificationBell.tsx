import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  selectUnreadCount,
  useNotificationStore,
} from "@/stores/notificationStore";
import { useSocketStore } from "@/stores/socketStore";
import { useUnreadCount } from "@/queries/useNotification";
import NotificationDropdown from "./NotificationDropdown";

export default function NotificationBell() {
  const storeUnread = useNotificationStore(selectUnreadCount);
  const { data: serverUnread = 0 } = useUnreadCount();
  const unread = Math.max(serverUnread, storeUnread);
  const connected = useSocketStore((s) => s.connected);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            unread > 0
              ? `Thông báo — ${unread} chưa đọc`
              : "Thông báo"
          }
          className="relative"
        >
          <Bell className="h-5 w-5" />
          <span
            aria-hidden
            className={cn(
              "absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full",
              connected ? "bg-green-500" : "bg-muted-foreground",
            )}
          />
          {unread > 0 && (
            <span
              aria-live="polite"
              className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground"
            >
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0" sideOffset={8}>
        <NotificationDropdown />
      </PopoverContent>
    </Popover>
  );
}
