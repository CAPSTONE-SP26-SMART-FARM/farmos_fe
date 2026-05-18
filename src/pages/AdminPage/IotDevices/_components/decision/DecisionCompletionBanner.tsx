import { CheckCircle2, X } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export type DecisionCompletedAction = "swap" | "revoke";

interface Props {
  action: DecisionCompletedAction;
  deviceId: string;
  onDismiss: () => void;
}

const MESSAGES: Record<DecisionCompletedAction, { title: string; body: string }> =
  {
    swap: {
      title: "Đã thay vi xử lý thành công",
      body: "Thiết bị mới đã nhận kết nối. Kiểm tra lịch sử hoặc quay về danh sách.",
    },
    revoke: {
      title: "Đã gỡ phân bổ chủ trang trại",
      body: "Thiết bị không còn gắn với chủ trang trại. Có thể gán lại từ danh sách thiết bị.",
    },
  };

export function DecisionCompletionBanner({
  action,
  deviceId,
  onDismiss,
}: Props) {
  const msg = MESSAGES[action];

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex gap-2">
        <CheckCircle2
          className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400"
          aria-hidden
        />
        <div>
          <p className="font-medium text-emerald-900 dark:text-emerald-100">
            {msg.title}
          </p>
          <p className="text-sm text-emerald-800/90 dark:text-emerald-200/90">
            {msg.body}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          asChild
          size="sm"
          variant="outline"
          className="border-emerald-300 bg-background"
        >
          <Link to={`/dashboard/admin/iot-devices/${deviceId}/timeline`}>
            Xem lịch sử
          </Link>
        </Button>
        <Button
          asChild
          size="sm"
        >
          <Link to="/dashboard/admin/iot-devices">Về danh sách</Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onDismiss}
          aria-label="Đóng thông báo"
        >
          <X
            className="h-4 w-4"
            aria-hidden
          />
        </Button>
      </div>
    </div>
  );
}
