import { format } from "date-fns";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSubscriptionPlanStatusBadgeVariant } from "@/lib/utils";
import {
  useListSubscriptionPlanVersions,
  useSubscriptionPlanDetail,
} from "@/queries/useSubscriptionPlan";
import type { ListPlanVersionsQueryType } from "@/schemaValidatation/subscriptionPlan";
import {
  CircleCheckBig,
  CircleSlash,
  FilePlus2,
  List,
  MoveLeft,
} from "lucide-react";

const PLAN_STATUS_LABEL: Record<"ACTIVE" | "ARCHIVED", string> = {
  ACTIVE: "Đang hoạt động",
  ARCHIVED: "Đã lưu trữ",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const formatDateTimeVi = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return format(date, "dd/MM/yyyy HH:mm");
};

function AdminSubscriptionPlanDetailPage() {
  const navigate = useNavigate();
  const { planId = "" } = useParams();

  const [versionQuery, setVersionQuery] = useState<ListPlanVersionsQueryType>({
    page: 1,
    limit: 5,
    search: undefined,
  });

  const planDetailQuery = useSubscriptionPlanDetail(planId, Boolean(planId));
  const plan = planDetailQuery.data?.data;

  const planVersionsQuery = useListSubscriptionPlanVersions(
    planId,
    versionQuery,
    Boolean(planId),
  );

  const versionsResult = planVersionsQuery.data?.data;
  const versions = versionsResult?.data ?? [];
  const versionsMeta = versionsResult?.meta;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard/admin/subscription-plans")}
        >
          <MoveLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách
        </Button>

        {plan?.status !== "ARCHIVED" && (
          <Button
            onClick={() =>
              navigate(
                `/dashboard/admin/subscription-plans/${planId}/versions/new`,
              )
            }
            disabled={!planId}
          >
            <FilePlus2 className="mr-2 h-4 w-4" />
            Tạo phiên bản mới
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết gói đăng ký</CardTitle>
          <CardDescription>
            Theo dõi cấu hình hiện tại của gói và lịch sử cập nhật phiên bản.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {planDetailQuery.isLoading && (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Đang tải chi tiết gói...
            </p>
          )}

          {!planDetailQuery.isLoading && !plan && (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Không tìm thấy thông tin gói đăng ký.
            </p>
          )}

          {plan && (
            <>
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Mã gói</p>
                <p className="text-base font-semibold">{plan.code}</p>
                <p className="mt-3 text-xs text-muted-foreground">Tên gói</p>
                <p className="text-base font-semibold">{plan.name}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Thời hạn</p>
                  <p className="font-medium">{plan.durationMonths} tháng</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Giá niêm yết</p>
                  <p className="font-medium">
                    {formatCurrency(plan.listPrice)}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Trạng thái</p>
                  <Badge
                    variant={getSubscriptionPlanStatusBadgeVariant(plan.status)}
                    className="mt-1 gap-1"
                  >
                    {plan.status === "ACTIVE" ? (
                      <CircleCheckBig className="h-3 w-3" />
                    ) : (
                      <CircleSlash className="h-3 w-3" />
                    )}
                    {PLAN_STATUS_LABEL[plan.status]}
                  </Badge>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Mô tả</p>
                <p className="text-sm">
                  {plan.description || "Chưa có mô tả cho gói này."}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">
                  Cập nhật gần nhất
                </p>
                <p className="text-sm">{formatDateTimeVi(plan.updatedAt)}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Lịch sử phiên bản</CardTitle>
            <CardDescription>
              Danh sách phiên bản đã phát hành cho gói này.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="gap-1"
          >
            <List className="h-3 w-3" />
            {versionsMeta?.totalItems ?? 0} phiên bản
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phiên bản</TableHead>
                <TableHead>Hiệu lực từ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Số tính năng</TableHead>
                <TableHead>Ghi chú thay đổi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planVersionsQuery.isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-6 text-center text-muted-foreground"
                  >
                    Đang tải phiên bản...
                  </TableCell>
                </TableRow>
              )}

              {!planVersionsQuery.isLoading && versions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-6 text-center text-muted-foreground"
                  >
                    Chưa có phiên bản nào.
                  </TableCell>
                </TableRow>
              )}

              {versions.map((version) => (
                <TableRow key={version.id}>
                  <TableCell className="font-medium">
                    v{version.versionNo}
                  </TableCell>
                  <TableCell>
                    {formatDateTimeVi(version.effectiveFrom)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={version.isActive ? "default" : "secondary"}>
                      {version.isActive ? "Đang áp dụng" : "Không áp dụng"}
                    </Badge>
                  </TableCell>
                  <TableCell>{version.features.length}</TableCell>
                  <TableCell>{version.changelog || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Trang {versionsMeta?.page ?? 1}/{versionsMeta?.totalPages ?? 1}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!versionsMeta?.hasPreviousPage}
                onClick={() =>
                  setVersionQuery((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
              >
                Trang trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!versionsMeta?.hasNextPage}
                onClick={() =>
                  setVersionQuery((prev) => ({
                    ...prev,
                    page: prev.page + 1,
                  }))
                }
              >
                Trang sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminSubscriptionPlanDetailPage;
