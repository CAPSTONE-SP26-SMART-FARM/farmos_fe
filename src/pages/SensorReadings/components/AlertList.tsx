import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  AlertTriangle,
  XCircle,
  Info,
  Loader2,
  Siren,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useListAlerts } from "@/queries/useAlert";
import type {
  AlertResType,
  IncidentSeverityType,
} from "@/schemaValidatation/alert";

const SEVERITY_META: Record<
  IncidentSeverityType,
  { label: string; icon: typeof AlertTriangle; color: string; bgColor: string }
> = {
  low: {
    label: "Thấp",
    icon: Info,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/40",
  },
  medium: {
    label: "Trung bình",
    icon: AlertTriangle,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
  },
  high: {
    label: "Cao",
    icon: XCircle,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/40",
  },
  critical: {
    label: "Nghiêm trọng",
    icon: Siren,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/40",
  },
};

function AlertItem({ alert }: { alert: AlertResType }) {
  const meta = SEVERITY_META[alert.severity];
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 py-3 border-b last:border-0",
        alert.isResolved && "opacity-60",
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          meta.bgColor,
        )}
      >
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            meta.color,
            alert.severity === "critical" && !alert.isResolved && "animate-pulse",
          )}
        />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium leading-snug line-clamp-2">
          {alert.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {alert.zoneName} • {alert.message}
        </p>
        <div className="flex items-center flex-wrap gap-2">
          <Badge
            variant="outline"
            className={cn(
              "h-5 text-[10px] border-0 px-1.5",
              meta.bgColor,
              meta.color,
            )}
          >
            {meta.label}
          </Badge>
          {alert.isResolved && (
            <Badge
              variant="outline"
              className="h-5 text-[10px] border-0 px-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
            >
              Đã xử lý
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(alert.createdAt), {
              addSuffix: true,
              locale: vi,
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(function AlertList() {
  const { data, isLoading } = useListAlerts({ page: 1, limit: 8 });

  const alerts = data?.data ?? [];
  const totalItems = data?.meta?.totalItems ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">
              Cảnh báo gần đây
            </CardTitle>
          </div>
          {totalItems > 0 && (
            <Badge
              variant="secondary"
              className="h-5 text-[10px]"
            >
              {totalItems}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 py-8 text-muted-foreground">
            <Bell className="h-6 w-6" />
            <p className="text-xs">Không có cảnh báo</p>
          </div>
        ) : (
          <div className="divide-y-0">
            {alerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
