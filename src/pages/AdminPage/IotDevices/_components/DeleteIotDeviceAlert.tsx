import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { IotDeviceResType } from "@/schemaValidatation/iotDevice";

interface Props {
  device: IotDeviceResType | null;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteIotDeviceAlert({
  device,
  isPending,
  onCancel,
  onConfirm,
}: Props) {
  const identity = device?.label ?? device?.deviceName ?? "";
  const hasOwner = !!device?.owner;
  const description = hasOwner
    ? `Thiết bị "${identity}" đang gán cho ${device?.owner?.name ?? "một chủ trang trại"}${
        device?.farm ? ` (${device.farm.name})` : ""
      }. Xóa sẽ gỡ liên kết và không thể hoàn tác.`
    : `Thiết bị "${identity}" sẽ bị xóa khỏi hệ thống. Hành động này không thể hoàn tác.`;

  return (
    <ConfirmDialog
      open={!!device}
      title="Xóa thiết bị IoT?"
      description={description}
      confirmLabel={isPending ? "Đang xóa..." : "Xóa"}
      cancelLabel="Hủy"
      variant="destructive"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
