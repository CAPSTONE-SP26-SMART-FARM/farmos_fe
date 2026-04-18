import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  isSafe: boolean;
  hasValue: boolean;
};

export default function StatusBadge({ isSafe, hasValue }: StatusBadgeProps) {
  if (!hasValue) {
    return (
      <Badge
        variant="outline"
        className="text-muted-foreground"
      >
        Chưa có dữ liệu
      </Badge>
    );
  }

  return (
    <Badge
      variant={isSafe ? "default" : "destructive"}
      className={cn(isSafe && "bg-green-600 hover:bg-green-700")}
    >
      {isSafe ? "An toàn" : "Cảnh báo"}
    </Badge>
  );
}
