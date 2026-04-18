import { useOwnerGetMyFarm } from "@/queries/useOwner";
import SensorDashboardPage from "@/pages/SensorReadings/SensorDashboardPage";

export default function OwnerSensorDashboardPage() {
  const { data: farm } = useOwnerGetMyFarm();
  const farmId = farm?.data?.id;

  return (
    <SensorDashboardPage
      role="owner"
      farmId={farmId}
    />
  );
}
