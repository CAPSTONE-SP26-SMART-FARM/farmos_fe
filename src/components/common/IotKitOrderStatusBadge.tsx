import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IotKitOrderStatus } from "@/schemaValidatation/iotKit";
import {
  CheckCircle2,
  Clock,
  Undo2,
  XOctagon,
  type LucideIcon,
} from "lucide-react";

const STATUS_MAP: Record<
  IotKitOrderStatus,
  { label: string; icon: LucideIcon; className: string }
> = {
  PENDING: {
    label: "Chờ thanh toán",
    icon: Clock,
    className:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-200",
  },
  PAID: {
    label: "Đã thanh toán",
    icon: CheckCircle2,
    className:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200",
  },
  CANCELLED: {
    label: "Đã huỷ",
    icon: XOctagon,
    className: "bg-muted text-muted-foreground border-border",
  },
  REFUNDED: {
    label: "Đã hoàn tiền",
    icon: Undo2,
    className:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200",
  },
};

interface IotKitOrderStatusBadgeProps {
  status: IotKitOrderStatus;
  className?: string;
}

function IotKitOrderStatusBadge({
  status,
  className,
}: IotKitOrderStatusBadgeProps) {
  const meta = STATUS_MAP[status];
  const Icon = meta.icon;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1", meta.className, className)}
      aria-label={`Trạng thái đơn: ${meta.label}`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {meta.label}
    </Badge>
  );
}

export default IotKitOrderStatusBadge;
