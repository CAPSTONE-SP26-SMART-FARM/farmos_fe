import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, CheckCircle2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingCard from "@/components/common/LoadingCard";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import {
  useAdminBulkSetStatus,
  useAdminInstallMarkBlocked,
  useAdminInstallQueue,
} from "@/queries/useIotDeviceAdminOps";
import type {
  BulkActionResType,
  InstallMarkBlockedBodyType,
  InstallQueueFarmType,
  InstallQueueQueryType,
  InstallQueueZoneType,
} from "@/schemaValidatation/iotDeviceAdminOps";
import { InstallQueueFilters } from "./_components/queue/InstallQueueFilters";
import { QueuePagination } from "./_components/queue/QueuePagination";
import { useFarmPickerOptions } from "./_components/queue/useFarmPickerOptions";
import { useQueueUrlParams } from "./_components/queue/useQueueUrlParams";
import { InstallFarmCard } from "./_components/install-queue/InstallFarmCard";
import { InstallQueueToolbar } from "./_components/install-queue/InstallQueueToolbar";
import { MarkBlockedDialog } from "./_components/install-queue/MarkBlockedDialog";
import { BulkActionBar } from "./_components/install-queue/BulkActionBar";
import { BulkConfirmDialog } from "./_components/install-queue/BulkConfirmDialog";
import { BulkResultDialog } from "./_components/install-queue/BulkResultDialog";
import {
  COLLAPSE_DEFAULT_THRESHOLD,
  sortInstallQueueFarms,
  type SortKey,
} from "./_components/install-queue/constants";

const INSTALL_FILTER_KEYS = ["farmId", "minAgeDays", "page"] as const;
const DEFAULT_PAGE_SIZE = 10;

