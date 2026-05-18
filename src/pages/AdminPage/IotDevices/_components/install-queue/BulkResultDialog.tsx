import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { BulkActionResType } from "@/schemaValidatation/iotDeviceAdminOps";
import { SummaryStat } from "./SummaryStat";

interface Props {
  open: boolean;
  result: BulkActionResType | null;
  /**
   * Lookup label theo deviceId — page truyền vào để hiển thị mã kit thay vì
   * raw UUID (memory: feedback_no_raw_id_in_ui).
   */
  labelOf: (deviceId: string) => string;
  onClose: () => void;
}

export function BulkResultDialog({ open, result, labelOf, onClose }: Props) {
  if (!result) return null;
  const allOk = result.failureCount === 0;
  const failures = result.results.filter((r) => !r.ok);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !v && onClose()}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {allOk ? (
              <CheckCircle2
                className="h-5 w-5 text-emerald-600"
                aria-hidden
              />
            ) : (
              <AlertCircle
                className="h-5 w-5 text-amber-600"
                aria-hidden
              />
            )}
            Kết quả thao tác hàng loạt
          </DialogTitle>
          <DialogDescription>
            {allOk
              ? "Toàn bộ thiết bị đã được cập nhật thành công."
              : "Một số thiết bị không thể cập nhật. Xem chi tiết bên dưới."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <SummaryStat
            label="Tổng"
            value={result.total}
            tone="default"
          />
          <SummaryStat
            label="Thành công"
            value={result.successCount}
            tone="success"
          />
          <SummaryStat
            label="Thất bại"
            value={result.failureCount}
            tone="danger"
          />
        </div>

        {failures.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Thiết bị thất bại:</p>
            <ul className="max-h-60 space-y-1 overflow-y-auto rounded-md border bg-muted/30 p-2 text-sm">
              {failures.map((r) => (
                <li
                  key={r.deviceId}
                  className="flex flex-wrap items-center gap-2"
                >
                  <XCircle
                    className="h-3.5 w-3.5 shrink-0 text-destructive"
                    aria-hidden
                  />
                  <span className="font-mono font-medium">
                    {labelOf(r.deviceId)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {r.error ?? "Lỗi không xác định"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
