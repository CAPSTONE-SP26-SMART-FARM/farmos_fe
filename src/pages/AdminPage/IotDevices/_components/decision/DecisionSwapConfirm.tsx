import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { SwapCandidateType } from "@/schemaValidatation/iotDeviceAdminOps";

interface Props {
  open: boolean;
  deviceLabel: string;
  candidate: SwapCandidateType | null;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DecisionSwapConfirm({
  open,
  deviceLabel,
  candidate,
  isPending,
  onCancel,
  onConfirm,
}: Props) {
  const candidateLabel = candidate?.label ?? "—";
  return (
    <ConfirmDialog
      open={open}
      title="Xác nhận thay thế thiết bị?"
      description={`Vi xử lý "${deviceLabel}" sẽ được thay bằng "${candidateLabel}". Hệ thống chuyển toàn bộ kết nối sang vi xử lý mới và đặt vi xử lý cũ về trạng thái thu hồi. Hành động không thể hoàn tác.`}
      confirmLabel={isPending ? "Đang xử lý..." : "Xác nhận thay thế"}
      cancelLabel="Hủy"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
