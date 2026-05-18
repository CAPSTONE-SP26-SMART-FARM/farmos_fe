import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { DEVICE_STATUS_LABEL_ADMIN } from "@/constants/iotDeviceDisplay";
import type { DeviceStatusType } from "@/schemaValidatation/iotDevice";

interface Props {
  searchValue: string;
  onSearchChange: (value: string) => void;
  status: DeviceStatusType | "all";
  onStatusChange: (status: DeviceStatusType | "all") => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  hasActiveFilter: boolean;
  onClear: () => void;
}

const LIMIT_OPTIONS = [10, 20, 50] as const;

export function IotDeviceFilterBar({
  searchValue,
  onSearchChange,
  status,
  onStatusChange,
  limit,
  onLimitChange,
  hasActiveFilter,
  onClear,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-45 flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo tên hoặc mã thiết bị (K###)"
          className="pl-9"
          aria-label="Tìm thiết bị"
        />
      </div>

      <Select
        value={status}
        onValueChange={(value) =>
          onStatusChange(value as DeviceStatusType | "all")
        }
      >
        <SelectTrigger
          className="w-50"
          aria-label="Lọc theo trạng thái"
        >
          <SelectValue placeholder="Trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả trạng thái</SelectItem>
          {(Object.keys(DEVICE_STATUS_LABEL_ADMIN) as DeviceStatusType[]).map(
            (s) => (
              <SelectItem
                key={s}
                value={s}
              >
                {DEVICE_STATUS_LABEL_ADMIN[s]}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>

      <Select
        value={String(limit)}
        onValueChange={(value) => onLimitChange(Number(value))}
      >
        <SelectTrigger
          className="w-32.5"
          aria-label="Số mục mỗi trang"
        >
          <SelectValue placeholder="Số mục" />
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

      {hasActiveFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
        >
          <X
            className="mr-1 h-4 w-4"
            aria-hidden
          />
          Xóa bộ lọc
        </Button>
      )}
    </div>
  );
}
