import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useManagerDashboard } from "@/queries/useDashboard";
import type { DashboardPeriod } from "@/types/dashboard";
import { useState } from "react";
import HealthAlertsCard from "./components/HealthAlertsCard";
import OperationsTodayStrip from "./components/OperationsTodayStrip";
import ZonesAtGlanceStrip from "./components/ZonesAtGlanceStrip";
import ZonesOverviewCard from "./components/ZonesOverviewCard";

function ManagerDashboardSection() {
  const [period, setPeriod] = useState<DashboardPeriod>("30d");
  const query = useManagerDashboard(period);
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
          <ZonesAtGlanceStrip data={data.zonesGlance} />

          <OperationsTodayStrip data={data.operationsToday} />

          <HealthAlertsCard data={data.health} />

          <ZonesOverviewCard zones={data.zonesOverview} />
        </>
      )}
    </div>
  );
}

export default ManagerDashboardSection;
