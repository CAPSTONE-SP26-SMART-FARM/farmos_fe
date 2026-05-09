import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAdminFarmDetail } from "@/queries/useAdmin";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

interface FarmDetailPanelProps {
  id: string;
  onBack: () => void;
}

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => (
  <div className="space-y-1">
    <div className="text-muted-foreground">{label}</div>
    <div className="font-medium">{value ?? "—"}</div>
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
        </CardContent>
      </Card>
    ))}
  </div>
);

const FarmDetailPanel = ({ id, onBack }: FarmDetailPanelProps) => {
  const [show, setShow] = useState(false);
  const detailQuery = useAdminFarmDetail(id, true);
  const farm = detailQuery.data?.data;

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
            Quay lại danh sách nông trại
          </Button>
          <h2 className="text-2xl font-bold">Chi tiết nông trại</h2>
          <p className="text-muted-foreground">
            Xem thông tin nông trại và chủ trang trại.
          </p>
        </div>

        {detailQuery.isLoading ? (
          <DetailSkeleton />
        ) : !farm ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <h3 className="text-lg font-semibold mb-1">
                Không tìm thấy dữ liệu
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Không thể tải nông trại được yêu cầu.
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
                <CardTitle>Thông tin nông trại</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow
                    label="Mã"
                    value={farm.code}
                  />
                  <InfoRow
                    label="Tên"
                    value={farm.name}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Loại</div>
                    <div className="font-medium capitalize">
                      {farm.farmType}
                    </div>
                  </div>
                  <InfoRow
                    label="Địa chỉ"
                    value={farm.address}
                  />
                </div>

                {farm.description && (
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Mô tả</div>
                    <div className="whitespace-pre-wrap">
                      {farm.description}
                    </div>
                  </div>
                )}

                <Separator />

                {/* <div className="grid grid-cols-2 gap-3">
                  <InfoRow
                    label="Vĩ độ"
                    value={farm.latitude}
                  />
                  <InfoRow
                    label="Kinh độ"
                    value={farm.longitude}
                  />
                </div> */}

                <div className="grid grid-cols-2 gap-3">
                  <InfoRow
                    label="Diện tích (m²)"
                    value={farm.areaSqm}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3">
                  <InfoRow
                    label="Ngày tạo"
                    value={new Date(farm.createdAt).toLocaleString()}
                  />
                  <InfoRow
                    label="Cập nhật"
                    value={new Date(farm.updatedAt).toLocaleString()}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Thông tin chủ trang trại</CardTitle>
                  <Badge
                    variant={farm.owner.isActive ? "default" : "secondary"}
                  >
                    {farm.owner.isActive ? "Hoạt động" : "Ngưng hoạt động"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow
                  label="Email"
                  value={farm.owner.email}
                />
                <InfoRow
                  label="Họ và tên"
                  value={farm.owner.fullName}
                />
                <InfoRow
                  label="Số điện thoại"
                  value={farm.owner.phone}
                />
                <div className="space-y-1">
                  <div className="text-muted-foreground">Vai trò</div>
                  <div className="font-medium capitalize">
                    {farm.owner.role}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmDetailPanel;
