import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrencyVnd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useListSubscriptionPlanVersions } from "@/queries/useSubscriptionPlan";
import type { PlanResType } from "@/schemaValidatation/subscriptionPlan";
import { Check, PackageX, Sparkles } from "lucide-react";

interface PlanCardProps {
  plan: PlanResType;
  isCurrent?: boolean;
  disableSubscribe?: boolean;
  disabledHint?: string;
  ctaLabel?: string;
  onSubscribe?: (plan: PlanResType) => void;
  onViewDetail?: (plan: PlanResType) => void;
  recommended?: boolean;
  subscribePending?: boolean;
}

function formatFeatureValue(value: string): string {
  const lower = value.trim().toLowerCase();
  if (lower === "true") return "Có";
  if (lower === "false") return "Không";
  if (lower === "unlimited" || lower === "-1") return "Không giới hạn";
  return value.trim();
}

function PlanCard({
  plan,
  isCurrent,
  disableSubscribe,
  disabledHint,
  ctaLabel = "Đăng ký gói này",
  onSubscribe,
  recommended,
  subscribePending,
}: PlanCardProps) {
  const versionsQuery = useListSubscriptionPlanVersions(
    plan.id,
    { page: 1, limit: 20, search: undefined },
    true,
  );

  const activeVersion = versionsQuery.data?.data?.data?.find((v) => v.isActive);
  const features = activeVersion?.features ?? [];

  const outOfStock = !plan.inStock;
  const canSubscribe = !isCurrent && !disableSubscribe && !outOfStock;

  return (
    <Card
      className={cn(
        "relative flex flex-col overflow-hidden border-2 transition-all duration-300",
        canSubscribe && "hover:-translate-y-1 hover:shadow-lg",
        isCurrent && "ring-2 ring-primary",
        recommended && !outOfStock ? "border-primary" : !outOfStock && "border-border",
        outOfStock && "border-muted",
      )}
    >
      {/* Top accent bar */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-1",
          outOfStock ? "bg-muted-foreground/30" :
          isCurrent || recommended ? "bg-primary" : "bg-primary/30",
        )}
      />

      <CardHeader className="space-y-3 pt-5">
        {/* Status badges — inline, không absolute để tránh overlap */}
        {(recommended || isCurrent || outOfStock) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {recommended && (
              <Badge className="gap-1 text-xs">
                <Sparkles className="h-3 w-3" />
                Đề xuất
              </Badge>
            )}
            {isCurrent && (
              <Badge variant="outline" className="text-xs text-primary border-primary">
                Gói hiện tại
              </Badge>
            )}
            {outOfStock && (
              <Badge variant="outline" className="gap-1 text-xs border-destructive/40 text-destructive">
                <PackageX className="h-3 w-3" />
                Tạm hết hàng
              </Badge>
            )}
          </div>
        )}

        <div>
          <CardTitle className="text-lg">{plan.name}</CardTitle>
          <p className="mt-0.5 text-xs uppercase tracking-widest text-muted-foreground">
            {plan.code}
          </p>
        </div>

        <div>
          <p className={cn(
            "text-3xl font-bold",
            outOfStock ? "text-muted-foreground" : "text-primary",
          )}>
            {formatCurrencyVnd(plan.listPrice)}
          </p>
          <p className="text-xs text-muted-foreground">/ {plan.durationMonths} tháng</p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <p className="min-h-10 text-sm text-muted-foreground">
          {plan.description || "Gói tiêu chuẩn cho nhu cầu vận hành nông trại."}
        </p>

        <div className="space-y-2 border-t pt-3">
          {versionsQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
              <Skeleton className="h-4 w-3/6" />
            </div>
          ) : features.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Chi tiết tính năng sẽ được cập nhật.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {features.map((f) => {
                const label = f.featureName ?? f.featureCode;
                const unit = f.featureUnit;
                const formattedValue = formatFeatureValue(f.value);
                const isBoolean = formattedValue === "Có" || formattedValue === "Không";
                return (
                  <li key={f.id} className="flex items-start gap-2 text-sm">
                    <Check className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      outOfStock ? "text-muted-foreground" : "text-primary",
                    )} />
                    <span>
                      <span className="font-medium">
                        {isBoolean ? label : `${formattedValue}${unit ? ` ${unit}` : ""}`}
                      </span>
                      {!isBoolean && (
                        <span className="text-muted-foreground"> {label}</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-2 pt-4">
        {isCurrent ? (
          <p className="w-full text-center text-xs font-medium text-primary">
            Đây là gói bạn đang sử dụng.
          </p>
        ) : outOfStock ? (
          <div className="w-full space-y-1.5 text-center">
            <Button className="w-full" variant="outline" disabled>
              <PackageX className="mr-2 h-4 w-4" />
              Tạm hết hàng
            </Button>
            <p className="text-xs text-muted-foreground">
              Kho thiết bị IoT đang hết, vui lòng thử lại sau.
            </p>
          </div>
        ) : disableSubscribe ? (
          <div className="w-full space-y-1.5">
            <Button className="w-full" variant="secondary" disabled>
              Không thể đăng ký
            </Button>
            {disabledHint && (
              <p className="text-center text-xs text-muted-foreground">{disabledHint}</p>
            )}
          </div>
        ) : (
          <Button
            className="w-full"
            onClick={() => onSubscribe?.(plan)}
            disabled={subscribePending}
          >
            {subscribePending ? "Đang xử lý..." : ctaLabel}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default PlanCard;
