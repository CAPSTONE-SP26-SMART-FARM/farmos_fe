import { ArrowUpDown } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_LABEL, type SortKey } from "./constants";

interface Props {
  totalDeviceCount: number;
  allSelected: boolean;
  sortKey: SortKey;
  onToggleSelectAll: () => void;
  onSortChange: (key: SortKey) => void;
}

export function InstallQueueToolbar({
  totalDeviceCount,
  allSelected,
  sortKey,
  onToggleSelectAll,
  onSortChange,
}: Props) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-end gap-3 p-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="select-all-queue"
            checked={allSelected}
            onCheckedChange={onToggleSelectAll}
            aria-label="Chọn toàn bộ thiết bị"
            disabled={totalDeviceCount === 0}
          />
          <label
            htmlFor="select-all-queue"
            className="text-sm font-medium"
          >
            Chọn toàn bộ ({totalDeviceCount})
          </label>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ArrowUpDown
            className="h-4 w-4 text-muted-foreground"
            aria-hidden
          />
          <span className="text-sm text-muted-foreground">Sắp xếp:</span>
          <Select
            value={sortKey}
            onValueChange={(v) => onSortChange(v as SortKey)}
          >
            <SelectTrigger className="h-8 w-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                <SelectItem
                  key={k}
                  value={k}
                >
                  {SORT_LABEL[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
