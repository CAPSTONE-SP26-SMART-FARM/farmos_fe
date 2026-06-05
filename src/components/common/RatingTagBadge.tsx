import { Badge } from "@/components/ui/badge";
import {
  getRatingTagClass,
  getRatingTagLabel,
} from "@/constants/ticketLabel";
import { cn } from "@/lib/utils";

interface RatingTagBadgeProps {
  tag: string;
  className?: string;
}

/**
 * Badge hiển thị tag đánh giá bác sĩ với tone màu phân biệt positive /
 * negative / neutral. BE trả về snake_case English (`fast_response`,
 * `professional`, ...) — component tự dịch sang tiếng Việt qua helper.
 *
 * Defensive: tag không khớp dict → render raw + tone xám.
 */
export function RatingTagBadge({ tag, className }: RatingTagBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("text-xs", getRatingTagClass(tag), className)}
    >
      {getRatingTagLabel(tag)}
    </Badge>
  );
}
