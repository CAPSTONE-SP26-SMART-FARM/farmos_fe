import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock,
  Info,
  MapPin,
  Radio,
  Siren,
  Tractor,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type {
  AlertResType,
  IncidentSeverityType,
} from "@/schemaValidatation/alert";

const SEVERITY_META: Record<
  IncidentSeverityType,
  {
    label: string;
    icon: typeof AlertTriangle;
    text: string;
    bg: string;
    ring: string;
  }
> = {
  low: {
    label: "Thấp",
    icon: Info,
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    ring: "ring-blue-200 dark:ring-blue-900/60",
  },
  medium: {
    label: "Trung bình",
    icon: AlertTriangle,
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    ring: "ring-amber-200 dark:ring-amber-900/60",
  },
  high: {
    label: "Cao",
    icon: XCircle,
    text: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    ring: "ring-orange-200 dark:ring-orange-900/60",
  },
  critical: {
    label: "Nghiêm trọng",
    icon: Siren,
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40",
    ring: "ring-red-200 dark:ring-red-900/60",
  },
};

function parseNumeric(value: string | null): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 text-sm font-medium wrap-break-word">{value}</div>
      </div>
    </div>
  );
}

function ThresholdVisual({ alert }: { alert: AlertResType }) {
  const actual = parseNumeric(alert.actualValue);
  const threshold = parseNumeric(alert.thresholdValue);
  if (actual == null || threshold == null) return null;

  const isOver = actual > threshold;
  const Arrow = isOver ? ArrowUp : ArrowDown;
  const deviation = threshold !== 0
    ? Math.round(((actual - threshold) / threshold) * 100)
    : null;

  const textClass = isOver
    ? "text-orange-600 dark:text-orange-400"
    : "text-blue-600 dark:text-blue-400";
  const bgClass = isOver
    ? "bg-orange-50 dark:bg-orange-950/40"
    : "bg-blue-50 dark:bg-blue-950/40";
  const ringClass = isOver
    ? "ring-orange-200 dark:ring-orange-900/60"
    : "ring-blue-200 dark:ring-blue-900/60";

  return (
    <div className={cn("rounded-lg p-3 ring-1", bgClass, ringClass)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Giá trị đo
          </p>
          <p className={cn("mt-0.5 text-2xl font-bold tabular-nums", textClass)}>
            {actual}
          </p>
        </div>
        <div
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
            textClass,
            bgClass,
          )}
        >
          <Arrow className="h-3.5 w-3.5" />
          {deviation != null && (
            <span>
              {deviation > 0 ? "+" : ""}
              {deviation}%
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Ngưỡng
          </p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-foreground">
            {threshold}
          </p>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Giá trị {isOver ? "vượt trên" : "dưới"} ngưỡng an toàn
        {deviation != null && ` (${Math.abs(deviation)}%)`}.
      </p>
    </div>
  );
}

interface AlertDetailDialogProps {
  alert: AlertResType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AlertDetailDialog({
  alert,
  open,
  onOpenChange,
}: AlertDetailDialogProps) {
  if (!alert) return null;

  const meta = SEVERITY_META[alert.severity];
  const Icon = meta.icon;
  const createdAt = new Date(alert.createdAt);
  const resolvedAt = alert.resolvedAt ? new Date(alert.resolvedAt) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1",
                meta.bg,
                meta.ring,
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  meta.text,
                  !alert.isResolved &&
                    alert.severity === "critical" &&
                    "animate-pulse",
                )}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn("h-5 border-0 px-1.5 text-[10px]", meta.bg, meta.text)}
                >
                  {meta.label}
                </Badge>
                {alert.isResolved ? (
                  <Badge
                    variant="outline"
                    className="h-5 border-0 bg-emerald-50 px-1.5 text-[10px] text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                  >
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Đã xử lý
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="h-5 border-0 bg-red-50 px-1.5 text-[10px] text-red-600 dark:bg-red-950/40 dark:text-red-400"
                  >
                    Đang mở
                  </Badge>
                )}
              </div>
              <DialogTitle className="mt-1.5 text-base leading-snug">
                {alert.title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs">
                {alert.message}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <ThresholdVisual alert={alert} />

          <Separator />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoRow icon={MapPin} label="Khu vực" value={alert.zoneName} />
            <InfoRow icon={Tractor} label="Trang trại" value={alert.farmName} />
            <InfoRow
              icon={Clock}
              label="Thời gian"
              value={
                <div>
                  <div>
                    {formatDistanceToNow(createdAt, {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </div>
                  <div className="text-[11px] font-normal text-muted-foreground">
                    {format(createdAt, "dd/MM/yyyy HH:mm:ss")}
                  </div>
                </div>
              }
            />
            <InfoRow
              icon={Radio}
              label="Loại cảnh báo"
              value={
                <span className="font-mono text-xs">{alert.alertType}</span>
              }
            />
            {resolvedAt && (
              <InfoRow
                icon={CheckCircle2}
                label="Đã xử lý"
                value={format(resolvedAt, "dd/MM/yyyy HH:mm:ss")}
              />
            )}
            {alert.sensorId && (
              <InfoRow
                icon={Radio}
                label="Sensor ID"
                value={
                  <span className="font-mono text-xs break-all">
                    {alert.sensorId}
                  </span>
                }
              />
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
