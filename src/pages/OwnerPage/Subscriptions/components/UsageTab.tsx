import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingCard from "@/components/common/LoadingCard";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Sparkles,
  Sprout,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

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

function statusLabel(pct: number) {
  if (pct >= 100) return "Đã đầy";
  if (pct >= 80) return "Sắp đầy";
  return "Bình thường";
}

function NumericQuotaRow({
  label,
  used,
  limit,
  remaining,
}: {
  label: string;
  used: number;
  limit: number;
  remaining: number;
}) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const tone = progressTone(pct);
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 transition-colors",
        tone.full && "border-red-200 bg-red-50/40",
        tone.near && "border-amber-200 bg-amber-50/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Còn lại{" "}
            <span className="font-medium text-foreground tabular-nums">
              {remaining.toLocaleString("vi-VN")}
            </span>{" "}
            / {limit.toLocaleString("vi-VN")}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-2xl font-semibold leading-none tabular-nums">
            {used.toLocaleString("vi-VN")}
            <span className="text-sm font-normal text-muted-foreground">
              {" "}
              / {limit.toLocaleString("vi-VN")}
            </span>
          </span>
          <span className={cn("text-xs font-medium", tone.pctClass)}>
            {Math.round(pct)}% · {statusLabel(pct)}
          </span>
        </div>
      </div>
      <Progress
        value={pct}
        className={cn("mt-3 h-2", tone.barClass)}
      />
    </div>
  );
}

