import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QueueFarmPicker } from "./QueueFarmPicker";
import type { FarmPickerOption } from "./useFarmPickerOptions";

const MIN_AGE_OPTIONS = [
  { value: "all", label: "Mọi thời gian chờ" },
  { value: "3", label: "Chờ ≥ 3 ngày" },
  { value: "5", label: "Chờ ≥ 5 ngày" },
] as const;

interface Props {
  farmId?: string;
  farmOptions: FarmPickerOption[];
  minAgeDays?: number;
  hasActiveFilter: boolean;
  onFarmChange: (farmId: string | null) => void;
  onMinAgeChange: (minAgeDays: number | null) => void;
  onClearFilters: () => void;
}

export function InstallQueueFilters({
  farmId,
  farmOptions,
  minAgeDays,
  hasActiveFilter,
  onFarmChange,
  onMinAgeChange,
  onClearFilters,
}: Props) {
  const minAgeValue =
    minAgeDays === undefined ? "all" : String(minAgeDays);

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
          <span className="text-xs text-muted-foreground">Thời gian chờ</span>
          <Select
            value={minAgeValue}
            onValueChange={(v) =>
              onMinAgeChange(v === "all" ? null : Number(v))
            }
          >
            <SelectTrigger className="h-8 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MIN_AGE_OPTIONS.map((opt) => (
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
