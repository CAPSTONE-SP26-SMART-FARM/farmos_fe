import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useTicketAnalytics } from "@/queries/useTicketAnalytics";
import type { TicketAnalyticsQuery } from "@/services/ticketAnalyticsService";
import type {
  CategoryShare,
  CriticalTicketRow,
  DoctorPerformanceRow,
  SeverityBreakdown,
  StatusDistribution,
  TicketKpi,
} from "./_mocks/ticketAnalytics.mock";
import TicketKpiStrip from "./components/TicketKpiStrip";
import StatusDistributionCard from "./components/StatusDistributionCard";
import SeverityBreakdownCard from "./components/SeverityBreakdownCard";
import CategoryBreakdownCard from "./components/CategoryBreakdownCard";
import TicketsOverTimeChart from "./components/TicketsOverTimeChart";
import DoctorPerformanceTable from "./components/DoctorPerformanceTable";
import CriticalTicketsTable from "./components/CriticalTicketsTable";

type TimeRangeValue = "7d" | "30d" | "90d" | "custom";

const RANGE_LABEL: Record<TimeRangeValue, string> = {
  "7d": "7 ngày",
  "30d": "30 ngày",
  "90d": "90 ngày",
  custom: "Tuỳ chọn",
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  open: { label: "Mở mới", color: "#0ea5e9" },
  assigned: { label: "Đã phân công", color: "#a855f7" },
  in_progress: { label: "Đang xử lý", color: "#f59e0b" },
  resolved: { label: "Đã xử lý", color: "#10b981" },
  closed: { label: "Đã đóng", color: "#6b7280" },
  cancelled: { label: "Đã huỷ", color: "#ef4444" },
};

const SEVERITY_META: Record<string, { label: string; color: string }> = {
  low: { label: "Thấp", color: "#10b981" },
  medium: { label: "Trung bình", color: "#f59e0b" },
  high: { label: "Cao", color: "#f97316" },
  critical: { label: "Nghiêm trọng", color: "#ef4444" },
};

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  disease: { label: "Bệnh hại", color: "#ef4444" },
  nutrition: { label: "Dinh dưỡng", color: "#10b981" },
  reproduction: { label: "Sinh sản", color: "#a855f7" },
  emergency: { label: "Khẩn cấp", color: "#f59e0b" },
  general: { label: "Chung", color: "#6b7280" },
};

function AdminTicketAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRangeValue>("30d");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const query: TicketAnalyticsQuery =
    timeRange === "custom"
      ? { from: appliedFrom || undefined, to: appliedTo || undefined }
      : { period: timeRange };

  const enabled =
    timeRange !== "custom" || (!!appliedFrom && !!appliedTo);

  const { data: apiResponse, isLoading, isError } = useTicketAnalytics(query, enabled);
  const data = apiResponse?.data;

  const kpi: TicketKpi | undefined = data
    ? {
        totalTickets: data.kpi.totalTickets,
        openTickets: data.kpi.openTickets,
        inProgressTickets: data.kpi.inProgressTickets,
        resolvedTickets: data.kpi.resolvedTickets,
        aiResolvedTickets: data.kpi.aiResolvedTickets,
        avgResolutionHours: data.kpi.avgResolutionHours,
        avgSatisfaction: data.kpi.avgSatisfaction,
        satisfactionResponses: data.kpi.satisfactionResponses,
        resolutionRate: data.kpi.resolutionRate,
        totalDelta: data.kpi.totalDelta,
        resolvedDelta: data.kpi.resolvedDelta,
        avgResolutionDelta: data.kpi.avgResolutionDelta,
      }
    : undefined;

  const statusDistribution: StatusDistribution[] = (
    data?.statusDistribution ?? []
  ).map((s) => ({
    status: s.status as StatusDistribution["status"],
    label: STATUS_META[s.status]?.label ?? s.status,
    count: s.count,
    color: STATUS_META[s.status]?.color ?? "#94a3b8",
  }));

  const severityBreakdown: SeverityBreakdown[] = (
    data?.severityBreakdown ?? []
  ).map((s) => ({
    severity: s.severity as SeverityBreakdown["severity"],
    label: SEVERITY_META[s.severity]?.label ?? s.severity,
    count: s.count,
    color: SEVERITY_META[s.severity]?.color ?? "#94a3b8",
  }));

  const categoryBreakdown: CategoryShare[] = (
    data?.categoryBreakdown ?? []
  ).map((c) => ({
    category: c.category as CategoryShare["category"],
    label: CATEGORY_META[c.category]?.label ?? c.category,
    count: c.count,
    color: CATEGORY_META[c.category]?.color ?? "#94a3b8",
  }));

  const doctorRows: DoctorPerformanceRow[] = (
    data?.doctorPerformance ?? []
  ).map((d) => ({
    doctorId: d.doctorId,
    doctor: d.doctorName ?? d.doctorId,
    processing: d.processing,
    resolved: d.resolved,
    escalated: d.escalated,
    aiFallback: d.aiFallback,
    avgResolutionHours: d.avgResolutionHours,
    satisfaction: d.avgSatisfaction,
  }));

  const criticalRows: CriticalTicketRow[] = (
    data?.criticalTickets ?? []
  ).map((t) => ({
    id: t.id,
    ticketNumber: t.ticketNumber,
    title: t.title,
    severity: t.severity as CriticalTicketRow["severity"],
    status: t.status as CriticalTicketRow["status"],
    createdAt: t.createdAt,
    assignee: t.assigneeName,
    farmName: t.farmName ?? "",
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge className="mb-2">Cổng quản trị</Badge>
          <h1 className="text-2xl font-bold">Phân tích vé hỗ trợ</h1>
          <p className="text-muted-foreground">
            Theo dõi toàn bộ vé sự cố — phân bổ trạng thái, mức độ, hiệu suất
            bác sĩ và các vé ưu tiên cần xử lý.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["7d", "30d", "90d", "custom"] as TimeRangeValue[]).map((range) => (
            <Button
              key={range}
              type="button"
              size="sm"
              variant={timeRange === range ? "default" : "outline"}
              onClick={() => setTimeRange(range)}
            >
              {RANGE_LABEL[range]}
            </Button>
          ))}
        </div>
      </div>

      {timeRange === "custom" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bộ lọc thời gian</CardTitle>
            <CardDescription>
              Chọn khoảng ngày để lọc dữ liệu phân tích.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => {
                  setAppliedFrom(fromDate);
                  setAppliedTo(toDate);
                }}
              >
                Áp dụng bộ lọc
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Không thể tải dữ liệu phân tích. Vui lòng thử lại.
        </div>
      )}

      {!isLoading && !isError && kpi && (
        <>
          <TicketKpiStrip kpi={kpi} />

          <div className="grid gap-4 lg:grid-cols-3">
            <StatusDistributionCard data={statusDistribution} />
            <SeverityBreakdownCard data={severityBreakdown} />
            <CategoryBreakdownCard data={categoryBreakdown} />
          </div>

          <TicketsOverTimeChart data={data?.ticketsOverTime ?? []} />

          <DoctorPerformanceTable rows={doctorRows} hideEscalated />

          <CriticalTicketsTable rows={criticalRows} />
        </>
      )}
    </div>
  );
}

export default AdminTicketAnalyticsPage;