function PerFarmQuotaCard({
  feature,
}: {
  feature: Extract<MyQuotaFeatureType, { kind: "numeric_per_farm" }>;
}) {
  const { limit, perFarm } = feature;
  const sorted = [...perFarm].sort((a, b) => b.used - a.used);
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sprout className="h-4 w-4 text-emerald-600" />
          <p className="font-medium">{formatFeatureLabel(feature.featureCode)}</p>
        </div>
        <Badge variant="outline" className="text-xs font-normal">
          Hạn mức {limit.toLocaleString("vi-VN")} / nông trại
        </Badge>
      </div>

      {sorted.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Chưa có nông trại nào.
        </p>
      ) : (
        <div className="mt-3 divide-y rounded-md border">
          {sorted.map((row) => {
            const pct =
              limit > 0 ? Math.min(100, (row.used / limit) * 100) : 0;
            const tone = progressTone(pct);
            return (
              <div
                key={row.farmId}
                className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 px-3 py-2.5 sm:grid-cols-[1fr_minmax(0,2fr)_auto] sm:items-center"
              >
                <p className="truncate text-sm font-medium">{row.farmName}</p>
                <Progress
                  value={pct}
                  className={cn(
                    "col-span-2 h-1.5 sm:col-span-1",
                    tone.barClass,
                  )}
                />
                <div className="col-span-2 flex items-baseline justify-end gap-2 sm:col-span-1">
                  <span className="text-sm font-semibold tabular-nums">
                    {row.used}
                    <span className="font-normal text-muted-foreground">
                      /{limit}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "w-10 text-right text-xs font-medium tabular-nums",
                      tone.pctClass,
                    )}
                  >
                    {Math.round(pct)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FeatureFlagChip({
  feature,
}: {
  feature: Extract<MyQuotaFeatureType, { kind: "boolean" | "raw" }>;
}) {
  const label = formatFeatureLabel(feature.featureCode);
  if (feature.kind === "boolean") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
          feature.enabled
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-border bg-muted/40 text-muted-foreground",
        )}
      >
        {feature.enabled ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <XCircle className="h-3.5 w-3.5" />
        )}
        <span className="font-medium">{label}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm">
      <Sparkles className="h-3.5 w-3.5 text-primary" />
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">· {feature.value}</span>
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

  const { numericFeatures, perFarmFeatures, flagFeatures, summary } = useMemo(() => {
    const numeric = features
      .filter((f): f is Extract<MyQuotaFeatureType, { kind: "numeric" }> => f.kind === "numeric")
      .map((f) => ({
        ...f,
        pct: f.limit > 0 ? Math.min(100, (f.used / f.limit) * 100) : 0,
      }))
      .sort((a, b) => b.pct - a.pct);

    const perFarm = features.filter(
      (f): f is Extract<MyQuotaFeatureType, { kind: "numeric_per_farm" }> =>
        f.kind === "numeric_per_farm",
    );

    const flags = features.filter(
      (f): f is Extract<MyQuotaFeatureType, { kind: "boolean" | "raw" }> =>
        f.kind === "boolean" || f.kind === "raw",
    );

    // Aggregate "near/full" indicators across both account-wide numeric and per-farm rows
    const allPercents: number[] = [];
    for (const f of numeric) allPercents.push(f.pct);
    for (const f of perFarm) {
      for (const row of f.perFarm) {
        const pct = f.limit > 0 ? Math.min(100, (row.used / f.limit) * 100) : 0;
        allPercents.push(pct);
      }
    }

    const full = allPercents.filter((p) => p >= 100).length;
    const near = allPercents.filter((p) => p >= 80 && p < 100).length;
    const ok = allPercents.length - full - near;

    return {
      numericFeatures: numeric,
      perFarmFeatures: perFarm,
      flagFeatures: flags,
      summary: { total: allPercents.length, ok, near, full },
    };
  }, [features]);

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
        <CardContent className="space-y-6">
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
            <>
              {summary.total > 0 && (
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-lg border bg-emerald-50/60 p-3">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">
                        Bình thường
                      </span>
                    </div>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-700">
                      {summary.ok}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      hạn mức dưới 80%
                    </p>
                  </div>
                  <div
                    className={cn(
                      "rounded-lg border p-3",
                      summary.near > 0
                        ? "border-amber-200 bg-amber-50/60"
                        : "bg-muted/30",
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-2",
                        summary.near > 0
                          ? "text-amber-700"
                          : "text-muted-foreground",
                      )}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">
                        Sắp đầy
                      </span>
                    </div>
                    <p
                      className={cn(
                        "mt-1 text-2xl font-semibold tabular-nums",
                        summary.near > 0
                          ? "text-amber-700"
                          : "text-muted-foreground",
                      )}
                    >
                      {summary.near}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      đã dùng 80% trở lên
                    </p>
                  </div>
                  <div
                    className={cn(
                      "rounded-lg border p-3",
                      summary.full > 0
                        ? "border-red-200 bg-red-50/60"
                        : "bg-muted/30",
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-2",
                        summary.full > 0
                          ? "text-red-700"
                          : "text-muted-foreground",
                      )}
                    >
                      <XCircle className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">
                        Đã đầy
                      </span>
                    </div>
                    <p
                      className={cn(
                        "mt-1 text-2xl font-semibold tabular-nums",
                        summary.full > 0
                          ? "text-red-700"
                          : "text-muted-foreground",
                      )}
                    >
                      {summary.full}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      cần nâng gói / dọn dẹp
                    </p>
                  </div>
                </div>
              )}

              {numericFeatures.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Hạn mức tài khoản
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {numericFeatures.map((feature) => (
                      <NumericQuotaRow
                        key={feature.featureCode}
                        label={formatFeatureLabel(feature.featureCode)}
                        used={feature.used}
                        limit={feature.limit}
                        remaining={feature.remaining}
                      />
                    ))}
                  </div>
                </section>
              )}

              {perFarmFeatures.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Hạn mức theo nông trại
                  </h3>
                  <div className="space-y-3">
                    {perFarmFeatures.map((feature) => (
                      <PerFarmQuotaCard
                        key={feature.featureCode}
                        feature={feature}
                      />
                    ))}
                  </div>
                </section>
              )}

              {flagFeatures.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Tính năng đi kèm
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {flagFeatures.map((feature) => (
                      <FeatureFlagChip
                        key={feature.featureCode}
                        feature={feature}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
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
