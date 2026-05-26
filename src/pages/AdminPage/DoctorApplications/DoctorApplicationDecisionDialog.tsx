import { AlertTriangle, CalendarClock, Info } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { cn, isApiErrorResponse } from "@/lib/utils";
import {
  RegistrationStatusName,
  type RegistrationStatusNameType,
} from "@/constants/profile";
import {
  useAdminChangeStatusDoctorRequest,
  useAdminDoctorRequestDetail,
} from "@/queries/useAdmin";
import { REGISTRATION_STATUS_META } from "./statusMeta";
import { formatDateTime, initialsOf } from "./doctorApplicationHelpers";
import {
  DecisionActionCards,
  getAllowedTransitions,
  type DecisionStatus,
} from "./components/DoctorApplicationActions";

interface Props {
  id?: string;
  onClose: () => void;
}

const STATUS_HINT: Record<RegistrationStatusNameType, string> = {
  [RegistrationStatusName.Pending]:
    "Đơn đang chờ xét duyệt. Hãy duyệt nếu hồ sơ hợp lệ hoặc từ chối kèm lý do rõ ràng.",
  [RegistrationStatusName.Approved]:
    "Người dùng đang hoạt động với vai trò bác sĩ. Có thể tạm ngưng nếu phát hiện vi phạm.",
  [RegistrationStatusName.Rejected]:
    "Đơn đã bị từ chối trước đó. Có thể duyệt lại nếu hồ sơ đã được bổ sung.",
  [RegistrationStatusName.Suspended]:
    "Tài khoản đang bị tạm ngưng. Cho phép hoạt động lại khi đã xử lý xong.",
};

const HINT_TONE: Record<RegistrationStatusNameType, string> = {
  [RegistrationStatusName.Pending]:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
  [RegistrationStatusName.Approved]:
    "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
  [RegistrationStatusName.Rejected]:
    "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
  [RegistrationStatusName.Suspended]:
    "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-200",
};

const DoctorApplicationDecisionDialog = ({ id, onClose }: Props) => {
  const open = Boolean(id);
  const detailQuery = useAdminDoctorRequestDetail(id ?? "", open);
  const mutation = useAdminChangeStatusDoctorRequest();

  const request = open ? detailQuery.data?.data : undefined;
  const currentMeta = request
    ? REGISTRATION_STATUS_META[request.registrationStatus]
    : undefined;
  const allowedActions = request
    ? getAllowedTransitions(request.registrationStatus)
    : [];

  const handleAction = async (status: DecisionStatus, reason: string) => {
    if (!id) return;
    try {
      await mutation.mutateAsync({
        id,
        status,
        reason: reason || undefined,
      });
      const meta = REGISTRATION_STATUS_META[status];
      toast.success(`Đã cập nhật trạng thái: ${meta.label}`);
      onClose();
    } catch (error) {
      if (isApiErrorResponse(error)) {
        toast.error(
          error.response?.data.message ?? "Cập nhật trạng thái thất bại",
        );
        return;
      }
      toast.error("Cập nhật trạng thái thất bại");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-1.5">
          <DialogTitle>Quyết định đơn xin làm bác sĩ</DialogTitle>
          <DialogDescription>
            Kiểm tra trạng thái hiện tại và chọn hành động phù hợp.
          </DialogDescription>
        </DialogHeader>

        {detailQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : detailQuery.isError ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-center text-destructive">
            <AlertTriangle className="mx-auto mb-2 h-6 w-6" aria-hidden="true" />
            <div className="font-medium">Không thể tải dữ liệu đơn.</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Vui lòng đóng và thử lại sau.
            </div>
          </div>
        ) : !request ? (
          <div className="text-center text-muted-foreground py-8">
            Không tìm thấy đơn này.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3.5">
              <div className="flex items-start gap-3">
                <Avatar className="h-11 w-11 shrink-0">
                  <AvatarFallback>
                    {initialsOf(request.user.fullName, request.user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-semibold leading-tight">
                      {request.user.fullName ?? "—"}
                    </div>
                    {currentMeta && (
                      <Badge
                        variant={currentMeta.variant}
                        className={cn("shrink-0", currentMeta.className)}
                      >
                        <currentMeta.icon
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        {currentMeta.label}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {request.user.email}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarClock
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                    <span>Gửi lúc {formatDateTime(request.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "flex items-start gap-2 rounded-md border px-3 py-2.5 text-xs leading-relaxed",
                HINT_TONE[request.registrationStatus],
              )}
            >
              <Info
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />
              <span>{STATUS_HINT[request.registrationStatus]}</span>
            </div>

            {allowedActions.length === 0 ? (
              <div className="rounded-md border border-dashed bg-muted/20 px-3 py-6 text-center text-sm text-muted-foreground">
                Trạng thái hiện tại không còn hành động khả dụng.
              </div>
            ) : (
              <div>
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Hành động khả dụng
                </div>
                <DecisionActionCards
                  isPending={mutation.isPending}
                  currentStatus={request.registrationStatus}
                  onAction={handleAction}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorApplicationDecisionDialog;
