import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Cpu } from "lucide-react";
import type { IotDeviceResType } from "@/schemaValidatation/iotDevice";
import IotDeviceList from "@/pages/OwnerPage/IotDevices/IotDeviceList";
import IotDeviceDetail from "@/pages/OwnerPage/IotDevices/IotDeviceDetail";

type NavState = { level: 1 } | { level: 2; device: IotDeviceResType };

export default function ManagerIotDevicesPage() {
  const [nav, setNav] = useState<NavState>({ level: 1 });

  if (nav.level === 2) {
    return (
      <IotDeviceDetail
        deviceId={nav.device.id}
        farmId=""
        actor="manager"
        onBack={() => setNav({ level: 1 })}
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
            Cấu hình IoT cấp phát
          </CardTitle>
          <CardDescription>
            Luồng iot-device cũ đã ngừng sử dụng. Trang này chỉ dùng dữ liệu từ
            iot-device-provisioning.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Quản lý có quyền xem danh sách bo mạch được hệ thống cấp phát trả
            về.
          </p>
        </CardContent>
      </Card>

      <IotDeviceList
        farmId=""
        farmName=""
        actor="manager"
        defaultLimit={20}
        onDetail={(device) => setNav({ level: 2, device })}
      />
    </div>
  );
}
