import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  ActionQueueItem,
  ActionQueueItemType,
} from "@/types/dashboard";
import {
  AlertOctagon,
  ChevronRight,
  ReceiptText,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router";

const TYPE_META: Record<
  ActionQueueItemType,
  { label: string; icon: LucideIcon; tone: string }
> = {
  "doctor-application": {
    label: "Hồ sơ bác sĩ chờ duyệt",
    icon: Stethoscope,
    tone: "bg-amber-500/10 text-amber-600",
  },
  "overdue-invoice": {
    label: "Hoá đơn quá hạn",
    icon: ReceiptText,
    tone: "bg-orange-500/10 text-orange-600",
  },
  "critical-ticket": {
    label: "Ticket nghiêm trọng",
    icon: AlertOctagon,
    tone: "bg-red-500/10 text-red-600",
  },
};

function ageLabel(ageHours: number): string {
  if (ageHours < 1) return "vừa xong";
  if (ageHours < 24) return `${Math.round(ageHours)}h trước`;
  const days = Math.round(ageHours / 24);
  return `${days} ngày trước`;
}

interface ActionGroupProps {
  type: ActionQueueItemType;
  items: ActionQueueItem[];
}

function ActionGroup({ type, items }: ActionGroupProps) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full",
              meta.tone,
            )}
            aria-hidden="true"
          >
            <Icon className="h-4 w-4" />
          </span>
          <h4 className="text-sm font-medium">{meta.label}</h4>
        </div>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="pl-9 text-xs text-muted-foreground">Không có mục nào.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={item.href}
                className="group flex items-center justify-between gap-2 rounded-md border border-transparent px-2 py-1.5 hover:border-border hover:bg-muted/40 transition-colors"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.subtitle}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-muted-foreground">
                    {ageLabel(item.ageHours)}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface ActionQueueCardProps {
  pendingDoctorApps: ActionQueueItem[];
  overdueInvoices: ActionQueueItem[];
  criticalTickets: ActionQueueItem[];
  className?: string;
}

function ActionQueueCard({
  pendingDoctorApps,
  overdueInvoices,
  criticalTickets,
  className,
}: ActionQueueCardProps) {
  const total =
    pendingDoctorApps.length + overdueInvoices.length + criticalTickets.length;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Cần xử lý</CardTitle>
        <CardDescription>
          {total > 0
            ? `${total} mục đang chờ admin xem xét.`
            : "Không có mục nào cần xử lý."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ActionGroup
          type="doctor-application"
          items={pendingDoctorApps}
        />
        <ActionGroup
          type="overdue-invoice"
          items={overdueInvoices}
        />
        <ActionGroup
          type="critical-ticket"
          items={criticalTickets}
        />
      </CardContent>
    </Card>
  );
}

export default ActionQueueCard;
