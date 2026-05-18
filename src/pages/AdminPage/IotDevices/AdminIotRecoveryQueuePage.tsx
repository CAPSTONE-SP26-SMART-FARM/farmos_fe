import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, CheckCircle2, Loader2, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingCard from "@/components/common/LoadingCard";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import {
  useAdminRecoveryBulkComplete,
  useAdminRecoveryQueue,
} from "@/queries/useIotDeviceAdminOps";
import type {
  RecoveryFarmType,
  RecoveryQueueQueryType,
  RecoveryZoneType,
} from "@/schemaValidatation/iotDeviceAdminOps";
import { RecoveryQueueFilters } from "./_components/queue/RecoveryQueueFilters";
import { QueuePagination } from "./_components/queue/QueuePagination";
import { useFarmPickerOptions } from "./_components/queue/useFarmPickerOptions";
import { useQueueUrlParams } from "./_components/queue/useQueueUrlParams";
import { BulkActionBar } from "./_components/install-queue/BulkActionBar";
import { RecoveryFarmCard } from "./_components/recovery/RecoveryFarmCard";
import { RecoveryCompleteDialog } from "./_components/recovery/RecoveryCompleteDialog";
import { RecoveryQueueToolbar } from "./_components/recovery/RecoveryQueueToolbar";
import {
  COLLAPSE_DEFAULT_THRESHOLD,
  sortRecoveryQueueFarms,
  type RecoverySortKey,
} from "./_components/recovery/constants";

interface DeviceLookup {
  label: string;
  zoneName: string | null;
  isOnline: boolean;
}

const RECOVERY_FILTER_KEYS = [
  "farmId",
  "minDaysOverdue",
  "onlineOnly",
  "page",
] as const;
const DEFAULT_PAGE_SIZE = 10;

