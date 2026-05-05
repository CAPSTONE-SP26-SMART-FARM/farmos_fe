import DailyLogActivityFeed from "@/components/common/DailyLogActivityFeed";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOwnerDashboard } from "@/queries/useDashboard";
import type { DashboardPeriod } from "@/types/dashboard";
import { useState } from "react";
import FarmAtGlanceStrip from "./components/FarmAtGlanceStrip";
import HealthAlertsCard from "./components/HealthAlertsCard";
import MonthlySpendChart from "./components/MonthlySpendChart";
import MyDoctorsCard from "./components/MyDoctorsCard";
import OperationsTodayStrip from "./components/OperationsTodayStrip";
import RoleDistributionCard from "./components/RoleDistributionCard";
import SubscriptionStatusCard from "./components/SubscriptionStatusCard";

function OwnerDashboardSection() {
  const [period, setPeriod] = useState<DashboardPeriod>("30d");
  const query = useOwnerDashboard(period);
  const data = query.data?.data;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as DashboardPeriod)}>
          <TabsList>
            <TabsTrigger value="7d">7 ngày</TabsTrigger>
            <TabsTrigger value="30d">30 ngày</TabsTrigger>
            <TabsTrigger value="90d">90 ngày</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {query.isLoading && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-64 rounded-xl lg:col-span-2" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      )}

      {data && (
        <>
          <FarmAtGlanceStrip data={data.farmGlance} />

          <OperationsTodayStrip data={data.operationsToday} />

          {/* subscription null = owner chưa có gói → ẩn card, health chiếm full width */}
          <div className="grid gap-4 lg:grid-cols-3">
            <HealthAlertsCard
              data={data.health}
              className={data.subscription ? "lg:col-span-2" : "lg:col-span-3"}
            />
            {data.subscription && (
              <SubscriptionStatusCard
                subscription={data.subscription}
                credits={data.credits}
                latestInvoice={data.latestInvoice}
              />
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <MonthlySpendChart data={data.monthlySpend} className="lg:col-span-2" />
            <RoleDistributionCard data={data.roleDistribution} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <MyDoctorsCard doctors={data.doctors} />
            <DailyLogActivityFeed
              title="Hoạt động gần đây"
              description="Nhật ký mới nhất từ nông dân trên trang trại."
              logs={data.recentLogs}
              maxItems={5}
              className="lg:col-span-2"
            />
          </div>
        </>
      )}
    </div>
  );
}

export default OwnerDashboardSection;
