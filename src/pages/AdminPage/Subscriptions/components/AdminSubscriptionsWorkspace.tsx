import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import SubscriptionStatusBadge from "@/components/common/SubscriptionStatusBadge";
import TableSkeleton from "@/components/common/TableSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateVi } from "@/lib/format";
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  useAdminListSubscriptions,
  useAdminSubscriptionsSummary,
} from "@/queries/useSubscription";
import type {
  ListSubscriptionsQueryType,
  SubscriptionStatusType,
} from "@/schemaValidatation/subscription";
import { Filter, Inbox, Shield } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import StatusFilterPills from "./StatusFilterPills";
import SubscriptionsKpiStrip, { type KpiCounts } from "./SubscriptionsKpiStrip";
import SubscriptionsLifecycleInsights from "./SubscriptionsLifecycleInsights";

function AdminSubscriptionsWorkspace() {
  const navigate = useNavigate();

  const [status, setStatus] = useState<"ALL" | SubscriptionStatusType>("ALL");
  const [ownerSearchInput, setOwnerSearchInput] = useState("");
  const [appliedOwnerSearch, setAppliedOwnerSearch] = useState<
    string | undefined
  >(undefined);
  const [page, setPage] = useState(1);

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
          <CardTitle>Bộ lọc</CardTitle>
          <CardDescription>
            Chọn trạng thái và (nếu cần) dán ID chủ trại để thu hẹp kết quả.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatusFilterPills
            value={status}
            onChange={(next) => {
              setPage(1);
              setStatus(next);
            }}
          />
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <Input
              placeholder="Tên hoặc email chủ trại"
              value={ownerSearchInput}
              onChange={(e) => setOwnerSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyOwnerSearch();
              }}
            />
            <Button
              variant="outline"
              onClick={applyOwnerSearch}
              disabled={!ownerSearchInput.trim()}
            >
              <Filter className="mr-2 h-4 w-4" />
              Áp dụng
            </Button>
            {appliedOwnerSearch && (
              <Button
                variant="ghost"
                onClick={clearOwnerSearch}
              >
                Xoá bộ lọc
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách đăng ký</CardTitle>
          <CardDescription>
            Nhấn “Mở” để xem chi tiết hoặc hủy gói.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {listQuery.isLoading ? (
            <TableSkeleton />
          ) : listQuery.isError ? (
            <ErrorState
              message={getApiErrorMessageVi(
                listQuery.error,
                "Không thể tải danh sách đăng ký.",
              )}
              onRetry={() => listQuery.refetch()}
            />
          ) : subscriptions.length === 0 ? (
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chủ trại</TableHead>
                      <TableHead>Gói</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Hết hạn</TableHead>
                      <TableHead>Ngày đăng ký</TableHead>
                      <TableHead>Tự động gia hạn</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          {sub.owner ? (
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {sub.owner.fullName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {sub.owner.email}
                              </span>
                            </div>
                          ) : (
                            <span className="font-mono text-xs">
                              {sub.ownerId.slice(0, 8)}…
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {sub.plan?.name ?? sub.planId.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <SubscriptionStatusBadge status={sub.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateVi(sub.expiresAt)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateVi(sub.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={sub.autoRenew ? "default" : "outline"}
                          >
                            {sub.autoRenew ? "Bật" : "Tắt"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(
                                `/dashboard/admin/subscriptions/${sub.id}`,
                              )
                            }
                          >
                            Mở
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Trang {meta.page}/{meta.totalPages} · Tổng {meta.totalItems}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!meta.hasPreviousPage}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Trang trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!meta.hasNextPage}
                      onClick={() => setPage((p) => p + 1)}
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

export default AdminSubscriptionsWorkspace;
