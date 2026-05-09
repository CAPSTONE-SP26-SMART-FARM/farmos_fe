import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { IotDeviceKitResType } from "@/schemaValidatation/iotKit";

interface AdminIotKitArchiveConfirmProps {
  kit: IotDeviceKitResType | null;
  mode: "archive" | "unarchive";
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function AdminIotKitArchiveConfirm({
  kit,
  mode,
  isPending,
  onCancel,
  onConfirm,
}: AdminIotKitArchiveConfirmProps) {
  if (!kit) return null;

  const isArchive = mode === "archive";
  return (
    <ConfirmDialog
      open={!!kit}
      title={isArchive ? "Lưu trữ bộ Kit này?" : "Bỏ lưu trữ bộ Kit này?"}
      description={
        isArchive
          ? `Bộ Kit ${kit.code} sẽ ẩn khỏi marketplace của Chủ trang trại. Đơn đã thanh toán không bị ảnh hưởng.`
          : `Bộ Kit ${kit.code} sẽ hiển thị lại trong marketplace của Chủ trang trại.`
      }
      confirmLabel={isPending ? "Đang xử lý..." : isArchive ? "Lưu trữ" : "Bỏ lưu trữ"}
      cancelLabel="Huỷ"
      variant={isArchive ? "destructive" : "default"}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