export default function AdminIotInstallQueuePage() {
  const navigate = useNavigate();
  const { farmId, updateParams, clearParams, parseOptionalInt } =
    useQueueUrlParams();
  const minAgeDays = parseOptionalInt("minAgeDays");
  const page = parseOptionalInt("page") ?? 1;

  const apiQuery = useMemo<InstallQueueQueryType>(
    () => ({
      groupBy: "farm-zone",
      ...(farmId ? { farmId } : {}),
      ...(minAgeDays !== undefined ? { minAgeDays } : {}),
      page,
      pageSize: DEFAULT_PAGE_SIZE,
    }),
    [farmId, minAgeDays, page],
  );

  const queueQuery = useAdminInstallQueue(apiQuery);
  const bulkMutation = useAdminBulkSetStatus();
  const markBlockedMutation = useAdminInstallMarkBlocked();

  const hasActiveFilter = !!farmId || minAgeDays !== undefined;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleClearFilters = useCallback(() => {
    clearParams([...INSTALL_FILTER_KEYS]);
    setSelectedIds(new Set());
  }, [clearParams]);
  const [sortKey, setSortKey] = useState<SortKey>("oldestAge");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkActionResType | null>(null);

  const data = queueQuery.data?.data;
  const farms = data?.farms ?? [];
  const farmOptions = useFarmPickerOptions(farms, farmId);

  const setFilter = useCallback(
    (updates: Record<string, string | null>) => {
      updateParams(updates);
      setSelectedIds(new Set());
    },
    [updateParams],
  );
  const totalDevicesPending = data?.totalDevicesPending ?? 0;
  const totalFarms = data?.totalFarms ?? farms.length;
  const totalZones =
    data?.totalZones ?? farms.reduce((sum, f) => sum + f.zones.length, 0);
  const oldestAgeDays = data?.oldestAgeDays ?? 0;

  const deviceById = useMemo(() => {
    const map = new Map<string, { label: string; ownerName: string }>();
    for (const f of farms) {
      for (const z of f.zones) {
        for (const d of z.devices) {
          map.set(d.id, {
            label: d.label ?? d.id.slice(0, 8),
            ownerName: f.ownerName,
          });
        }
      }
    }
    return map;
  }, [farms]);

  const allDeviceIds = useMemo(
    () => Array.from(deviceById.keys()),
    [deviceById],
  );

  const sortedFarms = useMemo(
    () => sortInstallQueueFarms(farms, sortKey),
    [farms, sortKey],
  );

  const allSelected =
    allDeviceIds.length > 0 &&
    allDeviceIds.every((id) => selectedIds.has(id));

  const labelOf = (id: string) => deviceById.get(id)?.label ?? id.slice(0, 8);

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const everySelected = allDeviceIds.every((id) => prev.has(id));
      if (everySelected) return new Set();
      return new Set(allDeviceIds);
    });
  };

  const toggleDevice = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleFarm = (farm: InstallQueueFarmType) => {
    const ids = farm.zones.flatMap((z) => z.devices.map((d) => d.id));
    const allSelected = ids.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleZone = (zone: InstallQueueZoneType) => {
    const ids = zone.devices.map((d) => d.id);
    const allSelected = ids.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleBulkSubmit = () => {
    bulkMutation.mutate(
      {
        deviceIds: Array.from(selectedIds),
        status: "install",
        reason: "Admin xuất kho hàng loạt",
      },
      {
        onSuccess: (res) => {
          setBulkResult(res?.data ?? null);
          setConfirmOpen(false);
          setResultOpen(true);
          setSelectedIds(new Set());
        },
      },
    );
  };

  const handleMarkBlocked = (
    body: Omit<InstallMarkBlockedBodyType, "deviceIds">,
  ) => {
    markBlockedMutation.mutate(
      { ...body, deviceIds: Array.from(selectedIds) },
      {
        onSuccess: () => {
          setBlockOpen(false);
          setSelectedIds(new Set());
        },
      },
    );
  };

  const previewItems = useMemo(
    () =>
      Array.from(selectedIds).map((id) => {
        const d = deviceById.get(id);
        return {
          id,
          label: d?.label ?? id.slice(0, 8),
          ownerName: d?.ownerName ?? "—",
        };
      }),
    [selectedIds, deviceById],
  );

  if (queueQuery.isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <LoadingCard rows={3} />
        <LoadingCard rows={6} />
      </div>
    );
  }

  if (queueQuery.isError) {
    return (
      <div className="p-4 md:p-6">
        <ErrorState
          message="Không thể tải hàng đợi xuất kho. Vui lòng thử lại."
          onRetry={() => queueQuery.refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 pb-24 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard/admin/iot-devices")}
        >
          <ArrowLeft
            className="mr-1 h-4 w-4"
            aria-hidden
          />
          Quay lại danh sách
        </Button>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Hàng đợi xuất kho
          </h1>
          <p className="text-sm text-muted-foreground">
            Chọn thiết bị theo chuyến đi. Xuất kho hàng loạt hoặc đánh dấu không
            lắp được.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="gap-1 px-2 py-1"
          >
            <Package
              className="h-3.5 w-3.5"
              aria-hidden
            />
            Tổng: <strong>{totalDevicesPending}</strong> thiết bị
          </Badge>
          <Badge
            variant="outline"
            className="px-2 py-1"
          >
            {totalFarms} nông trại · {totalZones} khu vực
          </Badge>
          {oldestAgeDays > 0 && (
            <Badge
              variant="outline"
              className="px-2 py-1"
            >
              Chờ lâu nhất {oldestAgeDays} ngày
            </Badge>
          )}
        </div>
      </div>

      <InstallQueueFilters
        farmId={farmId}
        farmOptions={farmOptions}
        minAgeDays={minAgeDays}
        hasActiveFilter={hasActiveFilter}
        onFarmChange={(id) => setFilter({ farmId: id, page: null })}
        onMinAgeChange={(days) =>
          setFilter({
            minAgeDays: days === null ? null : String(days),
            page: null,
          })
        }
        onClearFilters={handleClearFilters}
      />

      {farms.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={
            hasActiveFilter
              ? "Không có thiết bị phù hợp bộ lọc"
              : "Không có thiết bị nào đang chờ xuất kho"
          }
          description={
            hasActiveFilter
              ? "Thử đổi điều kiện lọc hoặc xóa bộ lọc."
              : "Tất cả thiết bị đã được xuất kho."
          }
          action={
            hasActiveFilter
              ? { label: "Xóa bộ lọc", onClick: handleClearFilters }
              : {
                  label: "Quay lại danh sách thiết bị",
                  onClick: () => navigate("/dashboard/admin/iot-devices"),
                }
          }
        />
      ) : (
        <div className="space-y-3">
          <InstallQueueToolbar
            totalDeviceCount={allDeviceIds.length}
            allSelected={allSelected}
            sortKey={sortKey}
            onToggleSelectAll={toggleSelectAll}
            onSortChange={setSortKey}
          />
          {sortedFarms.map((farm) => (
            <InstallFarmCard
              key={farm.farmId ?? `no-farm-${farm.ownerId ?? "none"}`}
              farm={farm}
              selectedIds={selectedIds}
              defaultOpen={
                sortedFarms.length < COLLAPSE_DEFAULT_THRESHOLD
              }
              onToggleFarm={() => toggleFarm(farm)}
              onToggleZone={toggleZone}
              onToggleDevice={toggleDevice}
            />
          ))}
          <QueuePagination
            pagination={data?.pagination}
            onPageChange={(p: number) =>
              setFilter({ page: p === 1 ? null : String(p) })
            }
          />
        </div>
      )}

      <BulkActionBar
        selectedCount={selectedIds.size}
        totalCount={allDeviceIds.length}
        isPrimaryPending={bulkMutation.isPending}
        primaryLabel="Đánh dấu Đang lắp đặt"
        onClearSelection={() => setSelectedIds(new Set())}
        onPrimary={() => setConfirmOpen(true)}
        secondary={{
          label: "Không lắp được",
          onClick: () => setBlockOpen(true),
          isPending: markBlockedMutation.isPending,
        }}
      />

      <BulkConfirmDialog
        open={confirmOpen}
        count={selectedIds.size}
        preview={previewItems}
        isPending={bulkMutation.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleBulkSubmit}
      />

      <MarkBlockedDialog
        open={blockOpen}
        deviceCount={selectedIds.size}
        isPending={markBlockedMutation.isPending}
        onCancel={() => setBlockOpen(false)}
        onConfirm={handleMarkBlocked}
      />

      <BulkResultDialog
        open={resultOpen}
        result={bulkResult}
        labelOf={labelOf}
        onClose={() => setResultOpen(false)}
      />
    </div>
  );
}
