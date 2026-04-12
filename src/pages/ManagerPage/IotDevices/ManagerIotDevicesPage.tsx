import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useManagerListAssignedZones } from "@/queries/useZone";
import { Cpu, Loader2, MapPinned } from "lucide-react";
import type { IotDeviceResType } from "@/schemaValidatation/iotDevice";
import IotDeviceList from "@/pages/OwnerPage/IotDevices/IotDeviceList";
import IotDeviceDetail from "@/pages/OwnerPage/IotDevices/IotDeviceDetail";
import IotDeviceForm from "@/pages/OwnerPage/IotDevices/IotDeviceForm";

type NavState =
  | { level: 1 }
  | { level: 2; device: IotDeviceResType }
  | { level: 3 }
  | { level: 4; device: IotDeviceResType };

function getFarmNameFromId(farmId: string) {
  if (!farmId) return "";
  return `Nông trại #${farmId.slice(0, 8)}`;
}

type ManagerFarmSummary = {
  farmId: string;
  zoneCount: number;
};

const ASSIGNED_ZONE_LIMIT = 200;

function getManagerFarmSummaries(zoneFarmIds: string[]): ManagerFarmSummary[] {
  const byFarm = new Map<string, number>();

  zoneFarmIds.forEach((farmId) => {
    byFarm.set(farmId, (byFarm.get(farmId) ?? 0) + 1);
  });

  return [...byFarm.entries()]
    .map(([farmId, zoneCount]) => ({ farmId, zoneCount }))
    .sort((a, b) => b.zoneCount - a.zoneCount);
}

export default function ManagerIotDevicesPage() {
  const [nav, setNav] = useState<NavState>({ level: 1 });
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const navigate = useNavigate();

  const assignedZonesQuery = useManagerListAssignedZones({
    page: 1,
    limit: ASSIGNED_ZONE_LIMIT,
  });

  const assignedZones = assignedZonesQuery.data?.data.data ?? [];

  const managerFarms = useMemo(
    () => getManagerFarmSummaries(assignedZones.map((zone) => zone.farmId)),
    [assignedZones],
  );

  useEffect(() => {
    if (!selectedFarmId && managerFarms.length > 0) {
      setSelectedFarmId(managerFarms[0].farmId);
      return;
    }

    if (
      selectedFarmId &&
      managerFarms.length > 0 &&
      !managerFarms.some((farm) => farm.farmId === selectedFarmId)
    ) {
      setSelectedFarmId(managerFarms[0].farmId);
    }
  }, [selectedFarmId, managerFarms]);

  const activeFarm =
    managerFarms.find((farm) => farm.farmId === selectedFarmId) ??
    managerFarms[0] ??
    null;
  const farmId = activeFarm?.farmId ?? "";

  useEffect(() => {
    setNav({ level: 1 });
  }, [farmId]);

  const farmName = useMemo(() => getFarmNameFromId(farmId), [farmId]);

  if (assignedZonesQuery.isLoading && !assignedZonesQuery.data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (assignedZonesQuery.isError) {
    return (
      <Card className="max-w-3xl">
        <CardHeader>
          <Badge className="mb-2 w-fit">Cổng quản lý</Badge>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            Cấu hình IoT
          </CardTitle>
          <CardDescription>
            Không thể tải danh sách nông trại được phân quyền cho quản lý.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => assignedZonesQuery.refetch()}>Thử lại</Button>
        </CardContent>
      </Card>
    );
  }

  if (!farmId) {
    return (
      <Card className="max-w-3xl">
        <CardHeader>
          <Badge className="mb-2 w-fit">Cổng quản lý</Badge>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            Cấu hình IoT
          </CardTitle>
          <CardDescription>
            Hiện chưa có nông trại nào được gán cho tài khoản quản lý này.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Vui lòng kiểm tra lại mục khu vực được giao hoặc liên hệ chủ
            vườn/admin để được cấp quyền nông trại.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/manager/zones")}
          >
            <MapPinned className="mr-2 h-4 w-4" />
            Mở Khu vực được giao
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (nav.level === 4) {
    return (
      <IotDeviceForm
        farmId={farmId}
        actor="manager"
        device={nav.device}
        onBack={() => setNav({ level: 1 })}
      />
    );
  }

  if (nav.level === 3) {
    return (
      <IotDeviceForm
        farmId={farmId}
        actor="manager"
        onBack={() => setNav({ level: 1 })}
      />
    );
  }

  if (nav.level === 2) {
    return (
      <IotDeviceDetail
        deviceId={nav.device.id}
        farmId={farmId}
        actor="manager"
        onBack={() => setNav({ level: 1 })}
        onEdit={(device) => setNav({ level: 4, device })}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/70">
        <CardHeader>
          <Badge className="mb-2 w-fit">Cổng quản lý</Badge>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            Cấu hình IoT
          </CardTitle>
          <CardDescription>
            Nông trại được xác định tự động theo quyền quản lý. Không cần nhập
            mã nông trại thủ công.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="outline">Nông trại: {farmName}</Badge>
            <span className="text-muted-foreground">
              Quản lý {activeFarm.zoneCount} khu vực
            </span>
          </div>

          {managerFarms.length > 1 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Chọn nông trại để cấu hình
              </p>
              <Select
                value={farmId}
                onValueChange={setSelectedFarmId}
              >
                <SelectTrigger className="max-w-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {managerFarms.map((farm) => (
                    <SelectItem
                      key={farm.farmId}
                      value={farm.farmId}
                    >
                      {getFarmNameFromId(farm.farmId)} • {farm.zoneCount} khu
                      vực
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <IotDeviceList
        farmId={farmId}
        farmName={farmName}
        actor="manager"
        onCreate={() => setNav({ level: 3 })}
        onDetail={(device) => setNav({ level: 2, device })}
        onEdit={(device) => setNav({ level: 4, device })}
        onBack={() => setNav({ level: 1 })}
      />
    </div>
  );
}
