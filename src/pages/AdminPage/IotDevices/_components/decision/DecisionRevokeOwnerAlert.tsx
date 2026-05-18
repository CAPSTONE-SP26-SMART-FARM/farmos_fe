import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Props {
  open: boolean;
  deviceLabel: string;
  ownerName: string | null;
  milestoneCount: number;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DecisionRevokeOwnerAlert({
  open,
  deviceLabel,
  ownerName,
  milestoneCount,
  isPending,
  onCancel,
  onConfirm,
}: Props) {
  const ownerPart = ownerName ? ` khỏi ${ownerName}` : "";
  const milestonePart =
    milestoneCount > 0
      ? ` ${milestoneCount} mùa vụ đang gắn sẽ mất liên kết.`
      : "";
  return (
    <ConfirmDialog
      open={open}
      variant="destructive"
      title="Gỡ phân bổ chủ trang trại khỏi thiết bị?"
      description={`Thiết bị "${deviceLabel}" sẽ bị gỡ${ownerPart}.${milestonePart} Hành động không thể hoàn tác.`}
      confirmLabel={isPending ? "Đang xử lý..." : "Xác nhận gỡ phân bổ"}
      cancelLabel="Hủy"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
