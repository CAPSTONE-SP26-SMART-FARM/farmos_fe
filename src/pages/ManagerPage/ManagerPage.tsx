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

type ManagerView = {
  title: string;
  description: string;
  modules: string[];
};

const managerViews: Record<string, ManagerView> = {
  dashboard: {
    title: "Manager Dashboard",
    description: "Tổng quan zone phụ trách, tiến độ mùa vụ và cảnh báo quan trọng.",
    modules: ["Assigned Zones", "Active Seasons", "Task Progress", "Critical Alerts"],
  },
  zones: {
    title: "Assigned Zones",
    description: "Danh sách zone được giao và trạng thái vận hành từng zone.",
    modules: ["Zone List", "Current Season", "Risk Status", "Owner Summary"],
  },
  seasons: {
    title: "Season Planning",
    description: "Lập kế hoạch mùa vụ theo timeline, loại cây và mục tiêu sản lượng.",
    modules: ["Season Timeline", "Crop Plan", "Milestones", "Yield Target"],
  },
  "iot-config": {
    title: "IoT Configuration",
    description: "Chọn template ngưỡng IoT hoặc tùy chỉnh ngưỡng theo zone/season.",
    modules: ["Template Selection", "Custom Thresholds", "Alert Rules", "Config History"],
  },
  tasks: {
    title: "Task Assignment",
    description: "Tạo task theo stage và giao cho nhân sự phụ trách.",
    modules: ["Task Templates", "Assignments", "Due Date", "Priority"],
  },
  progress: {
    title: "Task Progress",
    description: "Theo dõi tiến độ thực thi task và kết quả thực tế.",
    modules: ["Completion Rate", "Delayed Tasks", "Field Notes", "Stage Health"],
  },
  sensors: {
    title: "Sensor Monitoring",
    description: "Giám sát dữ liệu sensor theo zone và ngưỡng cảnh báo.",
    modules: ["Live Metrics", "Anomaly Feed", "Trend Chart", "Last Seen"],
  },
  incidents: {
    title: "Incident Coordination",
    description: "Điều phối xử lý incident và phối hợp Doctor khi có báo cáo bệnh.",
    modules: ["Open Incidents", "Doctor Status", "Priority Cases", "Escalations"],
  },
  reports: {
    title: "Owner Reports",
    description: "Tổng hợp báo cáo định kỳ gửi Owner.",
    modules: ["Weekly Report", "Monthly Report", "Yield Summary", "Action Plan"],
  },
  notifications: {
    title: "Notifications",
    description: "Thông báo realtime về task, sensor và incident.",
    modules: ["New Alerts", "Unread", "Critical", "Resolved"],
  },
};

const getManagerSection = (pathname: string) => {
  const slug = pathname.replace("/dashboard/manager", "").replace(/^\/+/, "");
  return slug || "dashboard";
};

function ManagerPage() {
  const { pathname } = useLocation();
  const section = getManagerSection(pathname);
  const view = managerViews[section] ?? managerViews.dashboard;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge className="mb-2">Manager Portal</Badge>
          <h1 className="text-2xl font-bold">{view.title}</h1>
          <p className="text-muted-foreground">{view.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Filter</Button>
          <Button>Create New</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {view.modules.map((item) => (
          <Card key={item}>
            <CardHeader className="pb-2">
              <CardDescription>{item}</CardDescription>
              <CardTitle className="text-2xl">--</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Manager UI placeholder block.</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Work Area</CardTitle>
          <CardDescription>
            Màn hình `{section}` đã dựng cấu trúc, chờ tích hợp API và biểu đồ chi tiết.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Sẽ thêm table, form và workflow theo từng module của Manager ở bước tiếp.
        </CardContent>
      </Card>
    </div>
  );
}

export default ManagerPage;
