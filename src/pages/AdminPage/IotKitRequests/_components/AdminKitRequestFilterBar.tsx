import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  KIT_REQUEST_STATUS_LABEL,
  KIT_REQUEST_TYPE_LABEL,
} from "@/constants/iotKitRequestLabel";
import type {
  KitRequestDirectionType,
  KitRequestStatusType,
  KitRequestTypeType,
} from "@/schemaValidatation/iotKitRequest";
import { X } from "lucide-react";

/**
 * Filter bar admin (rule 10 — ≥3 filter):
 *   - Tìm theo mã/tiêu đề (search)
 *   - Hướng (direction)
 *   - Loại (type)
 *   - Trạng thái (status)
 *
 * KHÔNG dùng RHF FormProvider vì state đã sync URL search params ở page.
 * Mỗi select fire callback `onChange(field, value)` để page tự cập nhật URL.
 */

const ALL_VALUE = "__all__";

interface Props {
  search: string;
  direction: KitRequestDirectionType | null;
  type: KitRequestTypeType | null;
  status: KitRequestStatusType | null;
  onChange: (
    key: "search" | "direction" | "type" | "status",
    value: string | null,
  ) => void;
  onReset: () => void;
}

export function AdminKitRequestFilterBar({
  search,
  direction,
  type,
  status,
  onChange,
  onReset,
}: Props) {
  const hasActive = !!(search || direction || type || status);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Tìm kiếm
        </label>
        <Input
          placeholder="Mã yêu cầu / tiêu đề..."
          value={search}
          onChange={(e) => onChange("search", e.target.value)}
          className="w-56"
        />
      </div>

      <SelectField
        label="Loại"
        value={type}
        options={Object.entries(KIT_REQUEST_TYPE_LABEL).map(([k, v]) => ({
          value: k,
          label: v,
        }))}
        onChange={(v) => onChange("type", v)}
      />

      <SelectField
        label="Trạng thái"
        value={status}
        options={Object.entries(KIT_REQUEST_STATUS_LABEL).map(([k, v]) => ({
          value: k,
          label: v,
        }))}
        onChange={(v) => onChange("status", v)}
      />

      {hasActive && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-muted-foreground"
        >
          <X className="mr-1 h-3.5 w-3.5" />
          Xóa bộ lọc
        </Button>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: { value: string; label: string }[];
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select
        value={value ?? ALL_VALUE}
        onValueChange={(v) => onChange(v === ALL_VALUE ? null : v)}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Tất cả" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>Tất cả</SelectItem>
          {options.map((opt) => (
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
  );
}
