import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SubscriptionStatusType } from "@/schemaValidatation/subscription";

const STATUS_OPTIONS: Array<{
  value: "ALL" | SubscriptionStatusType;
  label: string;
}> = [
  { value: "ALL", label: "Tất cả" },
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "PENDING", label: "Chờ thanh toán" },
  { value: "SUSPENDED", label: "Tạm ngưng" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "EXPIRED", label: "Hết hạn" },
];

interface StatusFilterPillsProps {
  value: "ALL" | SubscriptionStatusType;
  onChange: (value: "ALL" | SubscriptionStatusType) => void;
  counts?: Partial<Record<"ALL" | SubscriptionStatusType, number>>;
}

function StatusFilterPills({
  value,
  onChange,
  counts,
}: StatusFilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_OPTIONS.map((opt) => {
        const active = opt.value === value;
        const count = counts?.[opt.value];
        return (
          <Button
            key={opt.value}
            type="button"
            size="sm"
            variant={active ? "default" : "outline"}
            onClick={() => onChange(opt.value)}
            className={cn("rounded-full", active && "shadow-sm")}
          >
            {opt.label}
            {typeof count === "number" && (
              <span
                className={cn(
                  "ml-1 rounded-full px-2 py-0.5 text-xs",
                  active
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}

export default StatusFilterPills;
