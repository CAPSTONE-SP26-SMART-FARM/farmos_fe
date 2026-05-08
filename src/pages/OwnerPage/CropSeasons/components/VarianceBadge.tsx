// src/pages/OwnerPage/CropSeasons/components/VarianceBadge.tsx
import { Badge } from "@/components/ui/badge";
import { getEnumValueLabel } from "@/lib/tracking-display";
import type { VarianceType } from "@/schemaValidatation/tracking";

interface VarianceBadgeProps {
  variance: VarianceType;
  dataType: string;
}

export default function VarianceBadge({
  variance,
  dataType: _dataType,
}: VarianceBadgeProps) {
  if (!variance || variance.type === "none") {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const { type, value, direction } = variance;

  // Late or higher → danger
  if (direction === "late" || direction === "higher") {
    const display = buildValueDisplay(type, value, "+");
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200">
        {display}
      </Badge>
    );
  }

  // Early or lower → success
  if (direction === "early" || direction === "lower") {
    const display = buildValueDisplay(type, value, "−");
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        {display}
      </Badge>
    );
  }

  // On-time or equal → neutral
  if (direction === "on-time" || direction === "equal") {
    return (
      <Badge
        variant="outline"
        className="text-muted-foreground"
      >
        Đúng kế hoạch
      </Badge>
    );
  }

  // Changed or label without direction → secondary
  return <Badge variant="secondary">Thay đổi</Badge>;
}

function buildValueDisplay(
  type: string,
  value: unknown,
  prefix: string,
): string {
  if (value === null || value === undefined) {
    return prefix === "+" ? "Quá" : "Sớm";
  }
  switch (type) {
    case "days":
      return `${prefix}${value} ngày`;
    case "percent":
      return `${prefix}${value}%`;
    case "absolute":
      return `${prefix}${value}`;
    case "label":
      return getEnumValueLabel(String(value));
    default:
      return getEnumValueLabel(String(value));
  }
}