export default function AdminIotRecoveryQueuePage() {
  const navigate = useNavigate();
  const { farmId, updateParams, clearParams, parseOptionalInt, parseBoolFlag } =
    useQueueUrlParams();
  const minDaysOverdue = parseOptionalInt("minDaysOverdue");
  const onlineOnly = parseBoolFlag("onlineOnly");
  const page = parseOptionalInt("page") ?? 1;

  const apiQuery = useMemo<RecoveryQueueQueryType>(
    () => ({
      groupBy: "farm-zone",
      ...(farmId ? { farmId } : {}),
      ...(minDaysOverdue !== undefined ? { minDaysOverdue } : {}),
      ...(onlineOnly ? { onlineOnly: true } : {}),
      page,
      pageSize: DEFAULT_PAGE_SIZE,
    }),
    [farmId, minDaysOverdue, onlineOnly, page],
  );

  const queueQuery = useAdminRecoveryQueue(apiQuery);
  const bulkMutation = useAdminRecoveryBulkComplete();

  const hasActiveFilter =
    !!farmId || minDaysOverdue !== undefined || onlineOnly;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleClearFilters = useCallback(() => {
    clearParams([...RECOVERY_FILTER_KEYS]);
    setSelectedIds(new Set());
  }, [clearParams]);
  const setFilter = useCallback(
    (updates: Record<string, string | null>) => {
      updateParams(updates);
      setSelectedIds(new Set());
    },
    [updateParams],
  );
  const [sortKey, setSortKey] = useState<RecoverySortKey>("oldestOverdue");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const data = queueQuery.data?.data;
  const farms = data?.farms ?? [];
  const farmOptions = useFarmPickerOptions(farms, farmId);

  const deviceById = useMemo(() => {
    const map = new Map<string, DeviceLookup>();
    for (const f of farms) {
      for (const z of f.zones) {
        for (const d of z.devices) {
          map.set(d.id, {
            label: d.label ?? d.id.slice(0, 8),
            zoneName: z.zoneName,
            isOnline: d.isOnline,
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
    () => sortRecoveryQueueFarms(farms, sortKey),
    [farms, sortKey],
  );

  const allSelected =
    allDeviceIds.length > 0 &&
    allDeviceIds.every((id) => selectedIds.has(id));

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

  const toggleFarm = (farm: RecoveryFarmType) => {
    const ids = farm.zones.flatMap((z) => z.devices.map((d) => d.id));
    const everySelected = ids.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (everySelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleZone = (zone: RecoveryZoneType) => {
    const ids = zone.devices.map((d) => d.id);
    const everySelected = ids.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (everySelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const selectedDevices = useMemo(
    () =>
      Array.from(selectedIds).map((id) => ({
        id,
        label: deviceById.get(id)?.label ?? id.slice(0, 8),
        zoneName: deviceById.get(id)?.zoneName ?? null,
        isOnline: deviceById.get(id)?.isOnline ?? false,
      })),
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
          message="Không thể tải hàng đợi thu hồi. Vui lòng thử lại."
          onRetry={() => queueQuery.refetch()}
        />
      </div>
    );
  }

  const totalPending = data?.totalDevicesPending ?? 0;
  const totalFarms = data?.totalFarms ?? farms.length;
  const totalZones =
    data?.totalZones ?? farms.reduce((sum, f) => sum + f.zones.length, 0);
  const oldestOverdueDays = data?.oldestOverdueDays ?? 0;

  return (
    <div className="space-y-4 p-4 pb-24 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard/admin/iot-devices")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
          Quay lại danh sách
        </Button>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Hàng đợi thu hồi
          </h1>
          <p className="text-sm text-muted-foreground">
            Chọn thiết bị theo chuyến thu hồi và ghi kết quả từng bộ (thu được
            hoặc không thu được).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1 px-2 py-1">
            <Package className="h-3.5 w-3.5" aria-hidden />
            Tổng: <strong>{totalPending}</strong> thiết bị
          </Badge>
          <Badge variant="outline" className="px-2 py-1">
            {totalFarms} nông trại · {totalZones} khu vực
          </Badge>
          <Badge
            variant="outline"
            className={`px-2 py-1 text-destructive transition-opacity ${
              oldestOverdueDays > 0 ? "opacity-100" : "invisible"
            }`}
          >
            Quá hạn lâu nhất {oldestOverdueDays} ngày
          </Badge>
          <Loader2
            className={`h-4 w-4 animate-spin text-muted-foreground transition-opacity ${
              queueQuery.isFetching && !queueQuery.isLoading
                ? "opacity-100"
                : "opacity-0"
            }`}
            aria-label="Đang làm mới"
          />
        </div>
      </div>

      <RecoveryQueueFilters
        farmId={farmId}
        farmOptions={farmOptions}
        minDaysOverdue={minDaysOverdue}
        onlineOnly={onlineOnly}
        hasActiveFilter={hasActiveFilter}
        onFarmChange={(id) => setFilter({ farmId: id, page: null })}
        onMinOverdueChange={(days) =>
          setFilter({
            minDaysOverdue: days === null ? null : String(days),
            page: null,
          })
        }
        onOnlineOnlyChange={(checked) =>
          setFilter({ onlineOnly: checked ? "1" : null, page: null })
        }
        onClearFilters={handleClearFilters}
      />

      {farms.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={
            hasActiveFilter
              ? "Không có thiết bị phù hợp bộ lọc"
              : "Không có thiết bị nào cần thu hồi"
          }
          description={
            hasActiveFilter
              ? "Thử đổi điều kiện lọc hoặc xóa bộ lọc."
              : "Tất cả gói đăng ký đang trong hạn hoặc đã thu xong."
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
          <RecoveryQueueToolbar
            totalDeviceCount={allDeviceIds.length}
            allSelected={allSelected}
            sortKey={sortKey}
            onToggleSelectAll={toggleSelectAll}
            onSortChange={setSortKey}
          />
          {sortedFarms.map((farm) => (
            <RecoveryFarmCard
              key={farm.farmId ?? `no-farm-${farm.ownerId ?? "none"}`}
              farm={farm}
              selectedIds={selectedIds}
              defaultOpen={sortedFarms.length < COLLAPSE_DEFAULT_THRESHOLD}
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
        primaryLabel="Hoàn tất chuyến thu hồi"
        primaryIcon={Truck}
        onClearSelection={() => setSelectedIds(new Set())}
        onPrimary={() => setConfirmOpen(true)}
      />

      <RecoveryCompleteDialog
        open={confirmOpen}
        devices={selectedDevices}
        isPending={bulkMutation.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={(body) =>
          bulkMutation.mutate(body, {
            onSuccess: () => {
              setConfirmOpen(false);
              setSelectedIds(new Set());
            },
          })
        }
      />
    </div>
  );
}
