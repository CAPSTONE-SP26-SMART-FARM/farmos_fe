import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminDashboard } from "@/queries/useDashboard";
import type { DashboardPeriod } from "@/types/dashboard";
import { useState } from "react";
import IotFleetStatusCard from "./components/IotFleetStatusCard";
import KpiStrip from "./components/KpiStrip";
import NewUsersChart from "./components/NewUsersChart";
import PendingActionsSection from "./components/PendingActionsSection";
import PeriodFilter from "./components/PeriodFilter";
import PlatformWalletChart from "./components/PlatformWalletChart";
import RevenueTrendChart from "./components/RevenueTrendChart";
import SubscriptionDistributionCard from "./components/SubscriptionDistributionCard";

const PERIOD_HINT: Record<DashboardPeriod, string> = {
  "1d": "Hôm nay",
  "7d": "7 ngày gần nhất",
  "30d": "30 ngày gần nhất",
  "90d": "90 ngày gần nhất",
};

function AdminDashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>("30d");

  const query = useAdminDashboard(period);
  const data = query.data?.data;

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
      <section
        aria-labelledby="kpi-section-heading"
        className="space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <h2
            id="kpi-section-heading"
            className="text-sm font-semibold text-muted-foreground"
          >
            Chỉ số chính
          </h2>
          <PeriodFilter
            value={period}
            onChange={setPeriod}
            ariaLabel="Khoảng thời gian áp dụng cho dashboard"
          />
        </div>

        {query.isLoading || !data ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-24 rounded-xl"
              />
            ))}
          </div>
        ) : (
          <KpiStrip data={data.kpis} />
        )}
      </section>

      {/* ── Distribution charts ─────────────────────────────────────── */}
      <section
        aria-labelledby="charts-section-heading"
        className="space-y-3"
      >
        <h2
          id="charts-section-heading"
          className="text-sm font-semibold text-muted-foreground"
        >
          Cơ cấu nền tảng
        </h2>

        {query.isLoading || !data ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-72 rounded-xl"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            <PlatformWalletChart data={data.platformWallet} />
            <SubscriptionDistributionCard
              data={data.subscriptionDistribution}
            />
            <IotFleetStatusCard data={data.iotFleetBoards} />
          </div>
        )}
      </section>

      {/* ── Trend charts (one per row to keep all data points visible) */}
      <section
        aria-labelledby="trend-section-heading"
        className="space-y-3"
      >
        <h2
          id="trend-section-heading"
          className="text-sm font-semibold text-muted-foreground"
        >
          Xu hướng {PERIOD_HINT[period]}
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

      {/* ── Pending actions (separate APIs, not part of /dashboard/admin) */}
      <PendingActionsSection />
    </div>
  );
}

export default AdminDashboardPage;
