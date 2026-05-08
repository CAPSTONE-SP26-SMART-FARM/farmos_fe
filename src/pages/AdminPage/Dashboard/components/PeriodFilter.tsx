import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DashboardPeriodExtended } from "../_mocks/adminDashboardOverlay";

const LABELS: Record<DashboardPeriodExtended, string> = {
  today: "Hôm nay",
  "7d": "7 ngày",
  "30d": "30 ngày",
  "90d": "90 ngày",
};

interface PeriodFilterProps {
  value: DashboardPeriodExtended;
  onChange: (next: DashboardPeriodExtended) => void;
  ariaLabel?: string;
}

function PeriodFilter({ value, onChange, ariaLabel }: PeriodFilterProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as DashboardPeriodExtended)}>
      <SelectTrigger
        className="h-8 w-[130px] text-xs"
        aria-label={ariaLabel ?? "Chọn khoảng thời gian"}
      >
        <SelectValue placeholder={LABELS[value]} />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="today">{LABELS.today}</SelectItem>
        <SelectItem value="7d">{LABELS["7d"]}</SelectItem>
        <SelectItem value="30d">{LABELS["30d"]}</SelectItem>
        <SelectItem value="90d">{LABELS["90d"]}</SelectItem>
      </SelectContent>
    </Select>
  );
}

export default PeriodFilter;
