import { memo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Cpu,
  Milestone as MilestoneIcon,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router";
import type { ZoneGroup } from "@/queries/useSensorDashboard";
import { worstStatus, STATUS_META } from "../utils/sensorDashboard";
import DashboardSensorCard from "./DashboardSensorCard";

type ZoneAssignmentCardProps = {
  group: ZoneGroup;
  role: "owner" | "manager";
};

export default memo(function ZoneAssignmentCard({
  group,
  role,
}: ZoneAssignmentCardProps) {
  const navigate = useNavigate();
  const overall = worstStatus(group.readings);
  const overallMeta = STATUS_META[overall];

  const handleViewDetail = () => {
    navigate(
      `/dashboard/${role}/sensor-readings/${group.assignment.assignmentId}`,
    );
  };

  return (
    <Card className="overflow-hidden">
      {/* Zone header */}
      <CardHeader className="pb-3 border-b bg-muted/30">
        <div className="flex items-start justify-between gap-3">
          {/* Left: zone info */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <h3 className="text-base font-semibold truncate">
                {group.zoneName}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MilestoneIcon className="h-3.5 w-3.5" />
                {group.milestone.stageName}
              </span>
              <span className="flex items-center gap-1">
                <Cpu className="h-3.5 w-3.5" />
                {group.assignment.device.deviceName}
              </span>
            </div>
          </div>

          {/* Right: overall status + detail link */}
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant="outline"
              className={cn(
                "gap-1.5",
                overallMeta.bgColor,
                overallMeta.color,
                "border-0",
              )}
            >
              <div
                className={cn("h-1.5 w-1.5 rounded-full", overallMeta.dotColor)}
              />
              {overallMeta.label}
            </Badge>
            <button
              onClick={handleViewDetail}
              className="flex items-center gap-0.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Chi tiết
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </CardHeader>

      {/* Sensor cards grid */}
      <CardContent className="pt-4">
        {group.readings.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Chưa có dữ liệu cảm biến cho khu vực này
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {group.readings.map((r) => (
              <DashboardSensorCard
                key={r.sensorId}
                reading={r}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
