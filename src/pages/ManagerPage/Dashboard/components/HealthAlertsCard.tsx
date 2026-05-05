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
  HealthSeverity,
  ManagerHealthItem,
  ManagerHealthSummary,
} from "@/types/dashboard";
import {
  AlertOctagon,
  AlertTriangle,
  ChevronRight,
  Cpu,
  Info,
  MapPin,
  Radio,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router";

const SEVERITY_TONE: Record<HealthSeverity, string> = {
  critical: "bg-red-500/10 text-red-600",
  warning: "bg-amber-500/10 text-amber-600",
  info: "bg-blue-500/10 text-blue-600",
};

const SEVERITY_ICON: Record<HealthSeverity, LucideIcon> = {
  critical: AlertOctagon,
  warning: AlertTriangle,
  info: Info,
};

const TYPE_ICON: Record<ManagerHealthItem["type"], LucideIcon> = {
  "sensor-anomaly": Radio,
  ticket: Ticket,
  "device-offline": Cpu,
};

function ageLabel(ageHours: number): string {
  if (ageHours < 1) return "vừa xong";
  if (ageHours < 24) return `${Math.round(ageHours)}h trước`;
  return `${Math.round(ageHours / 24)} ngày trước`;
}

interface HealthAlertsCardProps {
  data: ManagerHealthSummary;
  className?: string;
}

function HealthAlertsCard({ data, className }: HealthAlertsCardProps) {
  const total = data.criticalAlerts + data.openTickets + data.devicesOffline;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Sức khoẻ & cảnh báo</CardTitle>
            <CardDescription>
              {total > 0
                ? `${total} mục cần can thiệp trong khu vực bạn quản lý.`
                : "Tất cả khu vực đang ổn định."}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className="bg-red-500/10 text-red-600 border-transparent">
              {data.criticalAlerts} cảnh báo
            </Badge>
            <Badge className="bg-amber-500/10 text-amber-600 border-transparent">
              {data.openTickets} ticket
            </Badge>
            <Badge className="bg-slate-500/10 text-slate-600 border-transparent">
              {data.devicesOffline} offline
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Không có mục nào.</p>
        ) : (
          <ul className="space-y-2">
            {data.items.map((item) => {
              const SeverityIcon = SEVERITY_ICON[item.severity];
              const TypeIcon = TYPE_ICON[item.type];
              return (
                <li key={item.id}>
                  <Link
                    to={item.href}
                    className="group flex items-start gap-3 rounded-md border border-transparent px-2 py-2 hover:border-border hover:bg-muted/40 transition-colors"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        SEVERITY_TONE[item.severity],
                      )}
                      aria-hidden="true"
                    >
                      <SeverityIcon className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <p className="text-sm font-medium truncate">
                          {item.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.zoneName}
                        </span>
                        <span aria-hidden>·</span>
                        <span className="truncate">{item.subtitle}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-muted-foreground">
                        {ageLabel(item.ageHours)}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default HealthAlertsCard;
