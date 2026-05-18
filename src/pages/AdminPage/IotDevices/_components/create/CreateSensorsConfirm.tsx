import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SENSOR_TYPE_LABEL } from "@/constants/iotDeviceDisplay";
import type { SensorBatchFormType } from "./sensorBatchSchema";

interface Props {
  open: boolean;
  items: SensorBatchFormType["items"] | null;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function CreateSensorsConfirm({
  open,
  items,
  isPending,
  onCancel,
  onConfirm,
}: Props) {
  const summary =
    items && items.length > 0
      ? items
          .map(
            (i) =>
              `${SENSOR_TYPE_LABEL[i.sensorType] ?? i.sensorType} (${i.minValue}–${i.maxValue})`,
          )
          .join(", ")
      : "—";

  return (
    <ConfirmDialog
      open={open}
      title="Xác nhận tạo cảm biến?"
      description={`Sẽ tạo ${items?.length ?? 0} cảm biến: ${summary}. Sau khi tạo, cấu hình cảm biến của vi xử lý sẽ bị khóa và không thể chỉnh sửa.`}
      confirmLabel={isPending ? "Đang tạo..." : "Tạo cảm biến"}
      cancelLabel="Quay lại"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
