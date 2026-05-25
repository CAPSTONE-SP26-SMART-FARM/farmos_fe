import { AlertTriangle } from "lucide-react";
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
import { isApiErrorResponse } from "@/lib/utils";
import {
  useAdminChangeStatusDoctorRequest,
  useAdminDoctorRequestDetail,
} from "@/queries/useAdmin";
import { REGISTRATION_STATUS_META } from "./statusMeta";
import { initialsOf } from "./doctorApplicationHelpers";
import {
  DecisionButtons,
  type DecisionStatus,
} from "./components/DoctorApplicationActions";

interface Props {
  id?: string;
  onClose: () => void;
}

const DoctorApplicationDecisionDialog = ({ id, onClose }: Props) => {
  const open = Boolean(id);
  const detailQuery = useAdminDoctorRequestDetail(id ?? "", open);
  const mutation = useAdminChangeStatusDoctorRequest();

  const request = open ? detailQuery.data?.data : undefined;
  const currentMeta = request
    ? REGISTRATION_STATUS_META[request.registrationStatus]
    : undefined;

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
        <DialogHeader>
          <DialogTitle>Quyết định đơn xin làm bác sĩ</DialogTitle>
          <DialogDescription>
            Chọn hành động phù hợp với trạng thái hiện tại của đơn.
          </DialogDescription>
        </DialogHeader>

        {detailQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : detailQuery.isError ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-center text-destructive">
            <AlertTriangle className="mx-auto mb-2 h-6 w-6" />
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
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {initialsOf(request.user.fullName, request.user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="leading-tight min-w-0">
                  <div className="truncate font-medium">
                    {request.user.fullName ?? "—"}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {request.user.email}
                  </div>
                </div>
              </div>
              {currentMeta && (
                <Badge
                  variant={currentMeta.variant}
                  className={currentMeta.className}
                >
                  <currentMeta.icon className="h-3.5 w-3.5" />
                  {currentMeta.label}
                </Badge>
              )}
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">Hành động</div>
              <DecisionButtons
                isPending={mutation.isPending}
                currentStatus={request.registrationStatus}
                onAction={handleAction}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
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
