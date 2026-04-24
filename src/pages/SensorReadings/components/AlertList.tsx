import { memo, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  AlertTriangle,
  XCircle,
  Info,
  Loader2,
  Siren,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useListAlerts } from "@/queries/useAlert";
import type {
  AlertResType,
  IncidentSeverityType,
} from "@/schemaValidatation/alert";
import AlertDetailDialog from "./AlertDetailDialog";

type SeverityMeta = {
  label: string;
  icon: typeof AlertTriangle;
  text: string;
  bg: string;
  ring: string;
  dot: string;
  rank: number;
  toast: "info" | "warning" | "error";
};

const SEVERITY_META: Record<IncidentSeverityType, SeverityMeta> = {
  low: {
    label: "Thấp",
    icon: Info,
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    ring: "ring-blue-200 dark:ring-blue-900/60",
    dot: "bg-blue-500",
    rank: 0,
    toast: "info",
  },
  medium: {
    label: "Trung bình",
    icon: AlertTriangle,
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    ring: "ring-amber-200 dark:ring-amber-900/60",
    dot: "bg-amber-500",
    rank: 1,
    toast: "warning",
  },
  high: {
    label: "Cao",
    icon: XCircle,
    text: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    ring: "ring-orange-200 dark:ring-orange-900/60",
    dot: "bg-orange-500",
    rank: 2,
    toast: "warning",
  },
  critical: {
    label: "Nghiêm trọng",
    icon: Siren,
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40",
    ring: "ring-red-200 dark:ring-red-900/60",
    dot: "bg-red-500",
    rank: 3,
    toast: "error",
  },
};

const SEVERITY_ORDER: IncidentSeverityType[] = [
  "critical",
  "high",
  "medium",
  "low",
];

function parseNumeric(value: string | null): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function DeltaChip({ alert }: { alert: AlertResType }) {
  const actual = parseNumeric(alert.actualValue);
  const threshold = parseNumeric(alert.thresholdValue);
  if (actual == null || threshold == null) return null;

  const isOver = actual > threshold;
  const Arrow = isOver ? ArrowUp : ArrowDown;
  const tone = isOver
    ? "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40"
    : "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
        tone,
      )}
      title={`Giá trị đo ${actual} ${isOver ? "vượt trên" : "dưới"} ngưỡng ${threshold}`}
    >
      <Arrow className="h-3 w-3" />
      <span>{actual}</span>
      <span className="text-muted-foreground/70">/ {threshold}</span>
    </span>
  );
}

function AlertItem({
  alert,
  onClick,
}: {
  alert: AlertResType;
  onClick: (alert: AlertResType) => void;
}) {
  const meta = SEVERITY_META[alert.severity];
  const Icon = meta.icon;
  const isActive = !alert.isResolved;

  return (
    <button
      type="button"
      onClick={() => onClick(alert)}
      className={cn(
        "group relative flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all",
        "hover:border-foreground/20 hover:bg-accent/60 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        isActive
          ? "border-border"
          : "border-dashed border-border/60 bg-muted/30 opacity-75",
      )}
    >
      {isActive && alert.severity === "critical" && (
        <span
          aria-hidden
          className={cn(
            "absolute left-0 top-3 h-[calc(100%-1.5rem)] w-0.5 rounded-r-full",
            meta.dot,
          )}
        />
      )}
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1",
          meta.bg,
          meta.ring,
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4",
            meta.text,
            isActive && alert.severity === "critical" && "animate-pulse",
          )}
        />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug line-clamp-2">
            {alert.title}
          </p>
          <Badge
            variant="outline"
            className={cn(
              "h-5 shrink-0 border-0 px-1.5 text-[10px]",
              meta.bg,
              meta.text,
            )}
          >
            {meta.label}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <DeltaChip alert={alert} />
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {alert.zoneName}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="text-[11px] text-muted-foreground">
            {formatDistanceToNow(new Date(alert.createdAt), {
              addSuffix: true,
              locale: vi,
            })}
          </span>
          {!isActive ? (
            <Badge
              variant="outline"
              className="h-5 border-0 bg-emerald-50 px-1.5 text-[10px] text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
            >
              <CheckCircle2 className="h-2.5 w-2.5" />
              Đã xử lý
            </Badge>
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </div>
      </div>
    </button>
  );
}

function SeverityPill({
  severity,
  count,
}: {
  severity: IncidentSeverityType;
  count: number;
}) {
  const meta = SEVERITY_META[severity];
  if (count === 0) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
        meta.bg,
        meta.text,
      )}
      title={`${count} ${meta.label.toLowerCase()}`}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {count}
    </span>
  );
}

