import { Card, CardContent } from "@/components/ui/card";
import type { TicketKpi } from "../_mocks/ticketAnalytics.mock";

interface TicketKpiStripProps {
  kpi: TicketKpi;
}

interface KpiItem {
  label: string;
  value: string;
  hint?: string;
}

function TicketKpiStrip({ kpi }: TicketKpiStripProps) {
  const items: KpiItem[] = [
    {
      label: "Tổng số vé",
      value: kpi.totalTickets.toLocaleString("vi-VN"),
    },
    {
      label: "Đang chờ / xử lý",
      value: (kpi.openTickets + kpi.inProgressTickets).toLocaleString("vi-VN"),
      hint: `${kpi.openTickets} mở · ${kpi.inProgressTickets} đang xử lý`,
    },
    {
      label: "Đã xử lý",
      value: kpi.resolvedTickets.toLocaleString("vi-VN"),
      hint: `${kpi.resolutionRate.toFixed(1)}% tỷ lệ xử lý`,
    },
    {
      label: "AI tự xử lý",
      value: kpi.aiResolvedTickets.toLocaleString("vi-VN"),
      hint:
        kpi.resolvedTickets > 0
          ? `${((kpi.aiResolvedTickets / kpi.resolvedTickets) * 100).toFixed(1)}% trong tổng đã xử lý`
          : "0% trong tổng đã xử lý",
    },
    {
      label: "TG xử lý TB",
      value:
        kpi.avgResolutionHours != null
          ? `${kpi.avgResolutionHours.toFixed(1)}h`
          : "—",
      hint: "thời gian xử lý trung bình",
    },
    {
      label: "Hài lòng TB",
      value:
        kpi.avgSatisfaction != null
          ? `${kpi.avgSatisfaction.toFixed(1)} / 5`
          : "—",
      hint: `${kpi.satisfactionResponses} phản hồi`,
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
      {items.map((item) => {
        return (
          <Card key={item.label}>
            <CardContent className="space-y-1 p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-semibold tabular-nums">
                {item.value}
              </p>
              {item.hint && (
                <p className="text-xs text-muted-foreground">{item.hint}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default TicketKpiStrip;
