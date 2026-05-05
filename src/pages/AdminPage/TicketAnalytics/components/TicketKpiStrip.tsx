import { Card, CardContent } from "@/components/ui/card";
import type { TicketKpi } from "../_mocks/ticketAnalytics.mock";

interface TicketKpiStripProps {
  kpi: TicketKpi;
}

interface KpiItem {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
}

function formatDelta(delta?: number): string {
  if (delta === undefined) return "";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}%`;
}

function deltaClass(delta?: number, invert = false): string {
  if (delta === undefined) return "text-muted-foreground";
  const positive = invert ? delta < 0 : delta > 0;
  return positive ? "text-emerald-600" : "text-rose-600";
}

function TicketKpiStrip({ kpi }: TicketKpiStripProps) {
  const items: KpiItem[] = [
    {
      label: "Tổng số vé",
      value: kpi.totalTickets.toLocaleString("vi-VN"),
      delta: kpi.totalDelta ?? undefined,
      hint: "so với kỳ trước",
    },
    {
      label: "Đang chờ / xử lý",
      value: (kpi.openTickets + kpi.inProgressTickets).toLocaleString("vi-VN"),
      hint: `${kpi.openTickets} mở · ${kpi.inProgressTickets} đang xử lý`,
    },
    {
      label: "Đã xử lý",
      value: kpi.resolvedTickets.toLocaleString("vi-VN"),
      delta: kpi.resolvedDelta ?? undefined,
      hint: `${kpi.resolutionRate.toFixed(1)}% tỷ lệ xử lý`,
    },
    {
      label: "AI tự xử lý",
      value: kpi.aiResolvedTickets.toLocaleString("vi-VN"),
      hint: kpi.resolvedTickets > 0
        ? `${((kpi.aiResolvedTickets / kpi.resolvedTickets) * 100).toFixed(1)}% trong tổng đã xử lý`
        : "0% trong tổng đã xử lý",
    },
    {
      label: "TG xử lý TB",
      value: kpi.avgResolutionHours != null ? `${kpi.avgResolutionHours.toFixed(1)}h` : "—",
      delta: kpi.avgResolutionDelta ?? undefined,
      hint: "thời gian xử lý trung bình",
    },
    {
      label: "Hài lòng TB",
      value: kpi.avgSatisfaction != null ? `${kpi.avgSatisfaction.toFixed(1)} / 5` : "—",
      hint: `${kpi.satisfactionResponses} phản hồi`,
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
      {items.map((item) => {
        const invert = item.label === "TG xử lý TB";
        return (
          <Card key={item.label}>
            <CardContent className="space-y-1 p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-semibold tabular-nums">
                {item.value}
              </p>
              <div className="flex items-baseline gap-2">
                {item.delta !== undefined && (
                  <span
                    className={`text-xs font-medium ${deltaClass(item.delta, invert)}`}
                  >
                    {formatDelta(item.delta)}
                  </span>
                )}
                {item.hint && (
                  <span className="text-xs text-muted-foreground">
                    {item.hint}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default TicketKpiStrip;
