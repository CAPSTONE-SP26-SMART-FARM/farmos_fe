import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CreditCard,
  Info,
  Radio,
  Ticket,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationKind } from "@/constants/realtime";
import type {
  NotificationItem as NotificationItemType,
  NotificationSeverity,
} from "@/stores/notificationStore";

interface Props {
  item: NotificationItemType;
  onClick: (item: NotificationItemType) => void;
}

const ICON_BY_KIND: Record<string, typeof BellRing> = {
  [NotificationKind.SensorAlert]: AlertTriangle,
  [NotificationKind.SensorRecovery]: CheckCircle2,
  [NotificationKind.SensorHardware]: CircleAlert,
  [NotificationKind.SensorTimeout]: WifiOff,
  [NotificationKind.SensorOnline]: Radio,
  [NotificationKind.TicketCreated]: Ticket,
  [NotificationKind.TicketEnded]: Ticket,
  [NotificationKind.Milestone]: BellRing,
  [NotificationKind.BillingCheckout]: CreditCard,
  [NotificationKind.BillingPaid]: CreditCard,
  [NotificationKind.Generic]: Info,
};

const SEVERITY_COLOR: Record<NotificationSeverity, string> = {
  info: "text-blue-500",
  success: "text-green-500",
  warning: "text-amber-500",
  error: "text-destructive",
};

export default function NotificationItem({ item, onClick }: Props) {
  const Icon = ICON_BY_KIND[item.kind] ?? BellRing;
  const timeLabel = formatDistanceToNow(new Date(item.createdAt), {
    locale: vi,
    addSuffix: true,
  });

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors",
        "hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
        !item.read && "bg-accent/40",
      )}
      aria-label={`${item.read ? "Thông báo đã đọc" : "Thông báo chưa đọc"}: ${item.title}`}
    >
      <span
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted",
          SEVERITY_COLOR[item.severity],
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm leading-tight",
            !item.read ? "font-semibold text-foreground" : "text-foreground/80",
          )}
        >
          {item.title}
        </p>
        {item.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        )}
        <p className="mt-1 text-[11px] text-muted-foreground">{timeLabel}</p>
      </div>
      {item.href && (
        <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      {!item.read && (
        <span
          aria-hidden
          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary"
        />
      )}
    </button>
  );
}
