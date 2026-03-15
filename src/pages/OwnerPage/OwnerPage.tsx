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
import FarmManagement from "./FarmManagement/FarmManagement";

type OwnerView = {
  title: string;
  description: string;
  highlights: string[];
};

const ownerViews: Record<string, OwnerView> = {
  dashboard: {
    title: "Owner Dashboard",
    description: "Tổng quan nông trại, sản lượng và trạng thái ticket tư vấn.",
    highlights: [
      "Farm Health",
      "Zone Coverage",
      "Open Tickets",
      "Season Yield",
    ],
  },
  subscription: {
    title: "Subscription & Billing",
    description: "Quản lý gói dịch vụ, gia hạn và mua thêm doctor tickets.",
    highlights: [
      "Current Plan",
      "Remaining Tickets",
      "Renewal Date",
      "Payment Status",
    ],
  },
  farms: {
    title: "Farm Management",
    description:
      "Quản lý thông tin nông trại: diện tích, vị trí, thông số vận hành.",
    highlights: [
      "Total Farms",
      "Active Farms",
      "Sensor Coverage",
      "Last Update",
    ],
  },
  zones: {
    title: "Zone Management",
    description: "Tạo và quản lý zone trong từng farm.",
    highlights: [
      "Total Zones",
      "Unassigned Zones",
      "Active Seasons",
      "Sensor Alerts",
    ],
  },
  managers: {
    title: "Manager Management",
    description: "Quản lý tài khoản Manager và phân quyền theo vùng.",
    highlights: [
      "Total Managers",
      "Assigned Managers",
      "Pending Invitations",
      "Workload Balance",
    ],
  },
  doctor: {
    title: "Assigned Doctor",
    description: "Theo dõi Doctor phụ trách và trạng thái hỗ trợ hiện tại.",
    highlights: [
      "Assigned Doctors",
      "Open Consultations",
      "Avg Response",
      "Closed Tickets",
    ],
  },
  analytics: {
    title: "Production Analytics",
    description: "Phân tích sản lượng theo farm, zone và season.",
    highlights: ["Yield by Season", "Best Zone", "Trend", "Forecast"],
  },
  "ai-insights": {
    title: "AI Insights",
    description:
      "Insight AI để giải thích chênh lệch năng suất và đề xuất tối ưu.",
    highlights: [
      "Top Insight",
      "Risk Signals",
      "Optimization Tips",
      "Anomaly Notes",
    ],
  },
  tickets: {
    title: "Ticket Monitoring",
    description: "Theo dõi vòng đời ticket bệnh từ lúc tạo tới khi đóng.",
    highlights: ["New Tickets", "In Progress", "Resolved", "Escalated"],
  },
};

const getOwnerSection = (pathname: string) => {
  const slug = pathname.replace("/dashboard/owner", "").replace(/^\/+/, "");
  return slug || "dashboard";
};

function OwnerPage() {
  const { pathname } = useLocation();
  const section = getOwnerSection(pathname);

  // Render dedicated components for implemented sections
  if (section === "farms") {
    return <FarmManagement />;
  }

  const view = ownerViews[section] ?? ownerViews.dashboard;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge className="mb-2">Owner Portal</Badge>
          <h1 className="text-2xl font-bold">{view.title}</h1>
          <p className="text-muted-foreground">{view.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export Report</Button>
          <Button>Create</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {view.highlights.map((item) => (
          <Card key={item}>
            <CardHeader className="pb-2">
              <CardDescription>{item}</CardDescription>
              <CardTitle className="text-2xl">--</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                UI placeholder for owner metrics.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Work Area</CardTitle>
          <CardDescription>
            Màn hình `{section}` đã sẵn route và khung bố cục để nối dữ liệu
            thật.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Phần table/chart/filter sẽ bổ sung theo backlog API của Owner.
        </CardContent>
      </Card>
    </div>
  );
}

export default OwnerPage;
