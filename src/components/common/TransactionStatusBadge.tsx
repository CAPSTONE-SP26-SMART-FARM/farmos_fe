import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle, type LucideIcon } from "lucide-react";

type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED";

const STATUS_MAP: Record<
  TransactionStatus,
  { label: string; icon: LucideIcon; className: string }
> = {
  PENDING: {
    label: "Đang xử lý",
    icon: Clock,
    className:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-200",
  },
  SUCCESS: {
    label: "Thành công",
    icon: CheckCircle2,
    className:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200",
  },
  FAILED: {
    label: "Thất bại",
    icon: XCircle,
    className:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-200",
  },
};

interface TransactionStatusBadgeProps {
  status: TransactionStatus;
  className?: string;
}

function TransactionStatusBadge({
  status,
  className,
}: TransactionStatusBadgeProps) {
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

export default TransactionStatusBadge;
export type { TransactionStatus };
