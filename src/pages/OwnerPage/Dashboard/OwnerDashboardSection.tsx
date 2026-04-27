import DailyLogActivityFeed from "@/components/common/DailyLogActivityFeed";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  mockCredits,
  mockDoctors,
  mockFarmGlance,
  mockHealth,
  mockLatestInvoice,
  mockMonthlySpend,
  mockOperationsToday,
  mockRecentLogs,
  mockRoleDistribution,
  mockSubscription,
} from "./_mocks/ownerDashboard.mock";
import FarmAtGlanceStrip from "./components/FarmAtGlanceStrip";
import HealthAlertsCard from "./components/HealthAlertsCard";
import MonthlySpendChart from "./components/MonthlySpendChart";
import MyDoctorsCard from "./components/MyDoctorsCard";
import OperationsTodayStrip from "./components/OperationsTodayStrip";
import RoleDistributionCard from "./components/RoleDistributionCard";
import SubscriptionStatusCard from "./components/SubscriptionStatusCard";

function OwnerDashboardSection() {
  return (
    <div className="space-y-6">
      {/* Period filter — UI only on mock */}
      <div className="flex justify-end">
        <Tabs defaultValue="30d">
          <TabsList>
            <TabsTrigger value="7d">7 ngày</TabsTrigger>
            <TabsTrigger value="30d">30 ngày</TabsTrigger>
            <TabsTrigger value="90d">90 ngày</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Section 1 — Farm at a glance */}
      <FarmAtGlanceStrip data={mockFarmGlance} />

      {/* Section 2 — Operations today */}
      <OperationsTodayStrip data={mockOperationsToday} />

      {/* Section 3 — Health alerts (left, wide) + Subscription (right) */}
      <div className="grid gap-4 lg:grid-cols-3">
        <HealthAlertsCard
          data={mockHealth}
          className="lg:col-span-2"
        />
        <SubscriptionStatusCard
          subscription={mockSubscription}
          credits={mockCredits}
          latestInvoice={mockLatestInvoice}
        />
      </div>

      {/* Section 4 — Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <MonthlySpendChart
          data={mockMonthlySpend}
          className="lg:col-span-2"
        />
        <RoleDistributionCard data={mockRoleDistribution} />
      </div>

      {/* Section 5 — People & activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <MyDoctorsCard doctors={mockDoctors} />
        <DailyLogActivityFeed
          title="Hoạt động gần đây"
          description="Nhật ký mới nhất từ nông dân trên trang trại."
          logs={mockRecentLogs}
          maxItems={5}
          className="lg:col-span-2"
        />
      </div>
    </div>
  );
}

export default OwnerDashboardSection;
