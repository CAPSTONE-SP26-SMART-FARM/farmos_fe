// src/pages/OwnerPage/CropSeasons/PlanVsActualPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/endpoints";
import {
  ArrowLeft,
  GitCompareArrows,
  History,
  Inbox,
  RefreshCw,
  Table2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorState from "@/components/common/ErrorState";
import LoadingCard from "@/components/common/LoadingCard";
import EmptyState from "@/components/common/EmptyState";
import { useTrackingDiff, useTrackingLog } from "@/queries/useTracking";
import DiffTable from "./components/DiffTable";
import UnplannedTable from "./components/UnplannedTable";
import TrackingTimeline from "./components/TrackingTimeline";
import {
  computeTrackingStats,
  healthTone,
} from "./components/tracking-stats";
import type { TrackingLogQueryType } from "@/schemaValidatation/tracking";

const DEFAULT_LOG_QUERY: TrackingLogQueryType = { page: 1, limit: 20 };

const HEALTH_PILL_CLASS: Record<
  ReturnType<typeof healthTone>,
  string
> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  muted: "bg-muted text-muted-foreground border-border",
};

function PlanVsActualPage() {
  const { id: cropSeasonId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  // BE tracking endpoints (`tracking-log`, `tracking/diff`, ...) accept cả
  // role `owner` lẫn `manager` (xem `tracking.controller.ts`). Page dùng chung
  // cho 2 role; chỉ khác fallback nav khi không có history. Detect prefix URL
  // để biết role hiện tại.
  const isManagerRoute = location.pathname.startsWith("/dashboard/manager/");
  const fallbackListPath = isManagerRoute
    ? "/dashboard/manager/crop-seasons"
    : "/dashboard/owner/crop-seasons";
  const [show, setShow] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const {
    data: diffData,
    isLoading: loadingDiff,
    isError: errorDiff,
    refetch: refetchDiff,
  } = useTrackingDiff(cropSeasonId!);

  const handleRefresh = async () => {
    if (!cropSeasonId) return;
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.tracking.all(cropSeasonId),
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const { data: logData, isLoading: loadingLog } = useTrackingLog(
    cropSeasonId!,
    DEFAULT_LOG_QUERY,
  );

  const stats = useMemo(
    () => (diffData?.data ? computeTrackingStats(diffData.data) : null),
    [diffData?.data],
  );

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(fallbackListPath);
  };

  if (loadingDiff) return <LoadingCard />;
  if (errorDiff) {
    return (
      <ErrorState
        message="Không thể tải dữ liệu so sánh kế hoạch."
        onRetry={() => refetchDiff()}
      />
    );
  }
  if (!diffData?.data) {
    return (
      <EmptyState
        title="Chưa có dữ liệu so sánh"
        description="Mùa vụ chưa được phê duyệt hoặc chưa có dữ liệu theo dõi."
      />
    );
  }

  const diff = diffData.data;
  const cropName = diff.cropSeason.cropName ?? "Mùa vụ";
  const tone = healthTone(stats!.onTimePct, stats!.total > 0);
  const noTracked = diff.tracked.length === 0;
  const noUnplanned = diff.unplanned.length === 0;

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className={`space-y-5 transition-transform duration-300 ease-out ${
          show ? "translate-y-0" : "translate-y-4"
        }`}
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <div
          className={`transition-opacity duration-300 ease-out ${
            show ? "opacity-100" : "opacity-0"
          }`}
        >
          <Breadcrumb className="mb-2">
            <BreadcrumbList>
              <BreadcrumbItem>
                <span className="text-muted-foreground">Mùa vụ</span>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <span className="text-muted-foreground font-medium truncate max-w-50">
                  {cropName}
                </span>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Kế hoạch vs Thực tế</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mb-3 flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="-ml-2 gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại chi tiết mùa vụ
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 hover:border-emerald-400 shadow-sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Làm mới"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span className="text-xs font-semibold">Làm mới</span>
            </Button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Badge
                variant="secondary"
                className="mb-2 gap-1"
              >
                <GitCompareArrows className="h-3 w-3" />
                Kế hoạch vs Thực tế
              </Badge>
              <h1 className="text-2xl font-bold truncate">{cropName}</h1>
              <p className="text-muted-foreground text-sm">
                So sánh kế hoạch ban đầu với tình hình thực tế của mùa vụ
              </p>
            </div>

            {stats!.total > 0 && (
              <div
                className={`shrink-0 rounded-md border px-3 py-2 text-right ${HEALTH_PILL_CLASS[tone]}`}
              >
                <p className="text-[10px] uppercase tracking-wide font-semibold opacity-80">
                  Tỉ lệ đúng KH
                </p>
                <p className="text-xl font-bold tabular-nums leading-none">
                  {stats!.onTimePct}%
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Combined empty state ────────────────────────────── */}
        {noTracked && noUnplanned ? (
          <Card
            className={`transition-opacity duration-500 delay-150 ease-out ${
              show ? "opacity-100" : "opacity-0"
            }`}
          >
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">
                Chưa có dữ liệu so sánh nào
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                Mùa vụ chưa ghi nhận khác biệt giữa kế hoạch và thực tế.
                Dữ liệu sẽ xuất hiện khi có hoạt động cập nhật.
              </p>
            </CardContent>
          </Card>
        ) : (
          /* ── Tabs ────────────────────────────────────────── */
          <div
            className={`transition-opacity duration-500 delay-150 ease-out ${
              show ? "opacity-100" : "opacity-0"
            }`}
          >
            <Tabs
              defaultValue="diff"
              className="space-y-4"
            >
              <TabsList>
                <TabsTrigger
                  value="diff"
                  className="gap-1.5"
                >
                  <Table2 className="h-3.5 w-3.5" />
                  Bảng so sánh
                </TabsTrigger>
                <TabsTrigger
                  value="timeline"
                  className="gap-1.5"
                >
                  <History className="h-3.5 w-3.5" />
                  Timeline & người thực hiện
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="diff"
                className="space-y-5 mt-0"
              >
                {!noTracked && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        Chi tiết so sánh theo trường
                      </CardTitle>
                      <CardDescription>
                        Mỗi hàng hiển thị giá trị kế hoạch và thực tế cạnh nhau,
                        kèm sai số, số lần đổi và thời điểm chỉnh sửa cuối. Chọn{" "}
                        <strong className="font-medium text-foreground">
                          Lịch sử
                        </strong>{" "}
                        để xem chi tiết từng bước kèm người thực hiện.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <DiffTable
                        tracked={diff.tracked}
                        cropSeasonId={cropSeasonId!}
                      />
                    </CardContent>
                  </Card>
                )}

                {!noUnplanned && (
                  <UnplannedTable unplanned={diff.unplanned} />
                )}
              </TabsContent>

              <TabsContent
                value="timeline"
                className="mt-0"
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Lịch sử thay đổi
                    </CardTitle>
                    <CardDescription>
                      Theo dõi từng chỉnh sửa theo thời gian, kèm{" "}
                      <strong className="font-medium text-foreground">
                        người thực hiện
                      </strong>{" "}
                      và nguồn gốc (thủ công / hệ thống / cảm biến…).
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TrackingTimeline
                      cropSeasonId={cropSeasonId!}
                      initialData={logData?.data}
                      isLoading={loadingLog}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

export default PlanVsActualPage;
