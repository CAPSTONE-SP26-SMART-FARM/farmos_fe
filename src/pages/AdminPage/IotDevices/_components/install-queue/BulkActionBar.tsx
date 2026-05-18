import type { LucideIcon } from "lucide-react";
import { Ban, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SecondaryAction {
  label: string;
  pendingLabel?: string;
  icon?: LucideIcon;
  onClick: () => void;
  isPending: boolean;
}

interface Props {
  selectedCount: number;
  totalCount: number;
  isPrimaryPending: boolean;
  primaryLabel: string;
  primaryPendingLabel?: string;
  primaryIcon?: LucideIcon;
  onClearSelection: () => void;
  onPrimary: () => void;
  secondary?: SecondaryAction;
}

export function BulkActionBar({
  selectedCount,
  totalCount,
  isPrimaryPending,
  primaryLabel,
  primaryPendingLabel = "Đang xử lý...",
  primaryIcon: PrimaryIcon = Truck,
  onClearSelection,
  onPrimary,
  secondary,
}: Props) {
  if (selectedCount === 0) return null;

  const isPending = isPrimaryPending || (secondary?.isPending ?? false);
  const SecondaryIcon = secondary?.icon ?? Ban;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center gap-3 px-4 py-3 md:px-6">
        <span className="text-sm">
          Đã chọn <strong>{selectedCount}</strong> / {totalCount} thiết bị
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          disabled={isPending}
        >
          <X className="mr-1 h-4 w-4" aria-hidden />
          Hủy chọn
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {secondary ? (
            <Button
              variant="outline"
              onClick={secondary.onClick}
              disabled={isPending}
            >
              <SecondaryIcon className="mr-1.5 h-4 w-4" aria-hidden />
              {secondary.isPending
                ? (secondary.pendingLabel ?? "Đang xử lý...")
                : secondary.label}
            </Button>
          ) : null}
          <Button onClick={onPrimary} disabled={isPending}>
            <PrimaryIcon className="mr-1.5 h-4 w-4" aria-hidden />
            {isPrimaryPending ? primaryPendingLabel : primaryLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
