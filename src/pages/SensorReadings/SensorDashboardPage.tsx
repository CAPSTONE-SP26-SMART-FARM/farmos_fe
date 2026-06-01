import { Loader2, Radio, Activity } from "lucide-react";
import {
  useSensorDashboard,
  useDashboardRealtime,
} from "@/queries/useSensorDashboard";
import { useZoneSubscriptions } from "@/hooks/useZoneSubscription";
import { aggregateStats } from "./utils/sensorDashboard";
import SummaryStats from "./components/SummaryStats";
import ZoneAssignmentCard from "./components/ZoneAssignmentCard";
import AlertList from "./components/AlertList";
import ConnectionIndicator from "./components/ConnectionIndicator";

type SensorDashboardPageProps = {
  role: "owner" | "manager";
  farmId?: string;
};

export default function SensorDashboardPage({
  role,
  farmId,
}: SensorDashboardPageProps) {
  const { zones, allReadings, isLoading, isPartiallyLoaded, hasError } =
    useSensorDashboard(role, farmId);

  // Realtime: invalidate readings when socket events arrive
  useDashboardRealtime(zones, role);

  // Subscribe all zones currently rendered on dashboard
  useZoneSubscriptions(zones.map((zone) => zone.zoneId));

  const stats = aggregateStats(allReadings);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Đang tải dữ liệu cảm biến...
        </p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-32 text-destructive">
        <Radio className="h-8 w-8" />
        <p className="text-sm">Không thể tải dữ liệu. Vui lòng thử lại.</p>
      </div>
    );
  }

  if (zones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-32 text-muted-foreground">
        <Activity className="h-10 w-10" />
        <div className="text-center space-y-1">
          <p className="text-base font-medium">Chưa có dữ liệu cảm biến</p>
          <p className="text-sm">
            Cần có mùa vụ đang thực hiện với thiết bị IoT đã gán để xem dữ liệu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Tổng Quan Cảm Biến
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Giám sát realtime toàn bộ cảm biến đang hoạt động
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isPartiallyLoaded && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Đang cập nhật...
            </div>
          )}
          <ConnectionIndicator />
        </div>
      </div>

      {/* KPI Summary */}
      <SummaryStats stats={stats} />

      {/* Main content: zones + alerts */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: Zone groups */}
        <div className="space-y-4">
          {zones.map((group, idx) => (
            <ZoneAssignmentCard
              key={`${group.assignment.assignmentId}-${group.zoneId}-${idx}`}
              group={group}
              role={role}
            />
          ))}
        </div>

        {/* Right: Alerts sidebar */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <AlertList />
        </div>
      </div>
    </div>
  );
}
