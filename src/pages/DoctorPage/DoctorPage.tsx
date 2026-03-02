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

type DoctorView = {
  title: string;
  description: string;
  widgets: string[];
};

const doctorViews: Record<string, DoctorView> = {
  dashboard: {
    title: "Doctor Dashboard",
    description: "Theo dõi ticket mới, ticket đang xử lý và hiệu suất hỗ trợ.",
    widgets: ["New Tickets", "In Progress", "Avg Response Time", "Resolved Today"],
  },
  "assigned-farms": {
    title: "Assigned Farms",
    description: "Danh sách farm/zone được phân công theo dõi.",
    widgets: ["Total Assigned", "Active Farms", "Follow-up Needed", "High Risk Zones"],
  },
  incidents: {
    title: "Incident Inbox",
    description: "Danh sách báo cáo bệnh/bất thường từ Farmer và Manager.",
    widgets: ["Unread Reports", "Urgent Cases", "Awaiting Diagnosis", "Escalated Cases"],
  },
  "treatment-plans": {
    title: "Diagnosis & Treatment Plans",
    description: "Tạo chẩn đoán, kê phác đồ điều trị và khuyến nghị xử lý.",
    widgets: ["Draft Plans", "Approved Plans", "Medication Usage", "Plan Updates"],
  },
  "treatment-tracking": {
    title: "Treatment Tracking",
    description: "Theo dõi tiến độ điều trị và phản hồi sau xử lý.",
    widgets: ["Ongoing Treatment", "Recovery Cases", "No Response Cases", "Closure Candidates"],
  },
  "ticket-history": {
    title: "Ticket History",
    description: "Lịch sử ticket và thống kê xử lý theo mốc thời gian.",
    widgets: ["Resolved", "Avg Resolution", "Reopened", "Doctor SLA"],
  },
  "knowledge-base": {
    title: "Knowledge Base",
    description: "Quản lý tài liệu hướng dẫn chẩn đoán và điều trị.",
    widgets: ["Total Articles", "Recently Updated", "Popular Guides", "Draft Content"],
  },
  notifications: {
    title: "Notifications",
    description: "Thông báo realtime về case mới và thay đổi trạng thái điều trị.",
    widgets: ["Unread", "Critical", "Mentions", "Resolved Alerts"],
  },
  reports: {
    title: "Reports & Statistics",
    description: "Báo cáo hiệu suất cá nhân và thống kê ticket theo kỳ.",
    widgets: ["Weekly Summary", "Monthly Summary", "Top Disease Types", "Resolution Trend"],
  },
};

const getDoctorSection = (pathname: string) => {
  const slug = pathname.replace("/dashboard/doctor", "").replace(/^\/+/, "");
  return slug || "dashboard";
};

function DoctorPage() {
  const { pathname } = useLocation();
  const section = getDoctorSection(pathname);
  const view = doctorViews[section] ?? doctorViews.dashboard;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge className="mb-2">Doctor Portal</Badge>
          <h1 className="text-2xl font-bold">{view.title}</h1>
          <p className="text-muted-foreground">{view.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Filter Cases</Button>
          <Button>Create Plan</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {view.widgets.map((widget) => (
          <Card key={widget}>
            <CardHeader className="pb-2">
              <CardDescription>{widget}</CardDescription>
              <CardTitle className="text-2xl">--</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Doctor UI placeholder block.</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Work Area</CardTitle>
          <CardDescription>
            Màn hình `{section}` đã sẵn khung để phát triển workflow chi tiết.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Bước tiếp theo sẽ thêm luồng danh sách case, detail report và form chẩn đoán.
        </CardContent>
      </Card>
    </div>
  );
}

export default DoctorPage;
