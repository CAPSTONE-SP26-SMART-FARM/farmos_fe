import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminDashboard } from "@/queries/useDashboard";
import type { DashboardPeriod } from "@/types/dashboard";
import { useMemo, useState } from "react";
import AdminActivityFeed from "./components/AdminActivityFeed";
import IotFleetStatusCard from "./components/IotFleetStatusCard";
import KpiStrip from "./components/KpiStrip";
import NewUsersChart from "./components/NewUsersChart";
import PeriodFilter from "./components/PeriodFilter";
import PlatformWalletChart from "./components/PlatformWalletChart";
import RevenueTrendChart from "./components/RevenueTrendChart";
import SubscriptionDistributionCard from "./components/SubscriptionDistributionCard";
import TicketsByTypeCard from "./components/TicketsByTypeCard";
import {
  buildAdminDashboardOverlay,
  type DashboardPeriodExtended,
} from "./_mocks/adminDashboardOverlay";

/**
 * Map the FE-only "today" filter onto a BE-supported period. The BE schema
 * still rejects "today", so we use 7d as the data fetch and let the overlay
 * scale numbers down for KPI display only.
 */
function toBackendPeriod(period: DashboardPeriodExtended): DashboardPeriod {
  if (period === "today") return "7d";
  return period;
}

function AdminDashboardPage() {
  const [kpiPeriod, setKpiPeriod] = useState<DashboardPeriodExtended>("today");
  const [chartsPeriod, setChartsPeriod] =
    useState<DashboardPeriodExtended>("today");

  const query = useAdminDashboard(toBackendPeriod(kpiPeriod));
  const data = query.data?.data;

  const kpiOverlay = useMemo(
    () => buildAdminDashboardOverlay(data, kpiPeriod),
    [data, kpiPeriod],
  );
  const chartsOverlay = useMemo(
    () => buildAdminDashboardOverlay(data, chartsPeriod),
    [data, chartsPeriod],
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <Badge className="mb-2">Cổng quản trị</Badge>
        <h1 className="text-2xl font-bold">Tổng quan quản trị</h1>
        <p className="text-muted-foreground">
          Theo dõi sức khoẻ nền tảng, doanh thu và hoạt động của admin.
        </p>
      </div>

      {/* ── KPI section ─────────────────────────────────────────────── */}
      <section aria-labelledby="kpi-section-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2
            id="kpi-section-heading"
            className="text-sm font-semibold text-muted-foreground"
          >
            Chỉ số chính
          </h2>
          <PeriodFilter
            value={kpiPeriod}
            onChange={setKpiPeriod}
            ariaLabel="Khoảng thời gian cho chỉ số chính"
          />
        </div>

        {query.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <KpiStrip data={kpiOverlay.kpis} />
        )}
      </section>

      {/* ── Distribution charts (2×2) ───────────────────────────────── */}
      <section aria-labelledby="charts-section-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2
            id="charts-section-heading"
            className="text-sm font-semibold text-muted-foreground"
          >
            Cơ cấu nền tảng
          </h2>
          <PeriodFilter
            value={chartsPeriod}
            onChange={setChartsPeriod}
            ariaLabel="Khoảng thời gian cho biểu đồ cơ cấu (không áp dụng cho Ví tiền nền tảng)"
          />
        </div>

        {query.isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <PlatformWalletChart data={kpiOverlay.platformWallet} />
            <SubscriptionDistributionCard
              data={chartsOverlay.subscriptionDistribution}
            />
            <IotFleetStatusCard data={chartsOverlay.iotFleetBoardOnly} />
            <TicketsByTypeCard data={chartsOverlay.ticketsByType} />
          </div>
        )}
      </section>

      {/* ── Trend charts (one per row to keep all 30 days visible) ─── */}
      <section aria-labelledby="trend-section-heading" className="space-y-3">
        <h2
          id="trend-section-heading"
          className="text-sm font-semibold text-muted-foreground"
        >
          Xu hướng 30 ngày gần nhất
        </h2>
        {query.isLoading || !data ? (
          <div className="space-y-4">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
        ) : (
          <div className="space-y-4">
            <RevenueTrendChart data={data.revenueTrend} />
            <NewUsersChart data={data.newUsersTrend} />
          </div>
        )}
      </section>

      {/* ── Recent activity ─────────────────────────────────────────── */}
      <section aria-labelledby="activity-section-heading" className="space-y-3">
        <h2
          id="activity-section-heading"
          className="text-sm font-semibold text-muted-foreground"
        >
          Hoạt động gần đây
        </h2>
        {query.isLoading || !data ? (
          <Skeleton className="h-96 rounded-xl" />
        ) : (
          <AdminActivityFeed items={data.activityFeed} maxItems={30} />
        )}
      </section>
    </div>
  );
}

export default AdminDashboardPage;
