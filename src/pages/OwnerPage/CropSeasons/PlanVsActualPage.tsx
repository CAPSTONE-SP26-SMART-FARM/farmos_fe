// src/pages/OwnerPage/CropSeasons/PlanVsActualPage.tsx
import { useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import ErrorState from "@/components/common/ErrorState";
import LoadingCard from "@/components/common/LoadingCard";
import EmptyState from "@/components/common/EmptyState";
import { useTrackingDiff, useTrackingLog } from "@/queries/useTracking";
import KpiSummaryCards from "./components/KpiSummaryCards";
import DiffTable from "./components/DiffTable";
import UnplannedTable from "./components/UnplannedTable";
import TrackingTimeline from "./components/TrackingTimeline";
import type { TrackingLogQueryType } from "@/schemaValidatation/tracking";

const DEFAULT_LOG_QUERY: TrackingLogQueryType = { page: 1, limit: 20 };

function PlanVsActualPage() {
  const { id: cropSeasonId } = useParams<{ id: string }>();

  const {
    data: diffData,
    isLoading: loadingDiff,
    isError: errorDiff,
    refetch: refetchDiff,
  } = useTrackingDiff(cropSeasonId!);

  const { data: logData, isLoading: loadingLog } = useTrackingLog(
    cropSeasonId!,
    DEFAULT_LOG_QUERY,
  );

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

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Badge className="mb-2">Kế hoạch vs Thực tế</Badge>
        <h1 className="text-2xl font-bold">
          {diff.cropSeason.cropName ?? "Mùa vụ"}
        </h1>
        <p className="text-muted-foreground text-sm">
          So sánh kế hoạch ban đầu và tình hình thực tế
        </p>
      </div>

      {/* KPI summary */}
      <KpiSummaryCards diff={diff} />

      <Separator />

      {/* Main content tabs */}
      <Tabs defaultValue="diff">
        <TabsList>
          <TabsTrigger value="diff">Bảng so sánh</TabsTrigger>
          <TabsTrigger value="timeline">Timeline thay đổi</TabsTrigger>
        </TabsList>

        <TabsContent
          value="diff"
          className="space-y-6 mt-4"
        >
          <DiffTable
            tracked={diff.tracked}
            cropSeasonId={cropSeasonId!}
          />
          {diff.unplanned.length > 0 && (
            <UnplannedTable unplanned={diff.unplanned} />
          )}
        </TabsContent>

        <TabsContent
          value="timeline"
          className="mt-4"
        >
          <TrackingTimeline
            cropSeasonId={cropSeasonId!}
            initialData={logData?.data}
            isLoading={loadingLog}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PlanVsActualPage;
