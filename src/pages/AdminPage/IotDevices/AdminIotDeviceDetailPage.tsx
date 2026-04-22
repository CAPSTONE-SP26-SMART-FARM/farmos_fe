import { useNavigate, useParams } from "react-router";
import IotDeviceDetail from "@/pages/OwnerPage/IotDevices/IotDeviceDetail";

export default function AdminIotDeviceDetailPage() {
  const navigate = useNavigate();
  const { deviceId = "" } = useParams<{ deviceId: string }>();

  return (
    <IotDeviceDetail
      deviceId={deviceId}
      farmId=""
      actor="admin"
      onBack={() => navigate("/dashboard/admin/iot-devices")}
    />
  );
}
