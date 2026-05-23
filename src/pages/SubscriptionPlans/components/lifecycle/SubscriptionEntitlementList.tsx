import { format } from "date-fns";
import type { SubscriptionEntitlementType } from "@/schemaValidatation/subscription";

interface SubscriptionEntitlementListProps {
  entitlements: SubscriptionEntitlementType[];
  isLoading: boolean;
}

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "dd/MM/yyyy");
};

export function SubscriptionEntitlementList({
  entitlements,
  isLoading,
}: SubscriptionEntitlementListProps) {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold">Quyền lợi trong gói</h4>
        <p className="text-xs text-muted-foreground">
          Danh sách tính năng được kích hoạt theo gói đăng ký này.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="h-16 animate-pulse rounded-md border bg-muted/40"
            />
          ))}
        </div>
      ) : !entitlements.length ? (
        <p className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
          Không có quyền lợi.
        </p>
      ) : (
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {entitlements.map((item) => (
            <div
              key={item.id}
              className="rounded-md border p-3 space-y-1"
            >
              <p className="text-sm font-medium">
                {item.featureName ?? "-"}
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                {item.featureCode}
              </p>
              <p className="text-xs text-muted-foreground">
                Kỳ áp dụng: {formatDate(item.periodStart)} →{" "}
                {formatDate(item.periodEnd)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SubscriptionEntitlementList;
