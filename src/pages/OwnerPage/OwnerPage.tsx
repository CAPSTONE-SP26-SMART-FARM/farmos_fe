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
import OwnerCropSeasonsPage from "./CropSeasons/OwnerCropSeasonsPage";
import OwnerFarmMemberPage from "./FarmMember/OwnerFarmMemberPage";
import OwnerDashboardSection from "./Dashboard/OwnerDashboardSection";

type OwnerView = {
  title: string;
  description: string;
  highlights: string[];
};

const ownerViews: Record<string, OwnerView> = {
  dashboard: {
    title: "Bảng điều khiển chủ trang trại",
    description: "Tổng quan nông trại, sản lượng và trạng thái ticket tư vấn.",
    highlights: [
      "Sức khỏe trang trại",
      "Độ phủ khu vực",
      "Phiếu đang mở",
      "Sản lượng mùa vụ",
    ],
  },
  subscription: {
    title: "Gói dịch vụ và thanh toán",
    description: "Quản lý gói dịch vụ, gia hạn và mua thêm doctor tickets.",
    highlights: [
      "Gói hiện tại",
      "Phiếu còn lại",
      "Ngày gia hạn",
      "Trạng thái thanh toán",
    ],
  },
  managers: {
    title: "Quản lý nhân viên",
    description: "Quản lý tài khoản quản lý viên và phân quyền theo vùng.",
    highlights: [
      "Tổng số quản lý viên",
      "Quản lý viên đã phân công",
      "Lời mời chờ xử lý",
      "Cân bằng khối lượng việc",
    ],
  },
  doctor: {
    title: "Bác sĩ phụ trách",
    description: "Theo dõi bác sĩ phụ trách và trạng thái hỗ trợ hiện tại.",
    highlights: [
      "Bác sĩ được phân công",
      "Ca tư vấn đang mở",
      "Phản hồi trung bình",
      "Phiếu đã đóng",
    ],
  },
  analytics: {
    title: "Phân tích sản xuất",
    description: "Phân tích sản lượng theo farm, zone và season.",
    highlights: [
      "Sản lượng theo mùa vụ",
      "Khu vực tốt nhất",
      "Xu hướng",
      "Dự báo",
    ],
  },
  "ai-insights": {
    title: "Gợi ý AI",
    description:
      "Insight AI để giải thích chênh lệch năng suất và đề xuất tối ưu.",
    highlights: [
      "Gợi ý nổi bật",
      "Tín hiệu rủi ro",
      "Mẹo tối ưu",
      "Ghi chú bất thường",
    ],
  },
  tickets: {
    title: "Theo dõi phiếu hỗ trợ",
    description: "Theo dõi vòng đời ticket bệnh từ lúc tạo tới khi đóng.",
    highlights: ["Phiếu mới", "Đang xử lý", "Đã giải quyết", "Đã leo thang"],
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
  if (section === "crop-seasons") {
    return <OwnerCropSeasonsPage />;
  }

  if (section === "managers") {
    return <OwnerFarmMemberPage />;
  }

  const view = ownerViews[section] ?? ownerViews.dashboard;
  const isDashboardSection = section === "dashboard";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge className="mb-2">Cổng chủ trang trại</Badge>
          <h1 className="text-2xl font-bold">{view.title}</h1>
          <p className="text-muted-foreground">{view.description}</p>
        </div>
        {!isDashboardSection && (
          <div className="flex gap-2">
            <Button variant="outline">Xuất báo cáo</Button>
            <Button>Tạo mới</Button>
          </div>
        )}
      </div>

      {isDashboardSection ? (
        <OwnerDashboardSection />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {view.highlights.map((item) => (
              <Card key={item}>
                <CardHeader className="pb-2">
                  <CardDescription>{item}</CardDescription>
                  <CardTitle className="text-2xl">--</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Khối hiển thị tạm cho chỉ số của chủ trang trại.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Khu vực làm việc</CardTitle>
              <CardDescription>
                Màn hình `{section}` đã sẵn route và khung bố cục để nối dữ liệu
                thật.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Phần table/chart/filter sẽ bổ sung theo backlog API của Owner.
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default OwnerPage;
