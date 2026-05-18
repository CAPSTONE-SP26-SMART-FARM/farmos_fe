import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PreviewItem {
  id: string;
  label: string;
  ownerName: string;
}

interface Props {
  open: boolean;
  count: number;
  preview: PreviewItem[];
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const PREVIEW_MAX = 5;

export function BulkConfirmDialog({
  open,
  count,
  preview,
  isPending,
  onCancel,
  onConfirm,
}: Props) {
  const previewItems = preview.slice(0, PREVIEW_MAX);
  const remaining = Math.max(0, count - previewItems.length);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !v && onCancel()}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Đánh dấu Đang lắp đặt?</DialogTitle>
          <DialogDescription>
            {count} thiết bị sẽ chuyển sang trạng thái{" "}
            <strong>Đang lắp đặt</strong>. Hệ thống gửi thông báo đến từng chủ
            trang trại tương ứng.
          </DialogDescription>
        </DialogHeader>

        {previewItems.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Xem trước:</p>
            <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md border bg-muted/30 p-2 text-sm">
              {previewItems.map((it) => (
                <li
                  key={it.id}
                  className="flex flex-wrap items-center gap-2"
                >
                  <span className="font-mono font-medium">{it.label}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{it.ownerName}</span>
                </li>
              ))}
            </ul>
            {remaining > 0 && (
              <p className="text-xs text-muted-foreground">
                ... và {remaining} thiết bị khác.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Hủy
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
