import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DashboardPeriod } from "@/types/dashboard";

const LABELS: Record<DashboardPeriod, string> = {
  "1d": "Hôm nay",
  "7d": "7 ngày",
  "30d": "30 ngày",
  "90d": "90 ngày",
};

interface PeriodFilterProps {
  value: DashboardPeriod;
  onChange: (next: DashboardPeriod) => void;
  ariaLabel?: string;
}

function PeriodFilter({ value, onChange, ariaLabel }: PeriodFilterProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as DashboardPeriod)}>
      <SelectTrigger
        className="h-8 w-[130px] text-xs"
        aria-label={ariaLabel ?? "Chọn khoảng thời gian"}
      >
        <SelectValue placeholder={LABELS[value]} />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="1d">{LABELS["1d"]}</SelectItem>
        <SelectItem value="7d">{LABELS["7d"]}</SelectItem>
        <SelectItem value="30d">{LABELS["30d"]}</SelectItem>
        <SelectItem value="90d">{LABELS["90d"]}</SelectItem>
      </SelectContent>
    </Select>
  );
}

export default PeriodFilter;
