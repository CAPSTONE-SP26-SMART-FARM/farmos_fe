import { Badge } from "@/components/ui/badge";
import {
  getStatusClass,
  getStatusLabel,
} from "@/constants/ticketLabel";
import { cn } from "@/lib/utils";

interface TicketStatusBadgeProps {
  status: string | null | undefined;
  className?: string;
}

/**
 * Badge hiển thị trạng thái ticket. Label + class lấy từ
 * `@/constants/ticketLabel` để dùng chung giữa list, detail header,
 * dashboard và bất kỳ chỗ nào khác — đảm bảo style nhất quán.
 *
 * Defensive: helpers trong `ticketLabel.ts` đã xử lý case lạ (UPPERCASE
 * từ TicketBasicResSchema, null, v.v.) — không bao giờ render badge rỗng.
 */
export function TicketStatusBadge({
  status,
  className,
}: TicketStatusBadgeProps) {
  const label = getStatusLabel(status);
  const toneClass = getStatusClass(status);

  return (
    <Badge
      variant="outline"
      className={cn("text-xs", toneClass, className)}
    >
      {label}
    </Badge>
  );
}
