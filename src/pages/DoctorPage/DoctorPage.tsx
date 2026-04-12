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
    title: "Bảng điều khiển bác sĩ",
    description: "Theo dõi ticket mới, ticket đang xử lý và hiệu suất hỗ trợ.",
    widgets: [
      "Phiếu mới",
      "Đang xử lý",
      "Thời gian phản hồi TB",
      "Đã giải quyết hôm nay",
    ],
  },
  "assigned-farms": {
    title: "Trang trại phụ trách",
    description: "Danh sách farm/zone được phân công theo dõi.",
    widgets: [
      "Tổng đã phân công",
      "Trang trại hoạt động",
      "Cần theo dõi thêm",
      "Khu vực rủi ro cao",
    ],
  },
  incidents: {
    title: "Hộp thư sự cố",
    description: "Danh sách báo cáo bệnh/bất thường từ Farmer và Manager.",
    widgets: [
      "Báo cáo chưa đọc",
      "Ca khẩn cấp",
      "Chờ chẩn đoán",
      "Ca đã leo thang",
    ],
  },
  "treatment-plans": {
    title: "Chẩn đoán và phác đồ điều trị",
    description: "Tạo chẩn đoán, kê phác đồ điều trị và khuyến nghị xử lý.",
    widgets: [
      "Phác đồ nháp",
      "Phác đồ đã duyệt",
      "Tình hình dùng thuốc",
      "Cập nhật phác đồ",
    ],
  },
  "treatment-tracking": {
    title: "Theo dõi điều trị",
    description: "Theo dõi tiến độ điều trị và phản hồi sau xử lý.",
    widgets: [
      "Đang điều trị",
      "Ca hồi phục",
      "Ca không đáp ứng",
      "Ca có thể đóng",
    ],
  },
  "ticket-history": {
    title: "Lịch sử phiếu",
    description: "Lịch sử ticket và thống kê xử lý theo mốc thời gian.",
    widgets: ["Đã giải quyết", "Thời gian xử lý TB", "Mở lại", "SLA bác sĩ"],
  },
  "knowledge-base": {
    title: "Cơ sở tri thức",
    description: "Quản lý tài liệu hướng dẫn chẩn đoán và điều trị.",
    widgets: [
      "Tổng bài viết",
      "Cập nhật gần đây",
      "Hướng dẫn phổ biến",
      "Nội dung nháp",
    ],
  },
  notifications: {
    title: "Thông báo",
    description:
      "Thông báo realtime về case mới và thay đổi trạng thái điều trị.",
    widgets: ["Chưa đọc", "Quan trọng", "Nhắc đến", "Cảnh báo đã xử lý"],
  },
  reports: {
    title: "Báo cáo và thống kê",
    description: "Báo cáo hiệu suất cá nhân và thống kê ticket theo kỳ.",
    widgets: [
      "Tổng kết tuần",
      "Tổng kết tháng",
      "Nhóm bệnh phổ biến",
      "Xu hướng xử lý",
    ],
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
          <Badge className="mb-2">Cổng bác sĩ</Badge>
          <h1 className="text-2xl font-bold">{view.title}</h1>
          <p className="text-muted-foreground">{view.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Lọc ca bệnh</Button>
          <Button>Tạo phác đồ</Button>
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
              <p className="text-xs text-muted-foreground">
                Khối hiển thị tạm cho giao diện bác sĩ.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Khu vực làm việc</CardTitle>
          <CardDescription>
            Màn hình `{section}` đã sẵn khung để phát triển workflow chi tiết.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Bước tiếp theo sẽ thêm luồng danh sách case, detail report và form
          chẩn đoán.
        </CardContent>
      </Card>
    </div>
  );
}

export default DoctorPage;
