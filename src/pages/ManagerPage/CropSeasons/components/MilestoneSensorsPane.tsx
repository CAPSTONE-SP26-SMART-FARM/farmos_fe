import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Radio } from "lucide-react";
import IotCoverageWidget from "@/components/common/IotCoverageWidget";
import { useZoneSubscription } from "@/hooks/useZoneSubscription";
import { useMilestoneAssignmentsRealtime } from "@/queries/useSensorReading";
import type { ProductionMilestoneResType } from "@/schemaValidatation/productionMilestone";
import { AlertsPanel, MilestoneSensorSection } from "./SensorOverviewTab";

/**
 * Cảm biến tab trong milestone detail — giữ NGUYÊN layout/UI giống commit
 * trước (SensorOverviewTab):
 *  - Left column: IotCoverageWidget + MilestoneSensorSection của mốc này
 *  - Right column: AlertsPanel sticky
 *
 * Khác biệt duy nhất: scope theo 1 milestone thay vì loop qua tất cả
 * in_progress milestones của season.
 */
export function MilestoneSensorsPane({
  milestone,
  zoneId,
  isLoading,
  backUrl,
  isPlanning = false,
}: {
  milestone: ProductionMilestoneResType | undefined;
  zoneId: string;
  isLoading: boolean;
  /**
   * Khi truyền, click sensor card sẽ điều hướng sang sensor detail kèm
   * `?from=<backUrl>` để nút "Quay lại" về đúng trang milestone này.
   */
  backUrl?: string;
  /**
   * Lúc lập kế hoạch (Planning) → widget độ phủ hiện đầy đủ cả gợi ý mua thêm
   * Kit. Khi mùa vụ đã chạy → vẫn hiện số liệu độ phủ nhưng ẩn phần nhắc mua.
   */
  isPlanning?: boolean;
}) {
  useZoneSubscription(zoneId || undefined);
  useMilestoneAssignmentsRealtime("manager");

  if (isLoading) {
    return (
      <div className="flex gap-4">
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                className="h-36"
              />
            ))}
          </div>
        </div>
        <div className="w-72 space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="h-12 w-full"
            />
          ))}
        </div>
      </div>
    );
  }

  // Cảnh báo ngưỡng cảm biến chỉ có ý nghĩa khi giai đoạn đang diễn ra —
  // các mốc `pending` / `completed` không có sensor reading mới (BE cron cũng
  // skip flag), nên ẩn cả cột phải để layout gọn + tránh hiển thị cảnh báo
  // cũ gây hiểu nhầm.
  const showAlerts = milestone?.status === "in_progress";

  return (
    <div className="flex gap-5 min-h-90">
      <div className="flex-1 min-w-0 space-y-6">
        {/* Độ phủ tính theo RIÊNG mốc này (chỉ thiết bị đã gán cho mốc).
            Khi không xác định được mốc → fallback zone scope.
            Lúc đang chạy ẩn phần nhắc mua thêm Kit (showProcurementAdvice). */}
        {milestone?.id ? (
          <IotCoverageWidget
            milestoneId={milestone.id}
            showProcurementAdvice={isPlanning}
          />
        ) : zoneId ? (
          <IotCoverageWidget
            zoneId={zoneId}
            showProcurementAdvice={isPlanning}
          />
        ) : null}
        {milestone ? (
          <MilestoneSensorSection
            milestone={milestone}
            backUrl={backUrl}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center border rounded-md bg-muted/20">
            <Radio className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Không tìm thấy mốc công việc
            </p>
          </div>
        )}
      </div>
      {showAlerts && (
        <div className="w-72 xl:w-80 shrink-0">
          <div className="sticky top-4 space-y-2">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              <h4 className="text-sm font-semibold">Cảnh báo</h4>
            </div>
            <AlertsPanel
              isLoading={isLoading}
              zoneId={zoneId}
              milestoneId={milestone?.id}
            />
          </div>
        </div>
      )}
    </div>
  );
}
