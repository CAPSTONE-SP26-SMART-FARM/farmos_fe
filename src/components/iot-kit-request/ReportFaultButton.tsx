import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { ReportFaultDialog } from "./ReportFaultDialog";
import type { DeviceStatusType } from "@/schemaValidatation/iotDevice";

/**
 * Button "Báo lỗi" — chèn vào trang detail thiết bị IoT (owner / manager).
 *
 * Guard:
 *   - `error`: cron sensor-health-monitor đã flip → cho báo (case active hỏng).
 *   - `inactive`: kit đã lắp xong mà bật không lên → cho báo (BE tự flip → error,
 *     nhưng chỉ pass khi vụ mùa đang diễn ra; BE trả 422 nếu vụ mùa chưa active).
 *   - Các status khác: chặn (chưa lắp / đang hoạt động OK / đã thu hồi).
 */

interface ReportFaultButtonProps {
  iotDeviceId: string;
  deviceLabel?: string;
  deviceStatus?: DeviceStatusType;
  variant?: "default" | "outline" | "secondary";
  size?: "sm" | "default";
  className?: string;
}

function explainReason(status: DeviceStatusType | undefined): string | null {
  if (status === undefined) return null;
  if (status === "error" || status === "inactive") return null;
  if (status === "available")
    return "Thiết bị còn trong kho, chưa thuê — không thể báo lỗi.";
  if (status === "revoked")
    return "Thiết bị đã thu hồi về kho — không thể báo lỗi.";
  if (status === "active")
    return "Thiết bị đang hoạt động bình thường. Hệ thống sẽ tự phát hiện sự cố — nếu thiết bị hỏng, chờ vài phút để hệ thống cập nhật trạng thái.";
  if (status === "install" || status === "purchase")
    return "Thiết bị chưa lắp xong — chưa thể báo lỗi.";
  return "Chỉ báo lỗi khi hệ thống đã phát hiện thiết bị gặp sự cố.";
}

export function ReportFaultButton({
  iotDeviceId,
  deviceLabel,
  deviceStatus,
  variant = "outline",
  size = "sm",
  className,
}: ReportFaultButtonProps) {
  const [open, setOpen] = useState(false);

  // Whitelist: status `error` (cron đã flip) hoặc `inactive` (kit bật ko lên,
  // BE validate vụ mùa đang diễn ra rồi tự flip → error). Parent không truyền
  // status → vẫn cho click để không phá flow cũ.
  const disabled =
    !iotDeviceId ||
    (deviceStatus !== undefined &&
      deviceStatus !== "error" &&
      deviceStatus !== "inactive");
  const reason = disabled ? explainReason(deviceStatus) : null;

  const button = (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled}
      onClick={() => setOpen(true)}
      className={className}
      aria-label={
        disabled ? "Không thể báo lỗi — xem lý do" : "Báo lỗi thiết bị"
      }
    >
      <AlertTriangle
        className="mr-1.5 h-4 w-4"
        aria-hidden="true"
      />
      Báo lỗi
    </Button>
  );

  return (
    <>
      {reason ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {/* span wrapper để tooltip vẫn nhận hover khi button disabled */}
              <span tabIndex={0}>{button}</span>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-xs text-sm"
            >
              {reason}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        button
      )}

      <ReportFaultDialog
        open={open}
        onOpenChange={setOpen}
        iotDeviceId={iotDeviceId}
        deviceLabel={deviceLabel}
      />
    </>
  );
}
