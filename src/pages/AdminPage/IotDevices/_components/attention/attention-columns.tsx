import type { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import type { AttentionItemType } from "@/schemaValidatation/iotDeviceAdminOps";
import { AttentionKindBadge } from "./AttentionKindBadge";
import {
  formatDaysInState,
  formatVietnameseDateTime,
  translateReason,
} from "./attention-helpers";

interface BuildColumnsParams {
  selectedIds: Set<string>;
  selectableIds: string[];
  allSelected: boolean;
  onToggleOne: (id: string) => void;
  onToggleAll: () => void;
}

export function buildAttentionColumns({
  selectedIds,
  selectableIds,
  allSelected,
  onToggleOne,
  onToggleAll,
}: BuildColumnsParams): ColumnDef<AttentionItemType, unknown>[] {
  return [
    {
      id: "__select__",
      header: () => (
        <Checkbox
          checked={allSelected}
          onCheckedChange={onToggleAll}
          disabled={selectableIds.length === 0}
          aria-label="Chọn tất cả thiết bị chờ về kho trên trang"
        />
      ),
      cell: ({ row }) => {
        const item = row.original;
        const selectable = item.kind === "swap_pending_return";
        return (
          <Checkbox
            checked={selectedIds.has(item.deviceId)}
            onCheckedChange={() => onToggleOne(item.deviceId)}
            disabled={!selectable}
            aria-label={`Chọn thiết bị ${item.deviceLabel ?? item.deviceName}`}
          />
        );
      },
    },
    {
      id: "device",
      header: "Mã thiết bị",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.deviceLabel ?? row.original.deviceName}
        </div>
      ),
    },
    {
      id: "kind",
      header: "Tình trạng",
      cell: ({ row }) => <AttentionKindBadge kind={row.original.kind} />,
    },
    {
      id: "owner",
      header: "Chủ trang trại",
      cell: ({ row }) => (
        <div>
          <div>{row.original.ownerName ?? "—"}</div>
          {row.original.ownerPhone && (
            <div className="text-muted-foreground text-xs">
              {row.original.ownerPhone}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "farm",
      header: "Trang trại",
      cell: ({ row }) =>
        row.original.farmName ? (
          <div>
            <div>{row.original.farmName}</div>
            {row.original.farmAddress && (
              <div className="text-muted-foreground text-xs">
                {row.original.farmAddress}
              </div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "context",
      header: "Nguyên nhân / bối cảnh",
      cell: ({ row }) => (
        <div className="max-w-65 text-xs whitespace-normal">
          {buildContextText(row.original)}
        </div>
      ),
    },
    {
      id: "daysInState",
      header: () => <div className="text-right">Số ngày treo</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {formatDaysInState(row.original.daysInState)}
        </div>
      ),
    },
  ];
}

function buildContextText(item: AttentionItemType): string {
  if (item.kind === "error") {
    const reason = translateReason(item.errorContext?.lastReason ?? null);
    if (item.errorContext?.hasActiveMilestoneAssignment) {
      return `${reason} · Đang gắn vào giai đoạn canh tác`;
    }
    return reason;
  }
  const swappedAt = formatVietnameseDateTime(
    item.swapContext?.swappedAt ?? null,
  );
  return `Đã thay tại hiện trường lúc ${swappedAt}`;
}