type FilterMode = "active" | "all";

export default memo(function AlertList() {
  const [filter, setFilter] = useState<FilterMode>("active");
  const [selected, setSelected] = useState<AlertResType | null>(null);

  const { data, isLoading, isFetching } = useListAlerts({ page: 1, limit: 8 });
  const alerts = data?.data ?? [];

  // Toast on new unresolved alerts (compare IDs between refetches). Skip the
  // very first load so we do not spam the user with backlog notifications on
  // page open — we only want to announce alerts that arrive live.
  const seenIdsRef = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (isLoading) return;
    const active = alerts.filter((a) => !a.isResolved);

    if (seenIdsRef.current === null) {
      seenIdsRef.current = new Set(active.map((a) => a.id));
      return;
    }

    const seen = seenIdsRef.current;
    const fresh = active.filter((a) => !seen.has(a.id));
    if (fresh.length > 0) {
      // Sort by severity so the worst one becomes the "headline" toast.
      fresh.sort(
        (a, b) => SEVERITY_META[b.severity].rank - SEVERITY_META[a.severity].rank,
      );
      const head = fresh[0];
      const meta = SEVERITY_META[head.severity];
      const extra = fresh.length - 1;
      toast[meta.toast](
        extra > 0 ? `${head.title} (+${extra} cảnh báo khác)` : head.title,
        {
          description: `${head.zoneName} • ${head.message}`,
          duration: head.severity === "critical" ? 10_000 : 6_000,
          action: {
            label: "Xem",
            onClick: () => setSelected(head),
          },
        },
      );
    }

    seenIdsRef.current = new Set(active.map((a) => a.id));
  }, [alerts, isLoading]);

  const { activeAlerts, severityCounts } = useMemo(() => {
    const active: AlertResType[] = [];
    const counts: Record<IncidentSeverityType, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };
    for (const a of alerts) {
      if (!a.isResolved) {
        active.push(a);
        counts[a.severity] += 1;
      }
    }
    active.sort((a, b) => {
      const ra = SEVERITY_META[a.severity].rank;
      const rb = SEVERITY_META[b.severity].rank;
      if (rb !== ra) return rb - ra;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return { activeAlerts: active, severityCounts: counts };
  }, [alerts]);

  const visibleAlerts = filter === "active" ? activeAlerts : alerts;
  const activeCount = activeAlerts.length;
  const hasCritical = severityCounts.critical > 0;

  return (
    <>
      <Card
        className={cn(
          "overflow-hidden transition-shadow",
          hasCritical && "ring-1 ring-red-200 dark:ring-red-900/50",
        )}
      >
        <CardHeader className="gap-3 border-b bg-muted/30 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bell
                  className={cn(
                    "h-4 w-4",
                    activeCount > 0
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                />
                {hasCritical && (
                  <span
                    aria-hidden
                    className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-red-500"
                  />
                )}
              </div>
              <h3 className="text-sm font-semibold">Cảnh báo</h3>
              {isFetching && !isLoading && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </div>
            <Badge
              variant={activeCount > 0 ? "destructive" : "secondary"}
              className="h-5 text-[10px]"
            >
              {activeCount} đang mở
            </Badge>
          </div>

          {activeCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {SEVERITY_ORDER.map((s) => (
                <SeverityPill key={s} severity={s} count={severityCounts[s]} />
              ))}
            </div>
          )}

          {alerts.length > 0 && (
            <Tabs
              value={filter}
              onValueChange={(v) => setFilter(v as FilterMode)}
              className="w-full"
            >
              <TabsList className="grid h-7 w-full grid-cols-2 p-0.5">
                <TabsTrigger value="active" className="h-6 text-[11px]">
                  Đang mở ({activeCount})
                </TabsTrigger>
                <TabsTrigger value="all" className="h-6 text-[11px]">
                  Tất cả ({alerts.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : visibleAlerts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              {filter === "active" && alerts.length > 0 ? (
                <>
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  <p className="text-xs">Không có cảnh báo đang mở</p>
                </>
              ) : (
                <>
                  <Bell className="h-8 w-8" />
                  <p className="text-xs">Không có cảnh báo</p>
                </>
              )}
            </div>
          ) : (
            <div className="max-h-130 space-y-2 overflow-y-auto p-3">
              {visibleAlerts.map((alert) => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onClick={setSelected}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDetailDialog
        alert={selected}
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  );
});
