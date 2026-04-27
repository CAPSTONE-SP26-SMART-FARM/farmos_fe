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
import {
  CATEGORY_SHARE_MOCK,
  CRITICAL_TICKETS_MOCK,
  DOCTOR_PERFORMANCE_MOCK,
  SEVERITY_BREAKDOWN_MOCK,
  STATUS_DISTRIBUTION_MOCK,
  TICKETS_OVER_TIME_MOCK,
  TICKET_KPI_MOCK,
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

function AdminTicketAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRangeValue>("30d");
  const [fromDate, setFromDate] = useState("2026-04-01");
  const [toDate, setToDate] = useState("2026-04-30");

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
              <Button variant="outline">Áp dụng bộ lọc</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <TicketKpiStrip kpi={TICKET_KPI_MOCK} />

      <div className="grid gap-4 lg:grid-cols-3">
        <StatusDistributionCard data={STATUS_DISTRIBUTION_MOCK} />
        <SeverityBreakdownCard data={SEVERITY_BREAKDOWN_MOCK} />
        <CategoryBreakdownCard data={CATEGORY_SHARE_MOCK} />
      </div>

      <TicketsOverTimeChart data={TICKETS_OVER_TIME_MOCK} />

      <DoctorPerformanceTable rows={DOCTOR_PERFORMANCE_MOCK} />

      <CriticalTicketsTable rows={CRITICAL_TICKETS_MOCK} />
    </div>
  );
}

export default AdminTicketAnalyticsPage;
