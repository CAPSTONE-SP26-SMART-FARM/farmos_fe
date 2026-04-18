import { Loader2, AlertCircle, Activity } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { GetLatestReadingsByAssignmentResType } from "@/schemaValidatation/sensorReading";
import SensorCard from "./SensorCard";
import ConnectionIndicator from "./ConnectionIndicator";

type SensorReadingDashboardProps = {
  query: UseQueryResult<GetLatestReadingsByAssignmentResType>;
};

export default function SensorReadingDashboard({
  query,
}: SensorReadingDashboardProps) {
  const { data, isLoading, isError, error } = query;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-destructive">
        <AlertCircle className="h-8 w-8" />
        <p className="text-sm">
          {(error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Không thể tải dữ liệu cảm biến"}
        </p>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
        <Activity className="h-8 w-8" />
        <p className="text-sm">Chưa có dữ liệu cảm biến cho gán này</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Dữ liệu cảm biến</h2>
        <ConnectionIndicator />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.data.map((reading) => (
          <SensorCard
            key={reading.sensorId}
            reading={reading}
          />
        ))}
      </div>
    </div>
  );
}
