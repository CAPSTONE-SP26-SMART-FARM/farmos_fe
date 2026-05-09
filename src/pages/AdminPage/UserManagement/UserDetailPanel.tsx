import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAdminUserDetail } from "@/queries/useAdmin";
import { RoleLabelVi } from "@/constants/role";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

interface UserDetailPanelProps {
  id: string;
  onBack: () => void;
}

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string | boolean | null | undefined;
}) => (
  <div className="space-y-1">
    <div className="text-muted-foreground text-xs">{label}</div>
    <div className="font-medium">
      {value === null || value === undefined ? "—" : String(value)}
    </div>
  </div>
);

const DetailSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2">
    {[0, 1].map((i) => (
      <Card key={i}>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  BLOCKED: "destructive",
};

const statusLabel: Record<string, string> = {
  ACTIVE: "Hoạt động",
  INACTIVE: "Không hoạt động",
  BLOCKED: "Bị khóa",
};

const roleVariant: Record<string, "default" | "secondary" | "outline"> = {
  admin: "default",
  owner: "secondary",
  manager: "outline",
  doctor: "outline",
  farmer: "outline",
};

const roleLabel: Record<string, string> = RoleLabelVi;

const UserDetailPanel = ({ id, onBack }: UserDetailPanelProps) => {
  const [show, setShow] = useState(false);
  const detailQuery = useAdminUserDetail(id, true);
  const user = detailQuery.data?.data;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mb-3 -ml-2 gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay về danh sách người dùng
          </Button>
          <h2 className="text-2xl font-bold">Chi tiết người dùng</h2>
          <p className="text-muted-foreground">
            Xem thông tin chi tiết của tài khoản người dùng này.
          </p>
        </div>

        {detailQuery.isLoading ? (
          <DetailSkeleton />
        ) : !user ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <h3 className="text-lg font-semibold mb-1">
                Không tìm thấy dữ liệu
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Không thể tải dữ liệu người dùng được yêu cầu.
              </p>
              <Button
                variant="outline"
                onClick={handleBack}
              >
                Quay lại
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Thông tin tài khoản</CardTitle>
                  <div className="flex gap-2">
                    <Badge
                      variant={roleVariant[user.role] ?? "outline"}
                      className="capitalize"
                    >
                      {roleLabel[user.role] ?? user.role}
                    </Badge>
                    <Badge variant={statusVariant[user.status] ?? "outline"}>
                      {statusLabel[user.status] ?? user.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow
                    label="Họ và tên"
                    value={user.fullName}
                  />
                  <InfoRow
                    label="Email"
                    value={user.email}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow
                    label="Số điện thoại"
                    value={user.phone}
                  />
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-xs">
                      Kích hoạt
                    </div>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Có" : "Không"}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3">
                  <InfoRow
                    label="Email đã xác minh"
                    value={
                      user.emailVerifiedAt
                        ? new Date(user.emailVerifiedAt).toLocaleString()
                        : null
                    }
                  />
                  <InfoRow
                    label="2FA"
                    value={user.emailVerifiedAt ? "Bật" : "Tắt"}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mốc thời gian</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow
                  label="Ngày tham gia"
                  value={new Date(user.createdAt).toLocaleString()}
                />
                <InfoRow
                  label="Cập nhật lần cuối"
                  value={new Date(user.updatedAt).toLocaleString()}
                />
                <InfoRow
                  label="Ngày xóa"
                  value={
                    user.deletedAt
                      ? new Date(user.deletedAt).toLocaleString()
                      : null
                  }
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetailPanel;
