import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { KitRequestDetailMeta } from "@/components/iot-kit-request/KitRequestDetailMeta";
import { ScheduleNextInstallButton } from "@/components/iot-kit-request/ScheduleNextInstallButton";
import { useKitRequestDetail } from "@/queries/useIotKitRequest";
import { useAuthStore } from "@/stores/authStore";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { AlertTriangle } from "lucide-react";
import { ScheduledSummary } from "./kitActionPanelShared";
import { InstallActionPanel } from "./InstallActionPanel";
import { FaultActionPanel } from "./FaultActionPanel";
import { RecoveryActionPanel } from "./RecoveryActionPanel";

/**
 * Dialog DUY NHẤT cho chi tiết + xử lý kit request (admin). Mọi thao tác
 * (lắp đặt / báo lỗi / thay thiết bị / thu hồi) render inline dạng card trong
 * cùng dialog này — KHÔNG mở dialog lồng nhau.
 *
 *   INSTALL_SCHEDULE  → InstallActionPanel  (lên lịch → bắt đầu lắp → báo lắp xong)
 *   FAULT_REPORT      → FaultActionPanel    (nhận xử lý / từ chối / xử lý / thay thiết bị)
 *   RECOVERY_SCHEDULE → RecoveryActionPanel (lên lịch thu → hoàn tất thu)
 *                        + nút tạo lịch lắp giai đoạn kế khi đã thu xong
 */

interface Props {
  requestId: string | null;
  onClose: () => void;
}

export function AdminKitRequestDetailDialog({ requestId, onClose }: Props) {
  const open = !!requestId;
  const me = useAuthStore((s) => s.user);

  const { data, isLoading, isError } = useKitRequestDetail(
    requestId ?? "",
    !!requestId,
  );

  const request = data?.data;

  const isMyHandler = !!request && request.handlerId === me?.id;
  const isNoHandler = !!request && !request.handlerId;
  const isOpenStatus =
    request?.status === "pending" || request?.status === "in_progress";

  const isInstallSchedule = request?.type === "INSTALL_SCHEDULE";
  const showInstallPanel =
    isInstallSchedule && isOpenStatus && (isMyHandler || isNoHandler);

  const isFault = request?.type === "FAULT_REPORT";

  const isRecovery = request?.type === "RECOVERY_SCHEDULE";
  const showRecoveryPanel = isRecovery && isOpenStatus;
  // Recovery kết thúc milestone đã thu xong → cho tạo lịch lắp giai đoạn kế.
  // Ẩn nếu đây là milestone CUỐI mùa vụ (BE trả isLastMilestone) — hết giai
  // đoạn để lắp.
  const showCreateNextInstall =
    isRecovery &&
    request?.status === "resolved" &&
    request?.metadata?.recoveryReason === "milestone_transition" &&
    !!request?.metadata?.milestoneId &&
    !request?.isLastMilestone;

  // Lịch hẹn thay thiết bị (FAULT) — hiển thị nổi phía trên card hoàn tất thay.
  const hasSwapScheduled = !!request?.metadata?.replacementDeviceId;

  const overdueReportedAt = request?.metadata?.ownerOverdueReportedAt ?? null;
  const overdueReason = request?.metadata?.ownerOverdueReason ?? null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogContent className="flex max-h-[min(85vh,820px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4 pr-12 text-left">
          <DialogTitle>Chi tiết yêu cầu hỗ trợ</DialogTitle>
          <DialogDescription>
            Xem thông tin và xử lý yêu cầu hỗ trợ thiết bị cho chủ trang trại.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {isLoading || !request ? (
            isError ? (
              <p className="text-sm text-destructive">
                Không thể tải yêu cầu. Vui lòng thử lại.
              </p>
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            )
          ) : (
            <>
              {overdueReportedAt && (
                <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                  <div className="flex items-center gap-2 font-medium text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Chủ trang trại báo quá hạn lúc{" "}
                    {format(new Date(overdueReportedAt), "HH:mm dd/MM/yyyy", {
                      locale: vi,
                    })}
                  </div>
                  {overdueReason && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Lý do: {overdueReason}
                    </p>
                  )}
                </div>
              )}

              {isFault && hasSwapScheduled && request.scheduledAt && (
                <div className="mb-4">
                  <ScheduledSummary
                    title="Đã lên lịch thay thiết bị"
                    scheduledAt={request.scheduledAt}
                  />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Sau khi thay xong tại hiện trường, dùng{" "}
                    <span className="font-medium text-foreground">
                      Xác nhận đã thay xong
                    </span>{" "}
                    ở phần bên dưới để chốt yêu cầu.
                  </p>
                </div>
              )}

              <KitRequestDetailMeta request={request} />

              {showInstallPanel && (
                <InstallActionPanel
                  request={request}
                  onClose={onClose}
                />
              )}

              {isFault && (
                <FaultActionPanel
                  request={request}
                  onClose={onClose}
                />
              )}

              {showRecoveryPanel && (
                <RecoveryActionPanel
                  request={request}
                  onClose={onClose}
                />
              )}

              {showCreateNextInstall && request.metadata?.milestoneId && (
                <div className="mt-4 space-y-2 border-t pt-4">
                  <p className="text-sm font-medium">Giai đoạn kế tiếp</p>
                  <p className="text-sm text-muted-foreground">
                    Đã thu hồi xong thiết bị của giai đoạn này. Bạn có thể tạo
                    lịch lắp cho giai đoạn kế tiếp ngay.
                  </p>
                  <ScheduleNextInstallButton
                    afterMilestoneId={request.metadata.milestoneId}
                    size="default"
                    onSuccess={onClose}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
