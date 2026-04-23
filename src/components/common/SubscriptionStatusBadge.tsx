import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  CircleSlash,
  Clock,
  PauseCircle,
  XCircle,
  type LucideIcon,
} from "lucide-react";

type SubscriptionStatus =
  | "PENDING"
  | "ACTIVE"
  | "SUSPENDED"
  | "CANCELLED"
  | "EXPIRED";

const STATUS_MAP: Record<
  SubscriptionStatus,
  { label: string; icon: LucideIcon; className: string }
> = {
  PENDING: {
    label: "Chờ thanh toán",
    icon: Clock,
    className:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-200",
  },
  ACTIVE: {
    label: "Đang hoạt động",
    icon: CheckCircle2,
    className:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200",
  },
  SUSPENDED: {
    label: "Tạm ngưng",
    icon: PauseCircle,
    className:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200",
  },
  CANCELLED: {
    label: "Đã hủy",
    icon: XCircle,
    className:
      "bg-muted text-muted-foreground border-border",
  },
  EXPIRED: {
    label: "Hết hạn",
    icon: CircleSlash,
    className:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-200",
  },
};

interface SubscriptionStatusBadgeProps {
  status: SubscriptionStatus;
  className?: string;
}

function SubscriptionStatusBadge({
  status,
  className,
}: SubscriptionStatusBadgeProps) {
  const meta = STATUS_MAP[status];
  const Icon = meta.icon;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1", meta.className, className)}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
}

export default SubscriptionStatusBadge;
export type { SubscriptionStatus };
