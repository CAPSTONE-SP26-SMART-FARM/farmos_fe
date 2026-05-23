import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  selectedCount: number;
  isPending: boolean;
  onClear: () => void;
  onConfirm: () => void;
}

export function AttentionBulkBar({
  selectedCount,
  isPending,
  onClear,
  onConfirm,
}: Props) {
  if (selectedCount === 0) return null;
  return (
    <div className="bg-muted/50 flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
      <span className="text-sm">
        Đã chọn <b>{selectedCount}</b> thiết bị để xác nhận thu hồi
      </span>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={isPending}
        >
          Bỏ chọn
        </Button>
        <Button size="sm" onClick={onConfirm} disabled={isPending}>
          {isPending ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
          )}
          {isPending ? "Đang lưu..." : "Xác nhận đã thu hồi"}
        </Button>
      </div>
    </div>
  );
}
