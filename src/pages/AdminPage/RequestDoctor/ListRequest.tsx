import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import TableRequestDoctor from "./TableRequestDoctor";

const ListRequestAdmin = () => {
  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="space-y-2">
        <Card x-chunk="dashboard-06-chunk-0">
          <CardHeader>
            <CardTitle>Yêu cầu đăng ký bác sĩ</CardTitle>
            <CardDescription>
              Danh sách yêu cầu gửi quản trị viên để trở thành bác sĩ trên nền
              tảng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TableRequestDoctor />
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default ListRequestAdmin;
