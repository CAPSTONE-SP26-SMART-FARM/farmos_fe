import { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams, type To } from "react-router";
import { ArrowLeft, CheckCircle2, RefreshCw, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/common/DataTable/DataTable";
import type { DataTableAction } from "@/components/common/DataTable/types";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingCard from "@/components/common/LoadingCard";
import ProPagination from "@/components/common/pro-pagination";
import {
  useAdminAttentionConfirmReturned,
  useAdminAttentionQueue,
} from "@/queries/useIotDeviceAdminOps";
import type {
  AttentionItemType,
  AttentionKindType,
  AttentionQueueQueryType,
} from "@/schemaValidatation/iotDeviceAdminOps";
import { AttentionBulkBar } from "./_components/attention/AttentionBulkBar";
import { AttentionStatCards } from "./_components/attention/AttentionStatCards";
import { buildAttentionColumns } from "./_components/attention/attention-columns";

const PAGE_SIZE = 20;

const KIND_TABS: Array<{ value: "all" | AttentionKindType; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "error", label: "Đang lỗi" },
  { value: "swap_pending_return", label: "Chờ về kho" },
];

function parseKind(raw: string | null): "all" | AttentionKindType {
  if (raw === "error" || raw === "swap_pending_return") return raw;
  return "all";
}

export default function AdminIotAttentionQueuePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const kindFilter = parseKind(searchParams.get("kind"));
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const apiQuery = useMemo<AttentionQueueQueryType>(
    () => ({
      ...(kindFilter !== "all" ? { kind: kindFilter } : {}),
      page,
      pageSize: PAGE_SIZE,
    }),
    [kindFilter, page],
  );

  const queueQuery = useAdminAttentionQueue(apiQuery);
  const confirmMutation = useAdminAttentionConfirmReturned();

  const data = queueQuery.data?.data;
  const items = useMemo(() => data?.items ?? [], [data]);

  const selectableIds = useMemo(
    () =>
      items
        .filter((i) => i.kind === "swap_pending_return")
        .map((i) => i.deviceId),
    [items],
  );
  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedIds.has(id));

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableIds));
    }
  }, [allSelected, selectableIds]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const columns = useMemo(
    () =>
      buildAttentionColumns({
        selectedIds,
        selectableIds,
        allSelected,
        onToggleOne: toggleOne,
        onToggleAll: toggleAll,
      }),
    [selectedIds, selectableIds, allSelected, toggleOne, toggleAll],
  );

  const handleConfirm = useCallback(async () => {
    setConfirmOpen(false);
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    await confirmMutation.mutateAsync({ deviceIds: ids });
    setSelectedIds(new Set());
  }, [confirmMutation, selectedIds]);

  const rowActions = useMemo<DataTableAction<AttentionItemType>[]>(
    () => [
      {
        key: "open-decision",
        label: "Mở trang quyết định",
        icon: Wrench,
        hidden: (row) => row.kind !== "error",
        onSelect: (row) =>
          navigate(`/dashboard/admin/iot-devices/${row.deviceId}/decision`),
      },
      {
        key: "confirm-returned",
        label: "Xác nhận đã thu hồi",
        icon: CheckCircle2,
        hidden: (row) => row.kind !== "swap_pending_return",
        disabled: () => confirmMutation.isPending,
        onSelect: (row) => {
          confirmMutation.mutate({ deviceIds: [row.deviceId] });
        },
      },
    ],
    [navigate, confirmMutation],
  );

  const handleTabChange = useCallback(
    (value: string) => {
      const next = new URLSearchParams(searchParams);
      if (value === "all") next.delete("kind");
      else next.set("kind", value);
      next.set("page", "1");
      setSearchParams(next);
      setSelectedIds(new Set());
    },
    [searchParams, setSearchParams],
  );

  const buildPageHref = useCallback(
    (p: number | null | undefined): To => {
      const next = new URLSearchParams(searchParams);
      next.set("page", String(p ?? 1));
      return { search: `?${next.toString()}` };
    },
    [searchParams],
  );

  if (queueQuery.isLoading) {
    return (
      <div aria-busy="true" aria-label="Đang tải danh sách thiết bị cần xử lý">
        <LoadingCard rows={5} />
      </div>
    );
  }
  if (queueQuery.isError) {
    return (
      <ErrorState
        title="Không tải được danh sách"
        message="Có lỗi khi tải danh sách thiết bị cần xử lý. Mời thử lại."
        onRetry={() => queueQuery.refetch()}
      />
    );
  }

  const totalPages = data?.pagination.totalPages ?? 0;
  const isEmpty = items.length === 0;

  return (
    <div className="space-y-4 p-4">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Thiết bị cần xử lý</h1>
            <p className="text-muted-foreground text-sm">
              Bộ kit IoT đang lỗi hoặc đã thay nhưng chưa thu hồi về kho.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queueQuery.refetch()}
          disabled={queueQuery.isFetching}
          aria-label="Làm mới danh sách"
        >
          <RefreshCw
            className={`mr-1 h-3 w-3 ${queueQuery.isFetching ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          {queueQuery.isFetching ? "Đang tải..." : "Làm mới"}
        </Button>
      </header>

      <AttentionStatCards
        totalDevices={data?.totalDevices ?? 0}
        totalErrorBoards={data?.totalErrorBoards ?? 0}
        totalSwapPendingReturn={data?.totalSwapPendingReturn ?? 0}
      />

      <Tabs value={kindFilter} onValueChange={handleTabChange}>
        <TabsList>
          {KIND_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <AttentionBulkBar
        selectedCount={selectedIds.size}
        isPending={confirmMutation.isPending}
        onClear={() => setSelectedIds(new Set())}
        onConfirm={() => setConfirmOpen(true)}
      />

      {isEmpty ? (
        <EmptyState
          title={
            kindFilter === "all"
              ? "Không có thiết bị nào cần xử lý"
              : "Không có thiết bị phù hợp với bộ lọc"
          }
          description={
            kindFilter === "all"
              ? "Toàn bộ bộ kit IoT đang hoạt động bình thường hoặc đã thu hồi đầy đủ."
              : "Thử chuyển sang tab khác hoặc bỏ bộ lọc."
          }
          action={
            kindFilter !== "all"
              ? { label: "Xem tất cả", onClick: () => handleTabChange("all") }
              : undefined
          }
        />
      ) : (
        <div
          aria-busy={queueQuery.isFetching ? "true" : "false"}
          className={
            queueQuery.isFetching
              ? "opacity-60 transition-opacity"
              : "transition-opacity"
          }
        >
          <DataTable
            columns={columns}
            data={items}
            actions={rowActions}
            emptyText="Không có thiết bị nào cần xử lý"
          />
        </div>
      )}

      {totalPages > 1 && (
        <ProPagination
          currentPage={page}
          totalPages={totalPages}
          buildHref={buildPageHref}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Xác nhận đã thu hồi về kho?"
        description={`${selectedIds.size} thiết bị sẽ được đánh dấu đã về kho và sẵn sàng cho khách khác thuê lại. Hành động này không thể hoàn tác.`}
        confirmLabel="Xác nhận"
        cancelLabel="Quay lại"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
