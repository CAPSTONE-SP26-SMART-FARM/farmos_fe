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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { getApiErrorMessageVi } from "@/lib/error-message";
import { useOwnerMyQuota } from "@/queries/useSubscription";
import { formatFeatureLabel } from "@/constants/featureLabel";
import type { MyQuotaFeatureType } from "@/schemaValidatation/subscription";
import { Gauge } from "lucide-react";
import { useState } from "react";

interface UsageTabProps {
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

type QuotaRow = {
  key: string;
  featureCode: string;
  scope: string;
  limit: string;
  used: string;
  remaining: string;
  pct: number | null;
};

function buildQuotaRows(features: MyQuotaFeatureType[]): QuotaRow[] {
  const rows: QuotaRow[] = [];
  for (const feature of features) {
    if (feature.kind === "boolean") {
      rows.push({
        key: feature.featureCode,
        featureCode: feature.featureCode,
        scope: "Toàn tài khoản",
        limit: feature.enabled ? "Đã bật" : "Tắt",
        used: "—",
        remaining: "—",
        pct: null,
      });
    } else if (feature.kind === "raw") {
      rows.push({
        key: feature.featureCode,
        featureCode: feature.featureCode,
        scope: "Toàn tài khoản",
        limit: feature.value,
        used: "—",
        remaining: "—",
        pct: null,
      });
    } else if (feature.kind === "numeric") {
      const pct =
        feature.limit > 0
          ? Math.min(100, (feature.used / feature.limit) * 100)
          : 0;
      rows.push({
        key: feature.featureCode,
        featureCode: feature.featureCode,
        scope: "Toàn tài khoản",
        limit: feature.limit.toLocaleString("vi-VN"),
        used: feature.used.toLocaleString("vi-VN"),
        remaining: feature.remaining.toLocaleString("vi-VN"),
        pct,
      });
    } else {
      // numeric_per_farm — expand một dòng cho mỗi farm để admin tra cứu nhanh
      if (feature.perFarm.length === 0) {
        rows.push({
          key: feature.featureCode,
          featureCode: feature.featureCode,
          scope: "Chưa có nông trại",
          limit: feature.limit.toLocaleString("vi-VN"),
          used: "0",
          remaining: feature.limit.toLocaleString("vi-VN"),
          pct: 0,
        });
        continue;
      }
      for (const row of feature.perFarm) {
        const pct =
          feature.limit > 0
            ? Math.min(100, (row.used / feature.limit) * 100)
            : 0;
        rows.push({
          key: `${feature.featureCode}:${row.farmId}`,
          featureCode: feature.featureCode,
          scope: row.farmName,
          limit: feature.limit.toLocaleString("vi-VN"),
          used: row.used.toLocaleString("vi-VN"),
          remaining: row.remaining.toLocaleString("vi-VN"),
          pct,
        });
      }
    }
  }
  return rows;
}

function UsageTab({ enabled, featureCodes }: UsageTabProps) {
  const [filterFeatureCode, setFilterFeatureCode] = useState<string>("ALL");

  const quotaQuery = useOwnerMyQuota(enabled);
  const features = quotaQuery.data?.data?.features ?? [];

  const allRows = buildQuotaRows(features);
  const rows =
    filterFeatureCode === "ALL"
      ? allRows
      : allRows.filter((r) => r.featureCode === filterFeatureCode);

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
            <CardTitle>Bảng hạn mức theo tính năng</CardTitle>
            <CardDescription>
              Tổng hợp hạn mức, mức đã dùng và còn lại theo dữ liệu hạn mức
              hiện tại.
            </CardDescription>
          </div>
          <Select
            value={filterFeatureCode}
            onValueChange={setFilterFeatureCode}
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
          {quotaQuery.isLoading ? (
            <div className="grid gap-3">
              <LoadingCard rows={3} />
            </div>
          ) : quotaQuery.isError ? (
            <ErrorState
              message={getApiErrorMessageVi(
                quotaQuery.error,
                "Không thể tải bảng hạn mức.",
              )}
              onRetry={() => quotaQuery.refetch()}
            />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={Gauge}
              title="Không có dữ liệu hạn mức"
              description={
                filterFeatureCode === "ALL"
                  ? "Đăng ký gói để bắt đầu xem hạn mức."
                  : "Tính năng đã chọn không có hạn mức."
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <DataTable
                columns={
                  [
                    {
                      accessorKey: "featureCode",
                      header: "Tính năng",
                      cell: ({ row }) => (
                        <span className="font-medium">
                          {formatFeatureLabel(row.original.featureCode)}
                        </span>
                      ),
                    },
                    {
                      accessorKey: "scope",
                      header: "Phạm vi",
                      cell: ({ row }) => (
                        <span className="text-sm text-muted-foreground">
                          {row.original.scope}
                        </span>
                      ),
                    },
                    {
                      accessorKey: "limit",
                      header: () => <div className="text-right">Hạn mức</div>,
                      cell: ({ row }) => (
                        <div className="text-right tabular-nums">
                          {row.original.limit}
                        </div>
                      ),
                    },
                    {
                      accessorKey: "used",
                      header: () => <div className="text-right">Đã dùng</div>,
                      cell: ({ row }) => (
                        <div className="text-right tabular-nums">
                          {row.original.used}
                        </div>
                      ),
                    },
                    {
                      accessorKey: "remaining",
                      header: () => <div className="text-right">Còn lại</div>,
                      cell: ({ row }) => (
                        <div className="text-right tabular-nums">
                          {row.original.remaining}
                        </div>
                      ),
                    },
                    {
                      id: "progress",
                      header: "Tiến độ",
                      cell: ({ row }) => {
                        const tone =
                          row.original.pct == null
                            ? null
                            : progressTone(row.original.pct);
                        return row.original.pct == null || tone == null ? (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Progress
                              value={row.original.pct}
                              className={cn(
                                "h-1.5 flex-1",
                                tone.barClass,
                              )}
                            />
                            <span
                              className={cn(
                                "w-10 text-right text-xs font-medium tabular-nums",
                                tone.pctClass,
                              )}
                            >
                              {Math.round(row.original.pct)}%
                            </span>
                          </div>
                        );
                      },
                    },
                  ] as ColumnDef<(typeof rows)[number]>[]
                }
                data={rows}
                emptyText="Không có dữ liệu hạn mức."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default UsageTab;
