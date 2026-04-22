import { useNavigate, useParams } from "react-router";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import IotDeviceForm from "@/pages/OwnerPage/IotDevices/IotDeviceForm";
import { useAdminIotDeviceDetail } from "@/queries/useIotDevice";

export default function AdminEditIotDevicePage() {
  const navigate = useNavigate();
  const { deviceId = "" } = useParams<{ deviceId: string }>();

  const detailQuery = useAdminIotDeviceDetail(deviceId, !!deviceId);
  const device = detailQuery.data?.data;

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!device) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không tìm thấy thiết bị</CardTitle>
          <CardDescription>
            Thiết bị đã bị xóa hoặc không tồn tại trong hệ thống cấp phát.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <IotDeviceForm
        farmId=""
        actor="admin"
        device={device}
        onBack={() => navigate("/dashboard/admin/iot-devices")}
      />
    </div>
  );
}
