import { useParams } from "react-router";
import {
  useManagerLatestSensorReadings,
  useSensorReadingRealtime,
} from "@/queries/useSensorReading";
import { useZoneSubscription } from "@/hooks/useSocket";
import SensorReadingDashboard from "@/pages/SensorReadings/components/SensorReadingDashboard";

export default function ManagerSensorReadingPage() {
  const { assignmentId = "" } = useParams<{ assignmentId: string }>();

  const query = useManagerLatestSensorReadings(assignmentId);
  useSensorReadingRealtime(assignmentId || undefined, "manager");
  useZoneSubscription(query.data?.zoneId);

  return <SensorReadingDashboard query={query} />;
}
