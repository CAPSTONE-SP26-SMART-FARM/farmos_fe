import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import SubscriptionStatusBadge from "@/components/common/SubscriptionStatusBadge";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDateVi } from "@/lib/format";
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  useAdminListSubscriptions,
  useAdminSubscriptionsSummary,
} from "@/queries/useSubscription";
import type {
  ListSubscriptionsQueryType,
  SubscriptionResType,
  SubscriptionStatusType,
} from "@/schemaValidatation/subscription";
import { Eye, Filter, Inbox, Info, Shield } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SubscriptionLifecycleManagementPage from "@/pages/SubscriptionLifecycle/SubscriptionLifecycleManagementPage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SubscriptionsKpiStrip, { type KpiCounts } from "./SubscriptionsKpiStrip";
import SubscriptionsLifecycleInsights from "./SubscriptionsLifecycleInsights";

const STATUS_FILTER_OPTIONS: Array<{
  value: "ALL" | SubscriptionStatusType;
  label: string;
}> = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "PENDING", label: "Chờ thanh toán" },
  { value: "SUSPENDED", label: "Tạm ngưng" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "EXPIRED", label: "Hết hạn" },
];

function AdminSubscriptionsWorkspace() {
  const [status, setStatus] = useState<"ALL" | SubscriptionStatusType>("ALL");
  const [ownerSearchInput, setOwnerSearchInput] = useState("");
  const [appliedOwnerSearch, setAppliedOwnerSearch] = useState<
    string | undefined
  >(undefined);
  const [page, setPage] = useState(1);
  const [selectedSubId, setSelectedSubId] = useState<string | undefined>(
    undefined,
  );

  const query = useMemo<ListSubscriptionsQueryType>(
    () => ({
      page,
      limit: 10,
      status: status === "ALL" ? undefined : status,
      ownerSearch: appliedOwnerSearch,
    }),
    [page, status, appliedOwnerSearch],
  );

  const listQuery = useAdminListSubscriptions(query, true);
  const listData = listQuery.data?.data;
  const subscriptions = useMemo(() => listData?.data ?? [], [listData?.data]);
  const meta = listData?.meta;

  const summaryQuery = useAdminSubscriptionsSummary(true);
  const summary = summaryQuery.data?.data;

  // Global counts come from the backend summary endpoint; fall back to current
  // page totals while the summary is loading so the UI never flashes empty.
  const counts: KpiCounts = useMemo(() => {
    if (summary) {
      return {
        total: summary.statusCounts.total,
        active: summary.statusCounts.active,
        pending: summary.statusCounts.pending,
        suspended: summary.statusCounts.suspended,
        cancelled: summary.statusCounts.cancelled,
        expired: summary.statusCounts.expired,
      };
    }
    return {
      total: meta?.totalItems ?? subscriptions.length,
      active: subscriptions.filter((s) => s.status === "ACTIVE").length,
      pending: subscriptions.filter((s) => s.status === "PENDING").length,
      suspended: subscriptions.filter((s) => s.status === "SUSPENDED").length,
      cancelled: subscriptions.filter((s) => s.status === "CANCELLED").length,
      expired: subscriptions.filter((s) => s.status === "EXPIRED").length,
    };
  }, [summary, subscriptions, meta?.totalItems]);

  const applyOwnerSearch = () => {
    setPage(1);
    setAppliedOwnerSearch(ownerSearchInput.trim() || undefined);
  };

  const clearOwnerSearch = () => {
    setOwnerSearchInput("");
    setAppliedOwnerSearch(undefined);
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="relative flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge className="mb-2 flex w-fit items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              Quản trị viên
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Quản lý đăng ký
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
              Theo dõi và quản lý tất cả gói đăng ký. Lọc theo trạng thái, tìm
              theo chủ trang trại.
            </p>
          </div>
        </div>
      </section>

      <SubscriptionsKpiStrip
        counts={counts}
        loading={summaryQuery.isLoading && listQuery.isLoading}
      />

      <SubscriptionsLifecycleInsights
        summary={summary}
        loading={summaryQuery.isLoading}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Danh sách đăng ký</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                Nhấn “Mở” để xem chi tiết hoặc hủy gói.
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[200px_1fr_auto_auto]">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Trạng thái</p>
              <Select
                value={status}
                onValueChange={(v) => {
                  setPage(1);
                  setStatus(v as "ALL" | SubscriptionStatusType);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Chủ trang trại</p>
              <Input
                placeholder="Tên hoặc email..."
                value={ownerSearchInput}
                onChange={(e) => setOwnerSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyOwnerSearch();
                }}
              />
            </div>
            <Button
              variant="outline"
              onClick={applyOwnerSearch}
              disabled={!ownerSearchInput.trim()}
              className="md:self-end"
            >
              <Filter className="mr-2 h-4 w-4" />
              Áp dụng
            </Button>
            {appliedOwnerSearch && (
              <Button
                variant="ghost"
                onClick={clearOwnerSearch}
                className="md:self-end"
              >
                Xoá bộ lọc
              </Button>
            )}
          </div>
          <div className="min-h-150 flex flex-col">
          {listQuery.isError ? (
            <ErrorState
              message={getApiErrorMessageVi(
                listQuery.error,
                "Không thể tải danh sách đăng ký.",
              )}
              onRetry={() => listQuery.refetch()}
            />
          ) : !listQuery.isLoading && subscriptions.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Không có đăng ký phù hợp"
              description={
                status !== "ALL" || appliedOwnerSearch
                  ? "Thử xoá bộ lọc để xem tất cả đăng ký."
                  : "Chưa có đăng ký nào trong hệ thống."
              }
              action={
                status !== "ALL" || appliedOwnerSearch
                  ? {
                      label: "Xoá bộ lọc",
                      onClick: () => {
                        setStatus("ALL");
                        clearOwnerSearch();
                      },
                    }
                  : undefined
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border">
                <DataTable
                  columns={
                    [
                      {
                        id: "owner",
                        header: "Chủ trang trại",
                        cell: ({ row }) =>
                          row.original.owner ? (
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {row.original.owner.fullName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {row.original.owner.email}
                              </span>
                            </div>
                          ) : (
                            <span className="font-mono text-xs">
                              {row.original.ownerId.slice(0, 8)}…
                            </span>
                          ),
                      },
                      {
                        id: "plan",
                        header: "Gói",
                        cell: ({ row }) =>
                          row.original.plan?.name ??
                          row.original.planId.slice(0, 8),
                      },
                      {
                        accessorKey: "status",
                        header: "Trạng thái",
                        cell: ({ row }) => (
                          <SubscriptionStatusBadge
                            status={row.original.status}
                          />
                        ),
                      },
                      {
                        accessorKey: "expiresAt",
                        header: "Hết hạn",
                        cell: ({ row }) => (
                          <span className="text-sm text-muted-foreground">
                            {formatDateVi(row.original.expiresAt)}
                          </span>
                        ),
                      },
                      {
                        accessorKey: "createdAt",
                        header: "Ngày đăng ký",
                        cell: ({ row }) => (
                          <span className="text-sm text-muted-foreground">
                            {formatDateVi(row.original.createdAt)}
                          </span>
                        ),
                      },
                    ] as ColumnDef<SubscriptionResType>[]
                  }
                  data={subscriptions}
                  isLoading={listQuery.isLoading}
                  actions={[
                    {
                      key: "view",
                      label: "Xem chi tiết",
                      icon: Eye,
                      onSelect: (sub) => setSelectedSubId(sub.id),
                    },
                  ]}
                  onRowClick={(sub) => setSelectedSubId(sub.id)}
                  emptyText="Không có đăng ký phù hợp."
                />
              </div>
              <div className="flex items-center justify-between gap-3 mt-4">
                <p className="text-sm text-muted-foreground">
                  Trang {meta?.page ?? 1}/{meta?.totalPages ?? 1} · Tổng {meta?.totalItems ?? 0}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!meta?.hasPreviousPage}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Trang trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!meta?.hasNextPage}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            </>
          )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedSubId}
        onOpenChange={(open) => !open && setSelectedSubId(undefined)}
      >
        <DialogContent className="sm:max-w-[95vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3 pr-8">
              <div className="min-w-0 flex-1">
                <DialogTitle>Chi tiết đăng ký</DialogTitle>
                <DialogDescription>
                  Xem thông tin chi tiết của đăng ký này.
                </DialogDescription>
              </div>
              {(() => {
                const selectedSub = subscriptions.find(
                  (s) => s.id === selectedSubId,
                );
                return selectedSub ? (
                  <SubscriptionStatusBadge status={selectedSub.status} />
                ) : null;
              })()}
            </div>
          </DialogHeader>
          {selectedSubId && (
            <SubscriptionLifecycleManagementPage
              mode="admin"
              detailOnly
              initialSubscriptionId={selectedSubId}
              onBack={() => setSelectedSubId(undefined)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminSubscriptionsWorkspace;
