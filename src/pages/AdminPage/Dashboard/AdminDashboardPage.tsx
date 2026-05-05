import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminDashboard } from "@/queries/useDashboard";
import type { DashboardPeriod } from "@/types/dashboard";
import { useState } from "react";
import ActionQueueCard from "./components/ActionQueueCard";
import AdminActivityFeed from "./components/AdminActivityFeed";
import IotFleetStatusCard from "./components/IotFleetStatusCard";
import KpiStrip from "./components/KpiStrip";
import NewUsersChart from "./components/NewUsersChart";
import RevenueTrendChart from "./components/RevenueTrendChart";
import SubscriptionDistributionCard from "./components/SubscriptionDistributionCard";
import UserRoleDistributionCard from "./components/UserRoleDistributionCard";

function AdminDashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>("30d");
  const query = useAdminDashboard(period);
  const data = query.data?.data;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge className="mb-2">Cổng quản trị</Badge>
          <h1 className="text-2xl font-bold">Tổng quan quản trị</h1>
          <p className="text-muted-foreground">
            Theo dõi sức khoẻ nền tảng, doanh thu và việc cần xử lý của admin.
          </p>
        </div>
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      )}

      {data && (
        <>
          <KpiStrip data={data.kpis} />

          <div className="grid gap-4 lg:grid-cols-2">
            <ActionQueueCard
              pendingDoctorApps={data.actionQueue.pendingDoctorApps}
              overdueInvoices={data.actionQueue.overdueInvoices}
              criticalTickets={data.actionQueue.criticalTickets}
            />
            <AdminActivityFeed items={data.activityFeed} maxItems={8} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <RevenueTrendChart data={data.revenueTrend} />
            <NewUsersChart data={data.newUsersTrend} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SubscriptionDistributionCard data={data.subscriptionDistribution} />
            <UserRoleDistributionCard data={data.userRoleDistribution} />
            <IotFleetStatusCard data={data.iotFleet} />
          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboardPage;
