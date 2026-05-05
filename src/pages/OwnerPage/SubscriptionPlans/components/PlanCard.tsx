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
import { Check, Sparkle } from "lucide-react";

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

const FEATURE_PREVIEW_LIMIT = 5;

function formatFeatureValue(value: string): string {
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "true") return "Có";
  if (lower === "false") return "Không";
  if (lower === "unlimited" || lower === "-1") return "Không giới hạn";
  return trimmed;
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
  const previewFeatures = features.slice(0, FEATURE_PREVIEW_LIMIT);
  const extraFeatureCount = Math.max(
    0,
    features.length - previewFeatures.length,
  );

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
        isCurrent && "ring-2 ring-primary",
        recommended && "border-primary",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-1",
          isCurrent || recommended ? "bg-primary" : "bg-primary/40",
        )}
      />
      {recommended && (
        <Badge className="absolute right-3 top-3 gap-1">
          <Sparkle className="h-3 w-3" />
          Đề xuất
        </Badge>
      )}
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">{plan.name}</CardTitle>
          {isCurrent && <Badge>Gói hiện tại</Badge>}
        </div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {plan.code}
        </p>
        <div>
          <p className="text-3xl font-bold text-primary">
            {formatCurrencyVnd(plan.listPrice)}
          </p>
          <p className="text-xs text-muted-foreground">
            / {plan.durationMonths} tháng
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        <p className="min-h-12 text-sm text-muted-foreground">
          {plan.description || "Gói tiêu chuẩn cho nhu cầu vận hành nông trại."}
        </p>

        <div className="space-y-2 border-t pt-3">
          {versionsQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
              <Skeleton className="h-4 w-3/6" />
            </div>
          ) : previewFeatures.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Chi tiết tính năng sẽ được cập nhật.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {previewFeatures.map((f) => {
                const label = f.featureName ?? f.featureCode;
                const unit = f.featureUnit;
                const formattedValue = formatFeatureValue(f.value);
                const isBoolean =
                  formattedValue === "Có" || formattedValue === "Không";
                return (
                  <li
                    key={f.id}
                    className="flex items-start gap-2 text-sm"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>
                      <span className="font-medium">
                        {isBoolean
                          ? label
                          : `${formattedValue}${unit ? ` ${unit}` : ""}`}
                      </span>
                      {!isBoolean && (
                        <span className="text-muted-foreground"> {label}</span>
                      )}
                    </span>
                  </li>
                );
              })}
              {extraFeatureCount > 0 && (
                <li className="text-xs text-muted-foreground">
                  +{extraFeatureCount} tính năng khác
                </li>
              )}
            </ul>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-2">
        {isCurrent ? (
          <p className="w-full text-center text-xs font-medium text-primary">
            Đây là gói bạn đang sử dụng.
          </p>
        ) : disableSubscribe ? (
          <div className="w-full space-y-1">
            <Button
              className="w-full"
              variant="secondary"
              disabled
            >
              Không thể đăng ký
            </Button>
            {disabledHint && (
              <p className="text-xs text-muted-foreground">{disabledHint}</p>
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
