import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, UserMinus, X } from "lucide-react";

interface Props {
  selectedCount: number;
  hasAssignedSelection: boolean;
  allSelected: boolean;
  isPending: boolean;
  onToggleAll: () => void;
  onClear: () => void;
  onRequestDelete: () => void;
  onRequestUnassign: () => void;
}

export function MilestoneTasksBulkActionBar({
  selectedCount,
  hasAssignedSelection,
  allSelected,
  isPending,
  onToggleAll,
  onClear,
  onRequestDelete,
  onRequestUnassign,
}: Props) {
  return (
    <div
      role="region"
      aria-label="Thao tác hàng loạt"
      className="sticky bottom-2 z-20 flex flex-wrap items-center gap-3 rounded-md border bg-background/95 px-3 py-2 shadow-md backdrop-blur"
    >
      <label className="flex items-center gap-2 text-xs">
        <Checkbox
          checked={allSelected}
          onCheckedChange={onToggleAll}
          disabled={isPending}
          aria-label="Chọn tất cả nhiệm vụ trên trang"
        />
        <span>Chọn tất cả trên trang</span>
      </label>
      <span className="text-xs font-medium">
        Đã chọn {selectedCount} nhiệm vụ
      </span>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          disabled={isPending || !hasAssignedSelection}
          onClick={onRequestUnassign}
        >
          <UserMinus className="mr-1 h-3.5 w-3.5" />
          Hủy gán đã chọn
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="h-7 text-xs"
          disabled={isPending}
          onClick={onRequestDelete}
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          Xóa đã chọn
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          disabled={isPending}
          onClick={onClear}
          aria-label="Bỏ chọn tất cả"
        >
          <X className="mr-1 h-3.5 w-3.5" />
          Bỏ chọn
        </Button>
      </div>
    </div>
  );
}
