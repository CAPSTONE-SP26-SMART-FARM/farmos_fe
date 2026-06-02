import { useState } from "react";
import { PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCreateInstallSchedule } from "@/queries/useIotKitRequest";

type Variant = "default" | "outline" | "secondary" | "ghost";
type Size = "default" | "sm" | "lg" | "icon";

interface Props {
  /** Lắp cho milestone vừa thu hồi xong → BE tự resolve giai đoạn kế. */
  afterMilestoneId?: string;
  /** Hoặc chỉ định thẳng milestone cần lắp. */
  milestoneId?: string;
  label?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  onSuccess?: () => void;
}

/**
 * Nút "Lên lịch lắp giai đoạn kế" — owner/admin bấm SAU KHI thu hồi giai đoạn
 * trước. Tạo INSTALL_SCHEDULE (pending); chốt giờ hẹn sau qua "Lên lịch lắp".
 * BE chặn nếu recovery giai đoạn trước chưa resolved (toast lỗi rõ ràng).
 */
export function ScheduleNextInstallButton({
  afterMilestoneId,
  milestoneId,
  label = "Lên lịch lắp giai đoạn kế",
  variant = "default",
  size = "sm",
  className,
  onSuccess,
}: Props) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateInstallSchedule();

  const handleConfirm = () => {
    const body = afterMilestoneId
      ? { afterMilestoneId }
      : { milestoneId: milestoneId ?? "" };
    mutate(body, {
      onSuccess: () => {
        setOpen(false);
        onSuccess?.();
      },
    });
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        <PackagePlus className="h-4 w-4" />
        {label}
      </Button>
      <ConfirmDialog
        open={open}
        title="Lên lịch lắp đặt giai đoạn kế tiếp?"
        description="Hệ thống sẽ tạo yêu cầu lắp đặt thiết bị cho giai đoạn kế tiếp, quản trị viên sẽ tiến hành lắp đặt. Bạn có thể chốt giờ hẹn sau ở mục Lên lịch lắp."
        confirmLabel={isPending ? "Đang tạo..." : "Tạo lịch lắp"}
        cancelLabel="Quay lại"
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
