import { useNavigate, useParams } from "react-router";
import IotDeviceForm from "@/pages/OwnerPage/IotDevices/IotDeviceForm";
import { useAdminIotDeviceDetail } from "@/queries/useIotDevice";
import { useDynamicBreadcrumb } from "@/stores/breadcrumbStore";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminEditIotDevicePage() {
  const navigate = useNavigate();
  const { deviceId = "" } = useParams<{ deviceId: string }>();

  const deviceQuery = useAdminIotDeviceDetail(deviceId, Boolean(deviceId));
  const device = deviceQuery.data?.data;

  useDynamicBreadcrumb(
    `/dashboard/admin/iot-devices/${deviceId}/edit`,
    device ? `Chỉnh sửa: ${device.deviceName}` : undefined,
  );

  const handleBack = () =>
    navigate(`/dashboard/admin/iot-devices/${deviceId}`);

  if (deviceQuery.isLoading || !device) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <IotDeviceForm
      farmId=""
      actor="admin"
      device={device}
      onBack={handleBack}
      onBackRequested={handleBack}
    />
  );
}
