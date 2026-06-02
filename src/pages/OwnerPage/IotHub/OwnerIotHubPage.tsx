import { useState } from "react";
import { Navigate, Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import type { IotDeviceResType } from "@/schemaValidatation/iotDevice";
import IotDeviceList from "../IotDevices/IotDeviceList";
import IotDeviceDetail from "../IotDevices/IotDeviceDetail";
import OwnerIotTrackingPage from "../IotKits/OwnerIotTrackingPage";

// Legacy routes /iot-devices và /iot-tracking gộp về trang IoT thống nhất.
export function RedirectToIotDevicesTab() {
  return <Navigate to="/dashboard/owner/iot" replace />;
}

export function RedirectToIotOverviewTab() {
  return <Navigate to="/dashboard/owner/iot" replace />;
}

type DevicesNav = { level: 1 } | { level: 2; device: IotDeviceResType };

export default function OwnerIotHubPage() {
  const [devicesNav, setDevicesNav] = useState<DevicesNav>({ level: 1 });

  if (devicesNav.level === 2) {
    return (
      <IotDeviceDetail
        deviceId={devicesNav.device.id}
        farmId=""
        actor="owner"
        onBack={() => setDevicesNav({ level: 1 })}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge className="mb-2">IoT</Badge>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Thiết bị & Hạn mức IoT
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Quản lý hạn mức từ gói đăng ký, các bộ kit đã mua và toàn bộ
              thiết bị IoT đang hoạt động trong nông trại.
            </p>
          </div>
          <Button asChild>
            <Link to="/dashboard/owner/iot-kits">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Mua thêm kit
            </Link>
          </Button>
        </div>
      </section>

      {/* Card trên cùng: hạn mức kit từ gói đăng ký + các đơn mua thêm */}
      <OwnerIotTrackingPage embedded hideSubscriptionDevices />

      {/* Danh sách toàn bộ thiết bị IoT */}
      <IotDeviceList
        farmId=""
        farmName=""
        actor="owner"
        onDetail={(device) => setDevicesNav({ level: 2, device })}
      />
    </div>
  );
}
