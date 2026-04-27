import DailyLogActivityFeed from "@/components/common/DailyLogActivityFeed";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  mockCrewPresence,
  mockManagerHealth,
  mockManagerRecentLogs,
  mockOperationsToday,
  mockZonesGlance,
  mockZonesOverview,
} from "./_mocks/managerDashboard.mock";
import CrewPresenceCard from "./components/CrewPresenceCard";
import HealthAlertsCard from "./components/HealthAlertsCard";
import OperationsTodayStrip from "./components/OperationsTodayStrip";
import ZonesAtGlanceStrip from "./components/ZonesAtGlanceStrip";
import ZonesOverviewCard from "./components/ZonesOverviewCard";

function ManagerDashboardSection() {
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

      {/* Section 1 — Zones at a glance */}
      <ZonesAtGlanceStrip data={mockZonesGlance} />

      {/* Section 2 — Operations today */}
      <OperationsTodayStrip data={mockOperationsToday} />

      {/* Section 3 — Health alerts (wide) + Crew presence */}
      <div className="grid gap-4 lg:grid-cols-3">
        <HealthAlertsCard
          data={mockManagerHealth}
          className="lg:col-span-2"
        />
        <CrewPresenceCard zones={mockCrewPresence} />
      </div>

      {/* Section 4 — Zones overview (wide) + Activity feed */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ZonesOverviewCard
          zones={mockZonesOverview}
          className="lg:col-span-2"
        />
        <DailyLogActivityFeed
          title="Hoạt động gần đây"
          description="Nhật ký mới nhất từ các khu vực bạn quản lý."
          logs={mockManagerRecentLogs}
          maxItems={5}
        />
      </div>
    </div>
  );
}

export default ManagerDashboardSection;
