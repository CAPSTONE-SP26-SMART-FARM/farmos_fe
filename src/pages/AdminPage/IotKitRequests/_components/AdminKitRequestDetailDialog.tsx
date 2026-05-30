import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { KitRequestDetailMeta } from "@/components/iot-kit-request/KitRequestDetailMeta";
import { useKitRequestDetail } from "@/queries/useIotKitRequest";
import { useAuthStore } from "@/stores/authStore";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarClock } from "lucide-react";
import { useState } from "react";
import {
  ClaimRequestDialog,
  CompleteInstallDialog,
  RejectRequestDialog,
  ResolveFaultDialog,
  StartInstallDialog,
} from "./AdminKitRequestDialogs";
import { ScheduleSwapDialog } from "./ScheduleSwapDialog";
import { CompleteSwapDialog } from "./CompleteSwapDialog";
import { ScheduleRecoveryDialog } from "./ScheduleRecoveryDialog";
import { CompleteRecoveryDialog } from "./CompleteRecoveryDialog";
import { ScheduleInstallDialog } from "./ScheduleInstallDialog";
import { AlertTriangle } from "lucide-react";

/**
 * Dialog trung tâm cho chi tiết kit request (admin).
 * Dùng Dialog thay Sheet để tránh scroll lồng / overlay đè lên Card trên trang list.
 *
 * State machine action panel:
 *
 *  INSTALL_SCHEDULE:
 *   - pending → "Bắt đầu lắp đặt" (auto-claim handler)
 *   - in_progress (handler = me) + có device purchase → "Bắt đầu lắp" tiếp (đợt sau)
 *   - in_progress (handler = me) + có device install → "Báo lắp xong"
 *   - terminal → readonly
 *
 *  FAULT_REPORT:
 *   - pending → "Nhận xử lý" + "Từ chối"
 *   - in_progress (handler = me) → "Đánh dấu đã xử lý"
 *   - terminal → readonly
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

  const [startOpen, setStartOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [scheduleSwapOpen, setScheduleSwapOpen] = useState(false);
  const [completeSwapOpen, setCompleteSwapOpen] = useState(false);
  const [scheduleRecoveryOpen, setScheduleRecoveryOpen] = useState(false);
  const [completeRecoveryOpen, setCompleteRecoveryOpen] = useState(false);
  const [scheduleInstallOpen, setScheduleInstallOpen] = useState(false);

  const devices = request?.devices ?? [];
  const purchaseDevices = devices.filter((d) => d.status === "purchase");
  const installDevices = devices.filter((d) => d.status === "install");

  const isMyHandler = !!request && request.handlerId === me?.id;
  const isNoHandler = !!request && !request.handlerId;

  const isInstallSchedule = request?.type === "INSTALL_SCHEDULE";
  const hasInstallScheduled = !!request?.scheduledAt;
  const showScheduleInstall =
    isInstallSchedule &&
    (request?.status === "pending" || request?.status === "in_progress") &&
    (isMyHandler || isNoHandler) &&
    !hasInstallScheduled;
  const showStartInstall =
    isInstallSchedule &&
    (request?.status === "pending" || request?.status === "in_progress") &&
    (isMyHandler || isNoHandler) &&
    purchaseDevices.length > 0;
  const showCompleteInstall =
    isInstallSchedule &&
    request?.status === "in_progress" &&
    isMyHandler &&
    installDevices.length > 0;

  const isFault = request?.type === "FAULT_REPORT";
  const isFaultPending = isFault && request?.status === "pending";
  const isFaultInProgress =
    isFault && request?.status === "in_progress" && isMyHandler;
  const hasSwapScheduled = !!request?.metadata?.replacementDeviceId;
  // FAULT in_progress + chưa schedule → cho phép schedule hoặc resolve thẳng.
  // Đã schedule → bắt buộc hoàn tất (không cho resolve thường, không cho hủy lịch).
  const showScheduleSwap = isFaultInProgress && !hasSwapScheduled;
  const showCompleteSwap = isFaultInProgress && hasSwapScheduled;
  const showResolveFault = isFaultInProgress && !hasSwapScheduled;
  // FAULT_REPORT.devices = [] (BE comment) — dialog tự fetch device detail
  // qua useAdminIotDeviceDetail bằng iotDeviceId.
  const faultyDeviceId =
    request && isFault ? (request.iotDeviceId ?? null) : null;

  // RECOVERY_SCHEDULE: auto-create cho owner có sub expired, direction
  // ADMIN_TO_OWNER. devices[] hydrate từ metadata.boardIds bởi BE detail().
  const isRecovery = request?.type === "RECOVERY_SCHEDULE";
  const hasRecoveryScheduled = !!request?.scheduledAt;
  const showScheduleRecovery =
    isRecovery &&
    (request?.status === "pending" || request?.status === "in_progress") &&
    (isMyHandler || isNoHandler) &&
    !hasRecoveryScheduled;
  const showCompleteRecovery =
    isRecovery &&
    request?.status === "in_progress" &&
    isMyHandler &&
    hasRecoveryScheduled;

  const hasAction =
    showScheduleInstall ||
    showStartInstall ||
    showCompleteInstall ||
    isFaultPending ||
    showResolveFault ||
    showScheduleSwap ||
    showCompleteSwap ||
    showScheduleRecovery ||
    showCompleteRecovery;

  const overdueReportedAt = request?.metadata?.ownerOverdueReportedAt ?? null;
  const overdueReason = request?.metadata?.ownerOverdueReason ?? null;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => !next && onClose()}
      >
        <DialogContent className="flex max-h-[min(85vh,820px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
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
                      {format(
                        new Date(overdueReportedAt),
                        "HH:mm dd/MM/yyyy",
                        { locale: vi },
                      )}
                    </div>
                    {overdueReason && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Lý do: {overdueReason}
                      </p>
                    )}
                  </div>
                )}
                {isInstallSchedule && hasInstallScheduled && request.scheduledAt && (
                  <ScheduledCallout
                    kind="install"
                    scheduledAt={request.scheduledAt}
                  />
                )}
                {hasSwapScheduled && request.scheduledAt && (
                  <ScheduledCallout
                    kind="swap"
                    scheduledAt={request.scheduledAt}
                  />
                )}
                {isRecovery && hasRecoveryScheduled && request.scheduledAt && (
                  <ScheduledCallout
                    kind="recovery"
                    scheduledAt={request.scheduledAt}
                  />
                )}
                <KitRequestDetailMeta request={request} />
              </>
            )}
          </div>

          {request && hasAction && (
            <DialogFooter className="shrink-0 flex-row flex-wrap gap-2 border-t px-6 py-4 sm:justify-end">
              {showScheduleInstall && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setScheduleInstallOpen(true)}
                >
                  <CalendarClock className="h-4 w-4" />
                  Lên lịch lắp
                </Button>
              )}
              {showStartInstall && (
                <Button
                  type="button"
                  onClick={() => setStartOpen(true)}
                >
                  Bắt đầu lắp đặt
                </Button>
              )}
              {showCompleteInstall && (
                <Button
                  type="button"
                  onClick={() => setCompleteOpen(true)}
                >
                  Báo lắp xong
                </Button>
              )}

              {isFaultPending && (
                <>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setRejectOpen(true)}
                  >
                    Từ chối
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setClaimOpen(true)}
                  >
                    Nhận xử lý
                  </Button>
                </>
              )}
              {showResolveFault && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setScheduleSwapOpen(true)}
                  >
                    Lên lịch thay thiết bị
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setResolveOpen(true)}
                  >
                    Đánh dấu đã xử lý
                  </Button>
                </>
              )}
              {showCompleteSwap && (
                <Button
                  type="button"
                  onClick={() => setCompleteSwapOpen(true)}
                >
                  Hoàn tất thay thiết bị
                </Button>
              )}

              {showScheduleRecovery && (
                <Button
                  type="button"
                  onClick={() => setScheduleRecoveryOpen(true)}
                >
                  Lên lịch thu hồi
                </Button>
              )}
              {showCompleteRecovery && (
                <Button
                  type="button"
                  onClick={() => setCompleteRecoveryOpen(true)}
                >
                  Hoàn tất thu hồi
                </Button>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {request && isInstallSchedule && (
        <>
          <ScheduleInstallDialog
            open={scheduleInstallOpen}
            request={request}
            onClose={() => setScheduleInstallOpen(false)}
          />
          <StartInstallDialog
            open={startOpen}
            requestId={request.id}
            devices={devices}
            onClose={() => setStartOpen(false)}
          />
          <CompleteInstallDialog
            open={completeOpen}
            requestId={request.id}
            devices={devices}
            onClose={() => setCompleteOpen(false)}
          />
        </>
      )}

      {request && isFault && (
        <>
          <ClaimRequestDialog
            open={claimOpen}
            requestId={request.id}
            onClose={() => setClaimOpen(false)}
          />
          <ResolveFaultDialog
            open={resolveOpen}
            requestId={request.id}
            onClose={() => {
              setResolveOpen(false);
              onClose();
            }}
          />
          <RejectRequestDialog
            open={rejectOpen}
            requestId={request.id}
            onClose={() => {
              setRejectOpen(false);
              onClose();
            }}
          />
          <ScheduleSwapDialog
            open={scheduleSwapOpen}
            requestId={request.id}
            faultyDeviceId={faultyDeviceId}
            farmId={request.farmId}
            onClose={() => setScheduleSwapOpen(false)}
          />
          <CompleteSwapDialog
            open={completeSwapOpen}
            request={request}
            faultyDeviceId={faultyDeviceId}
            farmId={request.farmId}
            onClose={() => {
              setCompleteSwapOpen(false);
              onClose();
            }}
          />
        </>
      )}

      {request && isRecovery && (
        <>
          <ScheduleRecoveryDialog
            open={scheduleRecoveryOpen}
            request={request}
            onClose={() => setScheduleRecoveryOpen(false)}
          />
          <CompleteRecoveryDialog
            open={completeRecoveryOpen}
            request={request}
            onClose={() => {
              setCompleteRecoveryOpen(false);
              onClose();
            }}
          />
        </>
      )}
    </>
  );
}

function ScheduledCallout({
  kind,
  scheduledAt,
}: {
  kind: "swap" | "recovery" | "install";
  scheduledAt: string;
}) {
  const label = format(new Date(scheduledAt), "HH:mm 'ngày' dd/MM/yyyy", {
    locale: vi,
  });
  const config =
    kind === "swap"
      ? {
          title: "Đã lên lịch thay thiết bị",
          actionLabel: "Hoàn tất thay thiết bị",
          verb: "thay",
        }
      : kind === "recovery"
        ? {
            title: "Đã lên lịch thu hồi thiết bị",
            actionLabel: "Hoàn tất thu hồi",
            verb: "thu",
          }
        : {
            title: "Đã lên lịch lắp đặt thiết bị",
            actionLabel: "Bắt đầu lắp đặt",
            verb: "lắp",
          };
  return (
    <div className="mb-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
      <CalendarClock
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
      />
      <div>
        <p className="font-medium text-amber-900 dark:text-amber-200">
          {config.title}
        </p>
        <p className="text-amber-800/80 dark:text-amber-200/80">
          Hẹn vào {label}. Khi kỹ thuật viên đã {config.verb} xong tại hiện
          trường, bấm
          <span className="mx-1 font-semibold">{config.actionLabel}</span>
          để chốt.
        </p>
      </div>
    </div>
  );
}
