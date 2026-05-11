import { useNavigate, useParams } from "react-router";
import IotDeviceDetail from "@/pages/OwnerPage/IotDevices/IotDeviceDetail";
import { useAdminIotDeviceDetail } from "@/queries/useIotDevice";
import { useDynamicBreadcrumb } from "@/stores/breadcrumbStore";

export default function AdminIotDeviceDetailPage() {
  const navigate = useNavigate();
  const { deviceId = "" } = useParams<{ deviceId: string }>();

  const deviceQuery = useAdminIotDeviceDetail(deviceId, Boolean(deviceId));
  useDynamicBreadcrumb(
    `/dashboard/admin/iot-devices/${deviceId}`,
    deviceQuery.data?.data?.deviceName,
  );

  return (
    <IotDeviceDetail
      deviceId={deviceId}
      farmId=""
      actor="admin"
      onBack={() => navigate("/dashboard/admin/iot-devices")}
      onEdit={() => navigate(`/dashboard/admin/iot-devices/${deviceId}/edit`)}
    />
  );
}
