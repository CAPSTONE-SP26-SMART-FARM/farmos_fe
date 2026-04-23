import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardStats } from "../utils/sensorDashboard";

const STATS_CONFIG = [
  {
    key: "total" as const,
    label: "Tổng cảm biến",
    icon: Activity,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/40",
    ringColor: "ring-blue-200 dark:ring-blue-800",
  },
  {
    key: "normal" as const,
    label: "Bình thường",
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    ringColor: "ring-emerald-200 dark:ring-emerald-800",
  },
  {
    key: "warning" as const,
    label: "Cảnh báo",
    icon: AlertTriangle,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    ringColor: "ring-amber-200 dark:ring-amber-800",
  },
  {
    key: "critical" as const,
    label: "Nguy hiểm",
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/40",
    ringColor: "ring-red-200 dark:ring-red-800",
  },
];

type SummaryStatsProps = {
  stats: DashboardStats;
};

export default memo(function SummaryStats({ stats }: SummaryStatsProps) {
  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
      {STATS_CONFIG.map(
        ({ key, label, icon: Icon, color, bgColor, ringColor }) => {
          const value = stats[key];
          const isHighlighted =
            key !== "total" && key !== "normal" && value > 0;

          return (
            <Card
              key={key}
              className={cn(
                "relative overflow-hidden transition-all duration-300",
                isHighlighted && "ring-1",
                isHighlighted && ringColor,
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
                  {label}
                </CardTitle>
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    bgColor,
                  )}
                >
                  <Icon className={cn("h-4 w-4", color)} />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className={cn("text-3xl font-bold tabular-nums", color)}>
                  {value}
                </div>
                {stats.total > 0 && key !== "total" && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {stats.total > 0
                      ? `${((value / stats.total) * 100).toFixed(0)}% tổng`
                      : ""}
                  </p>
                )}
              </CardContent>

              {/* Accent bar at bottom for non-normal + non-zero */}
              {isHighlighted && (
                <div
                  className={cn(
                    "absolute bottom-0 left-0 right-0 h-0.5",
                    key === "warning" && "bg-amber-500",
                    key === "critical" && "bg-red-500",
                    key === "stale" && "bg-gray-400",
                  )}
                />
              )}
            </Card>
          );
        },
      )}
    </div>
  );
});
