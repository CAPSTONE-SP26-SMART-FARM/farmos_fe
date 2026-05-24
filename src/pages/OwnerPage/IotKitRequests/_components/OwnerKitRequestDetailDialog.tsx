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
import { useState } from "react";
import { CancelRequestDialog } from "./OwnerKitRequestDialogs";

/**
 * Dialog trung tâm cho chi tiết kit request (owner).
 * Dùng Dialog thay Sheet để tránh scroll lồng / overlay đè lên Card trên trang list.
 *
 * Action panel theo state machine (rule 09):
 *   - FAULT_REPORT do mình tạo còn pending → "Hủy yêu cầu"
 *   - INSTALL_SCHEDULE → readonly hoàn toàn (auto-create từ approve season)
 *   - Trạng thái terminal → readonly
 */

interface Props {
  requestId: string | null;
  onClose: () => void;
}

export function OwnerKitRequestDetailDialog({ requestId, onClose }: Props) {
  const open = !!requestId;
  const { data, isLoading, isError } = useKitRequestDetail(
    requestId ?? "",
    !!requestId,
  );

  const request = data?.data;
  const [cancelOpen, setCancelOpen] = useState(false);

  const isMyOpenFault =
    request?.direction === "OWNER_TO_ADMIN" &&
    request?.type === "FAULT_REPORT" &&
    request?.status === "pending";

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
              Thông tin trao đổi giữa bạn và quản trị viên về thiết bị IoT.
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

          {request && isMyOpenFault && (
            <DialogFooter className="shrink-0 border-t px-6 py-4 sm:justify-end">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setCancelOpen(true)}
              >
                Hủy yêu cầu
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {request && (
        <CancelRequestDialog
          open={cancelOpen}
          requestId={request.id}
          onClose={() => setCancelOpen(false)}
        />
      )}
    </>
  );
}
