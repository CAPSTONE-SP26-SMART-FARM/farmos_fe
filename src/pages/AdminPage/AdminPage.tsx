import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLocation } from "react-router";

type AdminView = {
  title: string;
  description: string;
  kpis: string[];
};

const adminViews: Record<string, AdminView> = {
  dashboard: {
    title: "Admin Dashboard",
    description: "Tổng quan hệ thống, gói dịch vụ, ticket và trạng thái vận hành.",
    kpis: ["Total Owners", "Pending Doctor Approvals", "Active Tickets", "IoT Alerts"],
  },
  packages: {
    title: "Subscription Packages",
    description: "Quản lý gói đăng ký theo thời lượng, số IoT kits và số doctor tickets.",
    kpis: ["Total Packages", "Active Subscriptions", "Renewal Rate", "Package Conversion"],
  },
  "doctor-applications": {
    title: "Doctor Applications",
    description: "Xét duyệt hồ sơ đăng ký Doctor và xử lý trạng thái hồ sơ.",
    kpis: ["Pending", "Approved", "Rejected", "Avg Review Time"],
  },
  "doctor-assignment": {
    title: "Doctor Assignment",
    description: "Gán Doctor cho Owner/Farm và theo dõi phân bổ nguồn lực.",
    kpis: ["Assigned Doctors", "Unassigned Owners", "Coverage Rate", "Reassignment Count"],
  },
  "doctor-performance": {
    title: "Doctor Performance",
    description: "Theo dõi hiệu suất xử lý ticket của Doctor theo từng mốc thời gian.",
    kpis: ["Resolved Tickets", "In Progress Tickets", "Avg Resolution Time", "SLA Met"],
  },
  "ticket-analytics": {
    title: "Ticket Analytics",
    description:
      "Phân tích ticket theo bộ lọc thời gian: số lượng đang xử lý và đã xử lý của từng Doctor.",
    kpis: ["Processed Tickets", "Processing Tickets", "Escalated Tickets", "Resolution Trend"],
  },
  "iot-templates": {
    title: "IoT Templates",
    description: "Cấu hình và quản lý ngưỡng IoT theo loại cây trồng và giai đoạn sinh trưởng.",
    kpis: ["Templates", "Template Usage", "Custom Overrides", "Alert Accuracy"],
  },
  users: {
    title: "User Management",
    description: "Quản lý tài khoản người dùng theo role và trạng thái hoạt động.",
    kpis: ["Total Users", "Active Users", "Locked Users", "New Users"],
  },
};

const getAdminSection = (pathname: string) => {
  const slug = pathname.replace("/dashboard/admin", "").replace(/^\/+/, "");
  return slug || "dashboard";
};

function AdminPage() {
  const { pathname } = useLocation();
  const currentSection = getAdminSection(pathname);
  const view = adminViews[currentSection] ?? adminViews.dashboard;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge className="mb-2">Admin Portal</Badge>
          <h1 className="text-2xl font-bold">{view.title}</h1>
          <p className="text-muted-foreground">{view.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export</Button>
          <Button>New Action</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {view.kpis.map((kpi) => (
          <Card key={kpi}>
            <CardHeader className="pb-2">
              <CardDescription>{kpi}</CardDescription>
              <CardTitle className="text-2xl">--</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Placeholder data for UI phase.</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Work Area</CardTitle>
          <CardDescription>
            Khu vực thao tác chính của màn hình `{currentSection}` sẽ được nối API sau.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Table, filters theo thời gian, form và chart sẽ được phát triển chi tiết ở bước kế tiếp.
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminPage;
