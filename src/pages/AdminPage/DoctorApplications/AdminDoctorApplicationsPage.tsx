import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const doctorApplicationRows = [
  {
    name: "Dr. Tran Van A",
    specialty: "Bệnh cây",
    submittedAt: "2026-02-18",
    status: "Chờ duyệt",
  },
  {
    name: "Dr. Hoang Thi B",
    specialty: "Dinh dưỡng cây trồng",
    submittedAt: "2026-02-20",
    status: "Chờ duyệt",
  },
  {
    name: "Dr. Nguyen Van C",
    specialty: "Khoa học đất",
    submittedAt: "2026-02-22",
    status: "Đang xem xét",
  },
];

function AdminDoctorApplicationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2">Cổng quản trị</Badge>
        <h1 className="text-2xl font-bold">Hồ sơ đăng ký bác sĩ</h1>
        <p className="text-muted-foreground">
          Xét duyệt hồ sơ đăng ký bác sĩ và xử lý trạng thái hồ sơ.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hồ sơ chờ duyệt</CardTitle>
          <CardDescription>Hồ sơ đăng ký bác sĩ cần xét duyệt.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {doctorApplicationRows.map((row) => (
            <div
              key={row.name}
              className="rounded-md border p-4"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{row.name}</p>
                <Badge
                  variant={row.status === "Chờ duyệt" ? "secondary" : "outline"}
                >
                  {row.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Chuyên môn: {row.specialty} | Ngày nộp: {row.submittedAt}
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm">Duyệt</Button>
                <Button
                  size="sm"
                  variant="outline"
                >
                  Xem chi tiết
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                >
                  Từ chối
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminDoctorApplicationsPage;
