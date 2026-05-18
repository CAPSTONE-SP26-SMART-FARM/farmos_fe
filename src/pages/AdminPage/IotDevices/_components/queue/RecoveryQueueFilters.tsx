import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QueueFarmPicker } from "./QueueFarmPicker";
import type { FarmPickerOption } from "./useFarmPickerOptions";

const MIN_OVERDUE_OPTIONS = [
  { value: "all", label: "Mọi mức quá hạn" },
  { value: "7", label: "Quá hạn ≥ 7 ngày" },
  { value: "14", label: "Quá hạn ≥ 14 ngày" },
  { value: "30", label: "Quá hạn ≥ 30 ngày" },
] as const;

interface Props {
  farmId?: string;
  farmOptions: FarmPickerOption[];
  minDaysOverdue?: number;
  onlineOnly: boolean;
  hasActiveFilter: boolean;
  onFarmChange: (farmId: string | null) => void;
  onMinOverdueChange: (days: number | null) => void;
  onOnlineOnlyChange: (checked: boolean) => void;
  onClearFilters: () => void;
}

export function RecoveryQueueFilters({
  farmId,
  farmOptions,
  minDaysOverdue,
  onlineOnly,
  hasActiveFilter,
  onFarmChange,
  onMinOverdueChange,
  onOnlineOnlyChange,
  onClearFilters,
}: Props) {
  const overdueValue =
    minDaysOverdue === undefined ? "all" : String(minDaysOverdue);

  return (
    <Card>
      <CardContent className="flex flex-wrap items-end gap-3 p-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" aria-hidden />
          <span className="font-medium text-foreground">Lọc</span>
        </div>

        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Nông trại</span>
          <QueueFarmPicker
            options={farmOptions}
            value={farmId}
            onValueChange={onFarmChange}
          />
        </div>

        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Quá hạn</span>
          <Select
            value={overdueValue}
            onValueChange={(v) =>
              onMinOverdueChange(v === "all" ? null : Number(v))
            }
          >
            <SelectTrigger className="h-8 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MIN_OVERDUE_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex h-8 items-center gap-2 pb-0.5">
          <Checkbox
            id="recovery-online-only"
            checked={onlineOnly}
            onCheckedChange={(v) => onOnlineOnlyChange(v === true)}
          />
          <Label
            htmlFor="recovery-online-only"
            className="cursor-pointer text-sm font-normal"
          >
            Chỉ thiết bị trực tuyến
          </Label>
        </div>

        {hasActiveFilter ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={onClearFilters}
          >
            <X className="mr-1 h-4 w-4" aria-hidden />
            Xóa bộ lọc
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
