import { memo } from "react";
import type { DashboardStats } from "../utils/sensorDashboard";

type SummaryStatsProps = {
  stats: DashboardStats;
};

export default memo(function SummaryStats({ stats: _stats }: SummaryStatsProps) {
  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"></div>
  );
});
