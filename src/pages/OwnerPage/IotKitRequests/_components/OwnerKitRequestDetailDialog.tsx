import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { KitRequestDetailMeta } from "@/components/iot-kit-request/KitRequestDetailMeta";
import {
  useKitRequestDetail,
  useReportOverdue,
} from "@/queries/useIotKitRequest";
import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { AlertTriangle } from "lucide-react";
import { CancelRequestDialog } from "./OwnerKitRequestDialogs";

/**
 * Dialog trung tâm cho chi tiết kit request (owner).
 * Dùng Dialog thay Sheet để tránh scroll lồng / overlay đè lên Card trên trang list.
 *
 * Action panel theo state machine (rule 09):
 *   - FAULT_REPORT do mình tạo còn pending → "Hủy yêu cầu"
 *   - INSTALL_SCHEDULE → readonly hoàn toàn (auto-create từ approve season)
 *   - Trạng thái terminal → readonly
 *   - Mọi loại có slaDeadline đã qua hạn + chưa terminal + chưa báo →
 *     "Báo quá hạn"
 */

const TERMINAL = ["resolved", "rejected", "cancelled"];

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
  const [overdueOpen, setOverdueOpen] = useState(false);

  const isMyOpenFault =
    request?.direction === "OWNER_TO_ADMIN" &&
    request?.type === "FAULT_REPORT" &&
    request?.status === "pending";

  const overdueReportedAt = request?.metadata?.ownerOverdueReportedAt ?? null;
  const overdueReason = request?.metadata?.ownerOverdueReason ?? null;
  const isTerminal = request ? TERMINAL.includes(request.status) : false;
  const canReportOverdue =
    !!request &&
    !!request.slaDeadline &&
    !isTerminal &&
    new Date(request.slaDeadline).getTime() < Date.now() &&
    !overdueReportedAt;

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
              Thông tin trao đổi giữa bạn và quản trị viên về thiết bị.
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
                <KitRequestDetailMeta request={request} />
                {overdueReportedAt && (
                  <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                    <div className="flex items-center gap-2 font-medium text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      Đã báo quá hạn lúc{" "}
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
              </>
            )}
          </div>

          {request && (isMyOpenFault || canReportOverdue) && (
            <DialogFooter className="shrink-0 border-t px-6 py-4 sm:justify-end">
              {canReportOverdue && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setOverdueOpen(true)}
                >
                  <AlertTriangle className="h-4 w-4" />
                  Báo quá hạn
                </Button>
              )}
              {isMyOpenFault && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setCancelOpen(true)}
                >
                  Hủy yêu cầu
                </Button>
              )}
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
      {request && (
        <ReportOverdueDialog
          open={overdueOpen}
          requestId={request.id}
          onClose={() => setOverdueOpen(false)}
        />
      )}
    </>
  );
}

interface ReportOverdueDialogProps {
  open: boolean;
  requestId: string;
  onClose: () => void;
}

function ReportOverdueDialog({
  open,
  requestId,
  onClose,
}: ReportOverdueDialogProps) {
  const [reason, setReason] = useState("");
  const { mutate, isPending } = useReportOverdue();

  const handleConfirm = () => {
    mutate(
      { id: requestId, body: reason.trim() ? { reason: reason.trim() } : {} },
      {
        onSuccess: () => {
          setReason("");
          onClose();
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next: boolean) => {
        if (!next) {
          setReason("");
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Báo yêu cầu đã quá hạn?</DialogTitle>
          <DialogDescription>
            Quản trị viên sẽ nhận thông báo và ưu tiên xử lý. Chỉ báo được 1
            lần cho mỗi yêu cầu.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="overdue-reason">
            Lý do{" "}
            <span className="text-xs text-muted-foreground">(không bắt buộc)</span>
          </FieldLabel>
          <Textarea
            id="overdue-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="vd: Chưa thấy kỹ thuật viên liên hệ, vụ mùa sắp gieo..."
            maxLength={500}
            rows={3}
          />
        </Field>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setReason("");
              onClose();
            }}
            disabled={isPending}
          >
            Quay lại
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending ? "Đang gửi..." : "Báo quá hạn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
