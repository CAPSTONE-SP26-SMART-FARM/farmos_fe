import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { ReportFaultDialog } from "./ReportFaultDialog";
import type { DeviceStatusType } from "@/schemaValidatation/iotDevice";

/**
 * Button "Báo lỗi" — chèn vào trang detail thiết bị IoT (owner / manager).
 * Tự quản state open của dialog → caller chỉ cần truyền `iotDeviceId` +
 * `deviceLabel` để hiển thị.
 *
 * Disable khi device.status ∈ {available, revoked} — thiết bị chưa thuộc
 * owner (kho) hoặc đã trả về kho — không có lý do để báo lỗi.
 */

interface ReportFaultButtonProps {
  iotDeviceId: string;
  deviceLabel?: string;
  deviceStatus?: DeviceStatusType;
  variant?: "default" | "outline" | "secondary";
  size?: "sm" | "default";
  className?: string;
}

const NON_REPORTABLE_STATUSES: DeviceStatusType[] = ["available", "revoked"];

export function ReportFaultButton({
  iotDeviceId,
  deviceLabel,
  deviceStatus,
  variant = "outline",
  size = "sm",
  className,
}: ReportFaultButtonProps) {
  const [open, setOpen] = useState(false);

  const disabled =
    !iotDeviceId ||
    (deviceStatus !== undefined &&
      NON_REPORTABLE_STATUSES.includes(deviceStatus));

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={className}
      >
        <AlertTriangle className="mr-1.5 h-4 w-4" aria-hidden />
        Báo lỗi
      </Button>
      <ReportFaultDialog
        open={open}
        onOpenChange={setOpen}
        iotDeviceId={iotDeviceId}
        deviceLabel={deviceLabel}
      />
    </>
  );
}
