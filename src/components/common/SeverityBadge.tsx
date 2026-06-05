import { Badge } from "@/components/ui/badge";
import {
  getSeverityClass,
  getSeverityLabel,
} from "@/constants/ticketLabel";
import { cn } from "@/lib/utils";

interface SeverityBadgeProps {
  severity: string | null | undefined;
  /** Hiển thị prefix "Mức độ:" (dùng ở detail header). */
  withPrefix?: boolean;
  className?: string;
}

/**
 * Badge hiển thị mức độ sự cố. Label + class lấy từ `@/constants/ticketLabel`
 * để dùng chung giữa table, detail header, dashboard và bất kỳ chỗ nào khác.
 *
 * Defensive: helpers trong `ticketLabel.ts` đã xử lý case lạ / null —
 * không bao giờ render badge rỗng.
 */
export function SeverityBadge({
  severity,
  withPrefix,
  className,
}: SeverityBadgeProps) {
  const label = getSeverityLabel(severity);
  const toneClass = getSeverityClass(severity);

  return (
    <Badge
      variant="outline"
      className={cn("text-xs", toneClass, className)}
    >
      {withPrefix ? `Mức độ: ${label}` : label}
    </Badge>
  );
}
