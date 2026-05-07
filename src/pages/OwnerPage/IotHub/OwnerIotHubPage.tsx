import { useState } from "react";
import { Navigate, useSearchParams } from "react-router";

export function RedirectToIotDevicesTab() {
  return <Navigate to="/dashboard/owner/iot?tab=devices" replace />;
}

export function RedirectToIotOverviewTab() {
  return <Navigate to="/dashboard/owner/iot?tab=overview" replace />;
}
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Cpu, ShoppingBag, Activity } from "lucide-react";
import { Link } from "react-router";
import type { IotDeviceResType } from "@/schemaValidatation/iotDevice";
import IotDeviceList from "../IotDevices/IotDeviceList";
import IotDeviceDetail from "../IotDevices/IotDeviceDetail";
import OwnerIotTrackingPage from "../IotKits/OwnerIotTrackingPage";

type DevicesNav = { level: 1 } | { level: 2; device: IotDeviceResType };

const VALID_TABS = ["overview", "devices"] as const;
type TabKey = (typeof VALID_TABS)[number];

export default function OwnerIotHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const tab: TabKey = (VALID_TABS as readonly string[]).includes(rawTab ?? "")
    ? (rawTab as TabKey)
    : "overview";

  const [devicesNav, setDevicesNav] = useState<DevicesNav>({ level: 1 });

  const handleTabChange = (next: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", next);
    setSearchParams(params, { replace: true });
  };

  if (tab === "devices" && devicesNav.level === 2) {
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

      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5">
            <Activity className="h-4 w-4" />
            Tổng quan & Đơn kit
          </TabsTrigger>
          <TabsTrigger value="devices" className="gap-1.5">
            <Cpu className="h-4 w-4" />
            Thiết bị IoT
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <OwnerIotTrackingPage embedded />
        </TabsContent>

        <TabsContent value="devices" className="mt-0 space-y-4">
          <IotDeviceList
            farmId=""
            farmName=""
            actor="owner"
            onDetail={(device) => setDevicesNav({ level: 2, device })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
