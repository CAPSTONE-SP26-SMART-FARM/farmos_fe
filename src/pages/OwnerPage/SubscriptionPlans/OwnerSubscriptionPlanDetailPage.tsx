import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingCard from "@/components/common/LoadingCard";
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getApiErrorMessageVi } from "@/lib/error-message";
import { formatCurrencyVnd } from "@/lib/format";
import { isApiErrorResponse } from "@/lib/utils";
import {
  useListSubscriptionPlanVersions,
  useSubscriptionPlanDetail,
} from "@/queries/useSubscriptionPlan";
import {
  useOwnerCreateSubscription,
  useOwnerMySubscription,
} from "@/queries/useSubscription";
import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  Info,
  Package,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

function formatFeatureValue(value: string): string {
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "true") return "Có";
  if (lower === "false") return "Không";
  if (lower === "unlimited" || lower === "-1") return "Không giới hạn";
  return trimmed;
}

function OwnerSubscriptionPlanDetailPage() {
  const navigate = useNavigate();
  const { planId = "" } = useParams();
  const [agreed, setAgreed] = useState(false);

  const planQuery = useSubscriptionPlanDetail(planId, Boolean(planId));
  const versionsQuery = useListSubscriptionPlanVersions(
    planId,
    { page: 1, limit: 50, search: undefined },
    Boolean(planId),
  );
  const mySubQuery = useOwnerMySubscription(true);
  const createSubscription = useOwnerCreateSubscription();

  const plan = planQuery.data?.data;
  const versions = versionsQuery.data?.data?.data ?? [];
  const activeVersion = versions.find((v) => v.isActive);
  const mySubscription = mySubQuery.data?.data;
  const isCurrentPlan = mySubscription?.planId === plan?.id;
  const hasOtherSubscription = Boolean(mySubscription) && !isCurrentPlan;

  const handleSubscribe = async () => {
    if (!plan || !activeVersion) return;
    try {
      const result = await createSubscription.mutateAsync({
        planVersionId: activeVersion.id,
      });
      navigate(`/dashboard/owner/payments/${result.data.invoiceId}`);
    } catch (error) {
      if (isApiErrorResponse(error)) {
        toast.error(error.response?.data.message ?? "Đăng ký gói thất bại.");
        return;
      }
      toast.error(getApiErrorMessageVi(error, "Đăng ký gói thất bại."));
    }
  };

  if (planQuery.isLoading) {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <LoadingCard rows={6} />
      </div>
    );
  }

  if (planQuery.isError) {
    return (
      <div className="animate-in fade-in duration-300">
        <ErrorState
          message={getApiErrorMessageVi(
            planQuery.error,
            "Không thể tải thông tin gói.",
          )}
          onRetry={() => planQuery.refetch()}
        />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="animate-in fade-in duration-300">
        <EmptyState
          icon={Package}
          title="Không tìm thấy gói đăng ký"
          description="Gói có thể đã bị lưu trữ hoặc xoá."
        />
      </div>
    );
  }

  const features = activeVersion?.features ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="cursor-pointer"
                onClick={() => navigate("/dashboard/owner")}
              >
                Owner
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                className="cursor-pointer"
                onClick={() =>
                  navigate("/dashboard/owner/subscription-plans")
                }
              >
                Gói đăng ký
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{plan.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/dashboard/owner/subscription-plans")}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Quay lại bảng giá
        </Button>
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {plan.code}
                </p>
                <CardTitle className="mt-1 text-2xl">{plan.name}</CardTitle>
                <CardDescription className="mt-2 max-w-2xl">
                  {plan.description ||
                    "Gói tiêu chuẩn cho nhu cầu vận hành nông trại."}
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-2">
                {isCurrentPlan && (
                  <Badge className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Gói hiện tại
                  </Badge>
                )}
                {plan.status === "ARCHIVED" && (
                  <Badge variant="secondary">Đã lưu trữ</Badge>
                )}
                {activeVersion && (
                  <Badge
                    variant="outline"
                    className="gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    Phiên bản v{activeVersion.versionNo}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Package className="h-3.5 w-3.5" />
                  Giá niêm yết
                </div>
                <p className="mt-1 text-xl font-bold text-primary">
                  {formatCurrencyVnd(plan.listPrice)}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Thời hạn
                </div>
                <p className="mt-1 text-xl font-bold">
                  {plan.durationMonths} tháng
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Tổng tính năng
                </div>
                <p className="mt-1 text-xl font-bold">{features.length}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">
                  Tính năng có trong gói
                </h2>
                {activeVersion?.changelog && (
                  <p className="text-xs text-muted-foreground">
                    {activeVersion.changelog}
                  </p>
                )}
              </div>

              {versionsQuery.isLoading ? (
                <LoadingCard rows={3} />
              ) : !activeVersion ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Gói chưa có phiên bản kích hoạt</AlertTitle>
                  <AlertDescription>
                    Vui lòng quay lại sau khi quản trị viên cấu hình gói.
                  </AlertDescription>
                </Alert>
              ) : features.length === 0 ? (
                <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Chi tiết tính năng sẽ được cập nhật.
                </p>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tính năng</TableHead>
                        <TableHead className="w-[180px]">Giá trị</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Ghi chú
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {features.map((f) => {
                        const value = formatFeatureValue(f.value);
                        const showUnit =
                          f.featureUnit && value !== "Có" && value !== "Không";
                        return (
                          <TableRow key={f.id}>
                            <TableCell>
                              <div className="font-medium">
                                {f.featureName ?? f.featureCode}
                              </div>
                              {f.featureDescription && (
                                <div className="text-xs text-muted-foreground">
                                  {f.featureDescription}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className="font-medium"
                              >
                                {value}
                                {showUnit ? ` ${f.featureUnit}` : ""}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                              {f.note || "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit lg:sticky lg:top-4">
          <CardHeader>
            <CardTitle className="text-base">Đăng ký gói</CardTitle>
            <CardDescription>
              Xác nhận thông tin và thanh toán qua PayOS.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">Tổng thanh toán</p>
              <p className="mt-1 text-2xl font-bold text-primary">
                {formatCurrencyVnd(plan.listPrice)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Cho {plan.durationMonths} tháng sử dụng
              </p>
            </div>

            {isCurrentPlan ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Bạn đang sử dụng gói này</AlertTitle>
                <AlertDescription>
                  Quản lý gói trong mục “Gói đăng ký của tôi”.
                </AlertDescription>
                <div className="mt-3">
                  <Button
                    size="sm"
                    onClick={() => navigate("/dashboard/owner/subscriptions")}
                  >
                    Đi đến gói của tôi
                  </Button>
                </div>
              </Alert>
            ) : hasOtherSubscription ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Bạn đang có gói khác</AlertTitle>
                <AlertDescription>
                  Bạn cần huỷ gói hiện tại trước khi đăng ký gói này.
                </AlertDescription>
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("/dashboard/owner/subscriptions")}
                  >
                    Quản lý gói hiện tại
                  </Button>
                </div>
              </Alert>
            ) : plan.status === "ARCHIVED" ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Gói đã lưu trữ</AlertTitle>
                <AlertDescription>
                  Gói này không còn nhận đăng ký mới.
                </AlertDescription>
              </Alert>
            ) : !activeVersion ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Chưa khả dụng</AlertTitle>
                <AlertDescription>
                  Gói chưa có phiên bản đang áp dụng.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                  <span>
                    Tôi đồng ý với điều khoản dịch vụ của gói đăng ký.
                  </span>
                </label>
                <Button
                  className="w-full"
                  disabled={!agreed || createSubscription.isPending}
                  onClick={handleSubscribe}
                >
                  {createSubscription.isPending
                    ? "Đang xử lý..."
                    : "Đăng ký & thanh toán"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Hoá đơn sẽ được tạo và bạn có thể thanh toán ngay. Gói kích
                  hoạt sau khi PayOS xác nhận.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default OwnerSubscriptionPlanDetailPage;
