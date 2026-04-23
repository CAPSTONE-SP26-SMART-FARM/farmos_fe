import { useParams } from "react-router";
import {
  useOwnerLatestSensorReadings,
  useSensorReadingRealtime,
} from "@/queries/useSensorReading";
import { useZoneSubscription } from "@/hooks/useZoneSubscription";
import SensorReadingDashboard from "@/pages/SensorReadings/components/SensorReadingDashboard";

export default function OwnerSensorReadingPage() {
  const { assignmentId = "" } = useParams<{ assignmentId: string }>();

  const query = useOwnerLatestSensorReadings(assignmentId);
  useSensorReadingRealtime(assignmentId || undefined, "owner");
  useZoneSubscription(query.data?.zoneId);

  return <SensorReadingDashboard query={query} />;
}
