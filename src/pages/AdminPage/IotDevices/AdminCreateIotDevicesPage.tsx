import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import IotDeviceForm from "@/pages/OwnerPage/IotDevices/IotDeviceForm";
import { useNavigate } from "react-router";

export default function AdminCreateIotDevicesPage() {
  const navigate = useNavigate();
  const [farmId, setFarmId] = useState("");

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="space-y-2">
          <Badge>Cổng quản trị</Badge>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Tạo lô thiết bị IoT
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            Đây là trang thao tác tạo lô thiết bị. Dialog chỉ dùng cho xác nhận.
          </p>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Nông trại (không bắt buộc)</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Nhập mã nông trại để tạo bộ thiết bị và gắn ngay cho nông trại"
            value={farmId}
            onChange={(e) => setFarmId(e.target.value)}
          />
        </CardContent>
      </Card>

      <IotDeviceForm
        farmId={farmId}
        actor="admin"
        onBack={() => navigate("/dashboard/admin/iot-devices")}
      />
    </div>
  );
}
