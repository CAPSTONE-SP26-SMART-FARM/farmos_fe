import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Props {
  open: boolean;
  count: number;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function CancelBatchAlert({
  open,
  count,
  isPending,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <ConfirmDialog
      open={open}
      title="Hủy lô thiết bị?"
      description={`Hệ thống sẽ xóa ${count} thiết bị vừa tạo (vi xử lý, mô-đun WiFi, mô-đun LoRa) khỏi danh sách. Nếu xóa lỗi giữa chừng, một số thiết bị có thể còn lại trong hệ thống — bạn cần kiểm tra lại. Hành động này không thể hoàn tác.`}
      confirmLabel={isPending ? "Đang xóa..." : `Xóa ${count} thiết bị`}
      cancelLabel="Tiếp tục chỉnh sửa"
      variant="destructive"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
