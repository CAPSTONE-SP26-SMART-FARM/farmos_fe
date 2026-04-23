import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingCard from "@/components/common/LoadingCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getApiErrorMessageVi } from "@/lib/error-message";
import { cn } from "@/lib/utils";
import type { SubscriptionEntitlementType } from "@/schemaValidatation/subscription";
import { useSubscriptionEntitlements } from "@/queries/useSubscription";
import { CheckCircle2, Package, XCircle } from "lucide-react";

interface OverviewTabProps {
  subscriptionId: string;
  enabled: boolean;
  usageByFeature: Record<string, number>;
}

interface ParsedLimit {
  kind: "numeric" | "boolean" | "unlimited" | "raw";
  numeric?: number;
  booleanValue?: boolean;
  raw: string;
}

function parseEntitlementValue(value: string): ParsedLimit {
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "unlimited" || lower === "infinity" || lower === "-1") {
    return { kind: "unlimited", raw: trimmed };
  }
  if (lower === "true" || lower === "false") {
    return {
      kind: "boolean",
      booleanValue: lower === "true",
      raw: trimmed,
    };
  }
  const n = Number(trimmed);
  if (!Number.isNaN(n) && Number.isFinite(n)) {
    return { kind: "numeric", numeric: n, raw: trimmed };
  }
  return { kind: "raw", raw: trimmed };
}

function EntitlementCard({
  entitlement,
  usedRaw,
}: {
  entitlement: SubscriptionEntitlementType;
  usedRaw: number;
}) {
  const parsed = parseEntitlementValue(entitlement.value);
  const used = Math.max(0, usedRaw);

  if (parsed.kind === "boolean") {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 pt-6">
          {parsed.booleanValue ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <XCircle className="h-5 w-5 text-muted-foreground" />
          )}
          <div className="flex-1">
            <p className="font-medium">{entitlement.featureCode}</p>
            <p className="text-xs text-muted-foreground">
              {parsed.booleanValue ? "Đã bật" : "Không áp dụng"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (parsed.kind === "unlimited") {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="font-medium">{entitlement.featureCode}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-primary">∞</span>
            <span className="text-xs text-muted-foreground">Không giới hạn</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Đã dùng: {used.toLocaleString("vi-VN")}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (parsed.kind === "numeric" && parsed.numeric !== undefined) {
    const limit = parsed.numeric;
    const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
    const near = pct >= 80 && pct < 100;
    const full = pct >= 100;
    return (
      <Card>
        <CardContent className="space-y-2 pt-6">
          <p className="font-medium">{entitlement.featureCode}</p>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-semibold">
              {used.toLocaleString("vi-VN")} / {limit.toLocaleString("vi-VN")}
            </span>
            <span
              className={cn(
                "text-xs font-medium",
                full
                  ? "text-red-600"
                  : near
                    ? "text-amber-600"
                    : "text-muted-foreground",
              )}
            >
              {Math.round(pct)}%
            </span>
          </div>
          <Progress
            value={pct}
            className={cn(
              full && "[&>div]:bg-red-500",
              near && !full && "[&>div]:bg-amber-500",
            )}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="font-medium">{entitlement.featureCode}</p>
        <p className="text-sm text-muted-foreground">{parsed.raw}</p>
      </CardContent>
    </Card>
  );
}

function OverviewTab({
  subscriptionId,
  enabled,
  usageByFeature,
}: OverviewTabProps) {
  const entitlementsQuery = useSubscriptionEntitlements(
    subscriptionId,
    { page: 1, limit: 50, search: undefined },
    enabled,
  );

  if (entitlementsQuery.isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <LoadingCard
            key={i}
            rows={2}
          />
        ))}
      </div>
    );
  }

  if (entitlementsQuery.isError) {
    return (
      <ErrorState
        message={getApiErrorMessageVi(
          entitlementsQuery.error,
          "Không thể tải quyền lợi.",
        )}
        onRetry={() => entitlementsQuery.refetch()}
      />
    );
  }

  const entitlements = entitlementsQuery.data?.data?.data ?? [];

  if (!entitlements.length) {
    return (
      <EmptyState
        icon={Package}
        title="Chưa có quyền lợi"
        description="Gói đăng ký này chưa được cấp quyền lợi. Liên hệ hỗ trợ nếu bạn cần."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quyền lợi của gói</CardTitle>
        <CardDescription>
          Dung lượng đã dùng / tổng hạn mức theo từng tính năng.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {entitlements.map((e) => (
            <EntitlementCard
              key={e.id}
              entitlement={e}
              usedRaw={usageByFeature[e.featureCode] ?? 0}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default OverviewTab;
