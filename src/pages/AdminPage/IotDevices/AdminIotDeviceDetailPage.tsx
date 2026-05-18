import { Link, useNavigate, useParams } from "react-router";
import { GitBranch, History, User as UserIcon } from "lucide-react";
import IotDeviceDetail from "@/pages/OwnerPage/IotDevices/IotDeviceDetail";
import { useAdminIotDeviceDetail } from "@/queries/useIotDevice";
import { useDynamicBreadcrumb } from "@/stores/breadcrumbStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminIotDeviceDetailPage() {
  const navigate = useNavigate();
  const { deviceId = "" } = useParams<{ deviceId: string }>();

  const deviceQuery = useAdminIotDeviceDetail(deviceId, Boolean(deviceId));
  const ownerId = deviceQuery.data?.data?.owner?.id;

  useDynamicBreadcrumb(
    `/dashboard/admin/iot-devices/${deviceId}`,
    deviceQuery.data?.data?.label ?? deviceQuery.data?.data?.deviceName,
  );

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 p-3">
          <span className="text-sm text-muted-foreground">Quản lý nhanh:</span>
          <Button asChild variant="outline" size="sm">
            <Link to={`/dashboard/admin/iot-devices/${deviceId}/decision`}>
              <GitBranch className="mr-1.5 h-4 w-4" aria-hidden />
              Trang quyết định
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={`/dashboard/admin/iot-devices/${deviceId}/timeline`}>
              <History className="mr-1.5 h-4 w-4" aria-hidden />
              Dòng thời gian
            </Link>
          </Button>
          {ownerId && (
            <Button asChild variant="outline" size="sm">
              <Link to={`/dashboard/admin/owners/${ownerId}/iot`}>
                <UserIcon className="mr-1.5 h-4 w-4" aria-hidden />
                Hồ sơ chủ trang trại 360°
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <IotDeviceDetail
        deviceId={deviceId}
        farmId=""
        actor="admin"
        onBack={() => navigate("/dashboard/admin/iot-devices")}
        onEdit={() => navigate(`/dashboard/admin/iot-devices/${deviceId}/edit`)}
      />
    </div>
  );
}
