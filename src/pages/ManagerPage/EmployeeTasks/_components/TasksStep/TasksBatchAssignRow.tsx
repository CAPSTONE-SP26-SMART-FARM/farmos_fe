import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EligibleFarmerResType } from "@/schemaValidatation/employeeTask";
import { Trash2, UserPlus, X } from "lucide-react";

interface Props {
  selectedCount: number;
  farmers: EligibleFarmerResType[];
  selectedFarmerId: string;
  onFarmerChange: (farmerId: string) => void;
  onAssign: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  isAssignPending: boolean;
  isDeletePending: boolean;
}

function TasksBatchAssignRow({
  selectedCount,
  farmers,
  selectedFarmerId,
  onFarmerChange,
  onAssign,
  onBulkDelete,
  onClearSelection,
  isAssignPending,
  isDeletePending,
}: Props) {
  if (selectedCount === 0) return null;

  const isPending = isAssignPending || isDeletePending;
  const canAssign = !!selectedFarmerId && !isPending;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-primary/5 p-3">
      <span className="text-sm font-medium">
        Đã chọn {selectedCount} nhiệm vụ
      </span>

      <Select
        value={selectedFarmerId}
        onValueChange={onFarmerChange}
      >
        <SelectTrigger
          className="h-9 w-[220px]"
          aria-label="Chọn người làm cho các nhiệm vụ đã chọn"
        >
          <SelectValue placeholder="Chọn người làm" />
        </SelectTrigger>
        <SelectContent>
          {farmers.length === 0 ? (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              Chưa có nông dân nào đủ điều kiện
            </div>
          ) : (
            farmers.map((f) => (
              <SelectItem
                key={f.userId}
                value={f.userId}
              >
                {f.fullName}
                {f.phone ? ` · ${f.phone}` : ""}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      <Button
        type="button"
        size="sm"
        disabled={!canAssign}
        onClick={onAssign}
      >
        <UserPlus
          className="mr-1 h-4 w-4"
          aria-hidden="true"
        />
        {isAssignPending ? "Đang gán..." : `Gán ${selectedCount} nhiệm vụ`}
      </Button>

      <Button
        type="button"
        size="sm"
        variant="destructive"
        disabled={isPending}
        onClick={onBulkDelete}
      >
        <Trash2
          className="mr-1 h-4 w-4"
          aria-hidden="true"
        />
        {isDeletePending ? "Đang xóa..." : `Xóa ${selectedCount} nhiệm vụ`}
      </Button>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onClearSelection}
        disabled={isPending}
      >
        <X
          className="mr-1 h-3.5 w-3.5"
          aria-hidden="true"
        />
        Bỏ chọn
      </Button>
    </div>
  );
}

export default TasksBatchAssignRow;
