import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useDebounce from "@/hooks/useDebounce";
import { getSubscriptionPlanStatusBadgeVariant } from "@/lib/utils";
import {
  useListSubscriptionPlanVersions,
  useSubscriptionPlanDetail,
} from "@/queries/useSubscriptionPlan";
import { useDynamicBreadcrumb } from "@/stores/breadcrumbStore";
import type { ListPlanVersionsQueryType } from "@/schemaValidatation/subscriptionPlan";
import {
  ChevronDown,
  CircleCheckBig,
  CircleSlash,
  FilePlus2,
  List,
  MoveLeft,
  Sparkles,
} from "lucide-react";

const PLAN_STATUS_LABEL: Record<"ACTIVE" | "ARCHIVED", string> = {
  ACTIVE: "Đang hoạt động",
  ARCHIVED: "Đã lưu trữ",
};

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

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

  const [versionSearchKeyword, setVersionSearchKeyword] = useState("");
  const debouncedVersionSearch = useDebounce(versionSearchKeyword, 400);

  const [versionQuery, setVersionQuery] = useState<ListPlanVersionsQueryType>({
    page: 1,
    limit: 5,
    search: undefined,
  });

  useEffect(() => {
    setVersionQuery((prev) => ({
      ...prev,
      page: 1,
      search: debouncedVersionSearch.trim() || undefined,
    }));
  }, [debouncedVersionSearch]);

  const planDetailQuery = useSubscriptionPlanDetail(planId, Boolean(planId));
  const plan = planDetailQuery.data?.data;

  useDynamicBreadcrumb(
    `/dashboard/admin/subscription-plans/${planId}`,
    plan?.name,
  );

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
      <div className="space-y-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="cursor-pointer"
                onClick={() => navigate("/dashboard/admin")}
              >
                Admin
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                className="cursor-pointer"
                onClick={() =>
                  navigate("/dashboard/admin/subscription-plans")
                }
              >
                Gói đăng ký
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {plan?.name ?? "Chi tiết gói"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

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

      {!planVersionsQuery.isLoading &&
        versions.length === 0 &&
        plan?.status !== "ARCHIVED" && (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle>Gói chưa có phiên bản nào</AlertTitle>
            <AlertDescription>
              Tạo phiên bản đầu tiên để cấu hình tính năng và giá áp dụng cho
              gói này.
            </AlertDescription>
            <div className="mt-3">
              <Button
                size="sm"
                onClick={() =>
                  navigate(
                    `/dashboard/admin/subscription-plans/${planId}/versions/new`,
                  )
                }
              >
                Tạo phiên bản đầu tiên
              </Button>
            </div>
          </Alert>
        )}

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
          <Input
            placeholder="Tìm kiếm phiên bản..."
            value={versionSearchKeyword}
            onChange={(e) => setVersionSearchKeyword(e.target.value)}
            className="max-w-xs"
          />

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
                  <TableCell>
                    {version.features.length === 0 ? (
                      <span className="text-muted-foreground">0 tính năng</span>
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0"
                          >
                            {version.features.length} tính năng
                            <ChevronDown className="ml-1 h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[420px] max-h-[400px] overflow-auto p-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Mã tính năng</TableHead>
                                <TableHead>Giá trị</TableHead>
                                <TableHead>Ghi chú</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {version.features.map((feature) => (
                                <TableRow key={feature.id}>
                                  <TableCell className="font-mono text-xs">
                                    {feature.featureCode}
                                  </TableCell>
                                  <TableCell>{feature.value}</TableCell>
                                  <TableCell>
                                    {feature.note || "-"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </PopoverContent>
                      </Popover>
                    )}
                  </TableCell>
                  <TableCell>{version.changelog || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!planVersionsQuery.isLoading && versions.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Tổng {versionsMeta?.totalItems ?? 0} phiên bản</span>
                <span>·</span>
                <span>
                  Trang {versionsMeta?.page ?? 1}/
                  {versionsMeta?.totalPages ?? 1}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={String(versionQuery.limit ?? 5)}
                  onValueChange={(value) =>
                    setVersionQuery((prev) => ({
                      ...prev,
                      page: 1,
                      limit: Number(value),
                    }))
                  }
                >
                  <SelectTrigger className="w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem
                        key={size}
                        value={String(size)}
                      >
                        {size} / trang
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminSubscriptionPlanDetailPage;
