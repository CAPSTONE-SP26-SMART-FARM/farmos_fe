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
import { useState } from "react";
import {
  ClaimRequestDialog,
  CompleteInstallDialog,
  RejectRequestDialog,
  ResolveFaultDialog,
  StartInstallDialog,
} from "./AdminKitRequestDialogs";

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

  const devices = request?.devices ?? [];
  const purchaseDevices = devices.filter((d) => d.status === "purchase");
  const installDevices = devices.filter((d) => d.status === "install");

  const isMyHandler = !!request && request.handlerId === me?.id;
  const isNoHandler = !!request && !request.handlerId;

  const isInstallSchedule = request?.type === "INSTALL_SCHEDULE";
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

  const hasAction =
    showStartInstall ||
    showCompleteInstall ||
    isFaultPending ||
    isFaultInProgress;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => !next && onClose()}
      >
        <DialogContent className="flex max-h-[min(85vh,820px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4 pr-12 text-left">
            <DialogTitle>Chi tiết yêu cầu kit</DialogTitle>
            <DialogDescription>
              Xử lý yêu cầu báo lỗi hoặc lắp đặt kit với owner.
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
              <KitRequestDetailMeta request={request} />
            )}
          </div>

          {request && hasAction && (
            <DialogFooter className="shrink-0 flex-row flex-wrap gap-2 border-t px-6 py-4 sm:justify-end">
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
              {isFaultInProgress && (
                <Button
                  type="button"
                  onClick={() => setResolveOpen(true)}
                >
                  Đánh dấu đã xử lý
                </Button>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {request && isInstallSchedule && (
        <>
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
        </>
      )}
    </>
  );
}
