import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  mockActionQueue,
  mockActivityFeed,
  mockIotFleet,
  mockKpis,
  mockNewUsersTrend,
  mockRevenueTrend,
  mockSubscriptionDistribution,
  mockUserRoleDistribution,
} from "./_mocks/adminDashboard.mock";
import ActionQueueCard from "./components/ActionQueueCard";
import AdminActivityFeed from "./components/AdminActivityFeed";
import IotFleetStatusCard from "./components/IotFleetStatusCard";
import KpiStrip from "./components/KpiStrip";
import NewUsersChart from "./components/NewUsersChart";
import RevenueTrendChart from "./components/RevenueTrendChart";
import SubscriptionDistributionCard from "./components/SubscriptionDistributionCard";
import UserRoleDistributionCard from "./components/UserRoleDistributionCard";

function AdminDashboardPage() {
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
        {/* Period filter — UI only on mock data */}
        <Tabs defaultValue="30d">
          <TabsList>
            <TabsTrigger value="7d">7 ngày</TabsTrigger>
            <TabsTrigger value="30d">30 ngày</TabsTrigger>
            <TabsTrigger value="90d">90 ngày</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Section 1 — KPI strip */}
      <KpiStrip data={mockKpis} />

      {/* Section 2 — Action queue + Activity feed */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ActionQueueCard
          pendingDoctorApps={mockActionQueue.pendingDoctorApps}
          overdueInvoices={mockActionQueue.overdueInvoices}
          criticalTickets={mockActionQueue.criticalTickets}
        />
        <AdminActivityFeed
          items={mockActivityFeed}
          maxItems={8}
        />
      </div>

      {/* Section 3 — Trends */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueTrendChart data={mockRevenueTrend} />
        <NewUsersChart data={mockNewUsersTrend} />
      </div>

      {/* Section 4 — Distribution snapshots */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SubscriptionDistributionCard data={mockSubscriptionDistribution} />
        <UserRoleDistributionCard data={mockUserRoleDistribution} />
        <IotFleetStatusCard data={mockIotFleet} />
      </div>
    </div>
  );
}

export default AdminDashboardPage;
