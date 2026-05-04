import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RegistrationStatusName } from "@/constants/profile";
import type { UpdateDoctorRequestStatusBodyType } from "@/schemaValidatation/doctorProfile";
import { REGISTRATION_STATUS_META } from "../statusMeta";

interface QuickApproveSuspendButtonsProps {
  isPending: boolean;
  currentStatus: string;
  onAction: (s: UpdateDoctorRequestStatusBodyType["status"]) => void;
}

export const QuickApproveSuspendButtons = ({
  isPending,
  currentStatus,
  onAction,
}: QuickApproveSuspendButtonsProps) => {
  const isApproved = currentStatus === RegistrationStatusName.Approved;
  const [confirm, setConfirm] = useState<
    UpdateDoctorRequestStatusBodyType["status"] | null
  >(null);

  return (
    <>
      {isApproved ? (
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => onAction(RegistrationStatusName.Suspended)}
        >
          Tạm ngưng
        </Button>
      ) : (
        <>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={() => setConfirm(RegistrationStatusName.Rejected)}
          >
            Từ chối
          </Button>
          <Button
            type="button"
            disabled={isPending}
            className="bg-emerald-600 text-white hover:bg-emerald-600/90"
            onClick={() => onAction(RegistrationStatusName.Approved)}
          >
            {isPending ? "Đang xử lý..." : "Duyệt đơn"}
          </Button>
        </>
      )}
      {confirm && (
        <ConfirmInline
          status={confirm}
          onConfirm={() => {
            onAction(confirm);
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
};

const ConfirmInline = ({
  status,
  onConfirm,
  onCancel,
}: {
  status: UpdateDoctorRequestStatusBodyType["status"];
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  const meta = REGISTRATION_STATUS_META[status];
  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Xác nhận {meta.label.toLowerCase()}</DialogTitle>
          <DialogDescription>
            Hành động này sẽ cập nhật trạng thái đơn và thông báo đến người
            dùng. Hãy đảm bảo bạn đã ghi rõ lý do nếu cần.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button
            variant={status === RegistrationStatusName.Rejected ? "destructive" : "default"}
            onClick={onConfirm}
          >
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
