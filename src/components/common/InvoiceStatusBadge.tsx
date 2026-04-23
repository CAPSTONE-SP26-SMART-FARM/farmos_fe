import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  CircleSlash,
  FileEdit,
  FileText,
  XOctagon,
  type LucideIcon,
} from "lucide-react";

type InvoiceStatus = "DRAFT" | "OPEN" | "PAID" | "VOID" | "UNCOLLECTIBLE";

const STATUS_MAP: Record<
  InvoiceStatus,
  { label: string; icon: LucideIcon; className: string }
> = {
  DRAFT: {
    label: "Bản nháp",
    icon: FileEdit,
    className: "bg-muted text-muted-foreground border-border",
  },
  OPEN: {
    label: "Chưa thanh toán",
    icon: FileText,
    className:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200",
  },
  PAID: {
    label: "Đã thanh toán",
    icon: CheckCircle2,
    className:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200",
  },
  VOID: {
    label: "Đã hủy",
    icon: XOctagon,
    className: "bg-muted text-muted-foreground border-border",
  },
  UNCOLLECTIBLE: {
    label: "Không thu được",
    icon: CircleSlash,
    className:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-200",
  },
};

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

function InvoiceStatusBadge({
  status,
  className,
}: InvoiceStatusBadgeProps) {
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

export default InvoiceStatusBadge;
export type { InvoiceStatus };
