import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const kpis = [
  { label: "Tổng chủ vườn", value: "42", delta: "+6 trong tháng" },
  { label: "Yêu cầu bác sĩ chờ duyệt", value: "9", delta: "3 yêu cầu khẩn" },
  {
    label: "Vé hỗ trợ đang hoạt động",
    value: "124",
    delta: "18 vé ưu tiên cao",
  },
  { label: "Cảnh báo IoT", value: "31", delta: "12 cảnh báo chưa xử lý" },
];

function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge className="mb-2">Cổng quản trị</Badge>
          <h1 className="text-2xl font-bold">Bảng điều khiển quản trị</h1>
          <p className="text-muted-foreground">
            Tổng quan hệ thống, gói dịch vụ, ticket và trạng thái vận hành.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Xuất báo cáo</Button>
          <Button>Tạo tác vụ</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardDescription>{kpi.label}</CardDescription>
              <CardTitle className="text-2xl">{kpi.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{kpi.delta}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sức khỏe nền tảng</CardTitle>
            <CardDescription>
              Trạng thái tổng quan của hệ thống FarmOS.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-md border p-3">
              <span>Độ sẵn sàng API</span>
              <Badge>99.4%</Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <span>Thời gian hoạt động MQTT Broker</span>
              <Badge>99.1%</Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <span>Luồng cảnh báo đang hoạt động</span>
              <Badge variant="secondary">12 luồng</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ưu tiên quản trị</CardTitle>
            <CardDescription>Công việc ưu tiên trong 24h tới.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p className="rounded-md border p-3">
              Phê duyệt 3 hồ sơ bác sĩ đang chờ.
            </p>
            <p className="rounded-md border p-3">
              Rà soát 2 vé bệnh hại đã bị chuyển cấp.
            </p>
            <p className="rounded-md border p-3">
              Phát hành 1 mẫu IoT mới cho giai đoạn sinh trưởng của xà lách.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
