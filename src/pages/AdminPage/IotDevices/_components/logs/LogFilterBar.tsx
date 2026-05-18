import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DatePickerField from "@/components/common/DatePickerField";
import { X } from "lucide-react";

interface Props {
  dateFrom: string;
  dateTo: string;
  limit: number;
  hasActiveFilter: boolean;
  onChangeDateFrom: (v: string) => void;
  onChangeDateTo: (v: string) => void;
  onChangeLimit: (v: number) => void;
  onApply: () => void;
  onClear: () => void;
}

const LIMIT_OPTIONS = [20, 50, 100] as const;

export function LogFilterBar({
  dateFrom,
  dateTo,
  limit,
  hasActiveFilter,
  onChangeDateFrom,
  onChangeDateTo,
  onChangeLimit,
  onApply,
  onClear,
}: Props) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-40">
        <DatePickerField
          label="Từ ngày"
          value={dateFrom}
          onChange={onChangeDateFrom}
          placeholder="dd/MM/yyyy"
        />
      </div>
      <div className="w-40">
        <DatePickerField
          label="Đến ngày"
          value={dateTo}
          onChange={onChangeDateTo}
          placeholder="dd/MM/yyyy"
          minDate={dateFrom ? new Date(dateFrom) : undefined}
        />
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onApply}
        >
          Lọc
        </Button>
        {hasActiveFilter && (
          <Button
            size="sm"
            variant="outline"
            onClick={onClear}
          >
            <X
              className="mr-1 h-3.5 w-3.5"
              aria-hidden
            />
            Xóa lọc
          </Button>
        )}
      </div>

      <div className="ml-auto flex flex-col gap-1">
        <Label className="text-xs">Hiển thị</Label>
        <Select
          value={String(limit)}
          onValueChange={(v) => onChangeLimit(Number(v))}
        >
          <SelectTrigger className="h-9 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LIMIT_OPTIONS.map((n) => (
              <SelectItem
                key={n}
                value={String(n)}
              >
                {n} / trang
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
