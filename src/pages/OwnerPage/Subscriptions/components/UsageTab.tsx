import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingCard from "@/components/common/LoadingCard";
import TableSkeleton from "@/components/common/TableSkeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTimeVi } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  useOwnerMyQuota,
  useSubscriptionUsageLedger,
} from "@/queries/useSubscription";
import { formatFeatureLabel } from "@/constants/featureLabel";
import type {
  MyQuotaFeatureType,
  UsageLedgerQueryType,
} from "@/schemaValidatation/subscription";
import { Activity, Gauge } from "lucide-react";
import { useState } from "react";

interface UsageTabProps {
  subscriptionId: string;
  enabled: boolean;
  featureCodes: string[];
}

function progressTone(pct: number) {
  const full = pct >= 100;
  const near = pct >= 80 && !full;
  return {
    full,
    near,
    barClass: cn(
      full && "[&>div]:bg-red-500",
      near && "[&>div]:bg-amber-500",
    ),
    pctClass: full
      ? "text-red-600"
      : near
        ? "text-amber-600"
        : "text-muted-foreground",
  };
}

function FeatureUsageCard({ feature }: { feature: MyQuotaFeatureType }) {
  if (feature.kind === "boolean") {
    return (
      <div className="rounded-lg border p-3">
        <p className="font-medium">{formatFeatureLabel(feature.featureCode)}</p>
        <p
          className={cn(
            "mt-1 text-sm",
            feature.enabled ? "text-emerald-600" : "text-muted-foreground",
          )}
        >
          {feature.enabled ? "Đã bật" : "Không khả dụng"}
        </p>
      </div>
    );
  }

  if (feature.kind === "raw") {
    return (
      <div className="rounded-lg border p-3">
        <p className="font-medium">{formatFeatureLabel(feature.featureCode)}</p>
        <p className="mt-1 text-sm text-muted-foreground">{feature.value}</p>
      </div>
    );
  }

  if (feature.kind === "numeric") {
    const { limit, used } = feature;
    const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
    const tone = progressTone(pct);
    return (
      <div className="rounded-lg border p-3">
        <p className="font-medium">{formatFeatureLabel(feature.featureCode)}</p>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-xl font-semibold tabular-nums">
            {used.toLocaleString("vi-VN")} /{" "}
            {limit.toLocaleString("vi-VN")}
          </span>
          <span className={cn("text-xs font-medium", tone.pctClass)}>
            {Math.round(pct)}%
          </span>
        </div>
        <Progress
          value={pct}
          className={cn("mt-2", tone.barClass)}
        />
      </div>
    );
  }

  // numeric_per_farm
  const { limit, perFarm } = feature;
  return (
    <div className="rounded-lg border p-3 md:col-span-2 lg:col-span-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-medium">{formatFeatureLabel(feature.featureCode)}</p>
        <span className="text-xs text-muted-foreground">
          Hạn mức {limit.toLocaleString("vi-VN")} / nông trại
        </span>
      </div>
      {perFarm.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Chưa có nông trại nào.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {perFarm.map((row) => {
            const pct = limit > 0 ? Math.min(100, (row.used / limit) * 100) : 0;
            const tone = progressTone(pct);
            return (
              <div
                key={row.farmId}
                className="space-y-1"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm">{row.farmName}</p>
                  <p className="shrink-0 text-sm tabular-nums">
                    <span className="font-semibold">{row.used}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      / {limit}
                    </span>
                  </p>
                </div>
                <Progress
                  value={pct}
                  className={cn("h-1.5", tone.barClass)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UsageTab({ subscriptionId, enabled, featureCodes }: UsageTabProps) {
  const [query, setQuery] = useState<UsageLedgerQueryType>({
    page: 1,
    limit: 10,
    search: undefined,
    featureCode: undefined,
  });

  const quotaQuery = useOwnerMyQuota(enabled);
  const features = quotaQuery.data?.data?.features ?? [];

  const usageQuery = useSubscriptionUsageLedger(subscriptionId, query, enabled);

  const meta = usageQuery.data?.data?.meta;
  const rows = usageQuery.data?.data?.data ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            Mức sử dụng hiện tại
          </CardTitle>
          <CardDescription>
            Số tài nguyên đã dùng so với hạn mức gói hiện tại.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quotaQuery.isLoading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <LoadingCard rows={1} />
              <LoadingCard rows={1} />
              <LoadingCard rows={1} />
            </div>
          ) : quotaQuery.isError ? (
            <ErrorState
              message={getApiErrorMessageVi(
                quotaQuery.error,
                "Không thể tải mức sử dụng.",
              )}
              onRetry={() => quotaQuery.refetch()}
            />
          ) : features.length === 0 ? (
            <EmptyState
              icon={Gauge}
              title="Chưa có hạn mức"
              description="Đăng ký gói để xem mức sử dụng theo từng tính năng."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <FeatureUsageCard
                  key={feature.featureCode}
                  feature={feature}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    <Card>
      <CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <CardTitle>Lịch sử sử dụng</CardTitle>
          <CardDescription>
            Theo dõi biến động tiêu thụ theo từng tính năng.
          </CardDescription>
        </div>
        <Select
          value={query.featureCode ?? "ALL"}
          onValueChange={(value) =>
            setQuery((prev) => ({
              ...prev,
              page: 1,
              featureCode: value === "ALL" ? undefined : value,
            }))
          }
        >
          <SelectTrigger className="w-full md:w-60">
            <SelectValue placeholder="Lọc theo tính năng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả tính năng</SelectItem>
            {featureCodes.map((code) => (
              <SelectItem
                key={code}
                value={code}
              >
                {formatFeatureLabel(code)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-4">
        {usageQuery.isLoading ? (
          <TableSkeleton />
        ) : usageQuery.isError ? (
          <ErrorState
            message={getApiErrorMessageVi(
              usageQuery.error,
              "Không thể tải lịch sử sử dụng.",
            )}
            onRetry={() => usageQuery.refetch()}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="Chưa có dữ liệu sử dụng"
            description="Khi bạn bắt đầu sử dụng các tính năng, biến động sẽ xuất hiện ở đây."
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tính năng</TableHead>
                    <TableHead>Biến động</TableHead>
                    <TableHead>Ngữ cảnh</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead>Thời gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {formatFeatureLabel(row.featureCode)}
                      </TableCell>
                      <TableCell
                        className={
                          row.delta < 0
                            ? "text-red-600"
                            : "text-emerald-600"
                        }
                      >
                        {row.delta > 0 ? `+${row.delta}` : row.delta}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.contextEntity ?? "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.note ?? "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTimeVi(row.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Trang {meta.page}/{meta.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!meta.hasPreviousPage}
                    onClick={() =>
                      setQuery((prev) => ({
                        ...prev,
                        page: Math.max(1, prev.page - 1),
                      }))
                    }
                  >
                    Trang trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!meta.hasNextPage}
                    onClick={() =>
                      setQuery((prev) => ({ ...prev, page: prev.page + 1 }))
                    }
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
    </div>
  );
}

export default UsageTab;
