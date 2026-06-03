import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import KpiCard from "@/components/common/KpiCard";
import ProPagination from "@/components/common/pro-pagination";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import {
  AlertCircle,
  ChevronDown,
  Cpu,
  LayoutDashboard,
  Loader2,
  MapPinOff,
  Package,
  PackageCheck,
  PlugZap,
  Plus,
  Power,
  ShieldOff,
  Truck,
  Undo2,
  Wrench,
} from "lucide-react";
import useDebounce from "@/hooks/useDebounce";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import IotDeviceDetail from "@/pages/OwnerPage/IotDevices/IotDeviceDetail";
import IotDeviceForm from "@/pages/OwnerPage/IotDevices/IotDeviceForm";
import {
  useAdminDeleteIotDevice,
  useAdminIotDeviceDetail,
  useAdminListIotDevices,
} from "@/queries/useIotDevice";
import { useAdminIotOverview } from "@/queries/useIotDeviceAdminOps";
import type {
  DeviceStatusType,
  IotDeviceResType,
  ListIotDevicesQueryType,
} from "@/schemaValidatation/iotDevice";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IotDeviceFilterBar } from "./_components/IotDeviceFilterBar";
import { IotDeviceTableRow } from "./_components/IotDeviceTableRow";
import { IotDeviceListSkeleton } from "./_components/IotDeviceListSkeleton";
import { DeleteIotDeviceAlert } from "./_components/DeleteIotDeviceAlert";

const VALID_STATUSES: DeviceStatusType[] = [
  "available",
  "purchase",
  "install",
  "inactive",
  "active",
  "error",
  "revoked",
  "lost",
];

function parseStatus(value: string | null): DeviceStatusType | "all" {
  if (!value) return "all";
  return VALID_STATUSES.includes(value as DeviceStatusType)
    ? (value as DeviceStatusType)
    : "all";
}

function parsePositiveInt(value: string | null, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default function AdminIotDevicesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(
    undefined,
  );
  const [dialogMode, setDialogMode] = useState<"view" | "edit">("view");
  const detailQuery = useAdminIotDeviceDetail(
    selectedDeviceId ?? "",
    Boolean(selectedDeviceId) && dialogMode === "edit",
  );

  // ── URL = source of truth ──────────────────────────────────────────
  const urlSearch = searchParams.get("search") ?? "";
  const status = parseStatus(searchParams.get("status"));
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const limit = parsePositiveInt(searchParams.get("limit"), 10);

  // Local input giữ trải nghiệm gõ mượt; debounce → đẩy lên URL
  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput, 500);

  // Sync URL ← input khi debounce thay đổi (không sync ngược lại để
  // tránh vòng lặp; user chỉnh URL trực tiếp = ít gặp với admin).
  useEffect(() => {
    if (debouncedSearch === urlSearch) return;
    const next = new URLSearchParams(searchParams);
    if (debouncedSearch) next.set("search", debouncedSearch);
    else next.delete("search");
    next.delete("page");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleStatusChange = useCallback(
    (next: DeviceStatusType | "all") => {
      updateParams({
        status: next === "all" ? null : next,
        page: null,
      });
    },
    [updateParams],
  );

  const handleLimitChange = useCallback(
    (next: number) => {
      updateParams({
        limit: next === 10 ? null : String(next),
        page: null,
      });
    },
    [updateParams],
  );

  const handleClearFilters = useCallback(() => {
    setSearchInput("");
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  const hasActiveFilter = status !== "all" || urlSearch !== "";

  // ── Query ──────────────────────────────────────────────────────────
  const effectiveQuery = useMemo<ListIotDevicesQueryType>(
    () => ({
      page,
      limit,
      search: urlSearch || undefined,
      status: status !== "all" ? status : undefined,
    }),
    [page, limit, urlSearch, status],
  );

  const listQuery = useAdminListIotDevices(effectiveQuery);
  const overviewQuery = useAdminIotOverview();
  const inv = overviewQuery.data?.data?.inventoryHealth;
  const deleteMutation = useAdminDeleteIotDevice();

  const kpiItems = useMemo(
    () => [
      {
        key: "available" as const,
        label: "Có thể sử dụng",
        value: inv?.available ?? 0,
        icon: Package,
        tone: "default" as const,
      },
      {
        key: "purchase" as const,
        label: "Đã cho thuê",
        value: inv?.purchase ?? 0,
        icon: PackageCheck,
        tone: "default" as const,
      },
      {
        key: "install" as const,
        label: "Đang lắp đặt",
        value: inv?.install ?? 0,
        icon: Wrench,
        tone: "warning" as const,
      },
      {
        key: "inactive" as const,
        label: "Đã lắp, chờ kết nối",
        value: inv?.inactive ?? 0,
        icon: PlugZap,
        tone: "default" as const,
      },
      {
        key: "active" as const,
        label: "Hoạt động",
        value: inv?.active ?? 0,
        icon: Power,
        tone: "success" as const,
      },
      {
        key: "error" as const,
        label: "Có lỗi",
        value: inv?.error ?? 0,
        icon: AlertCircle,
        tone: "danger" as const,
      },
      {
        key: "revoked" as const,
        label: "Đã thu hồi",
        value: inv?.revoked ?? 0,
        icon: ShieldOff,
        tone: "default" as const,
      },
      {
        key: "lost" as const,
        label: "Bị mất",
        value: inv?.lost ?? 0,
        icon: MapPinOff,
        tone: "danger" as const,
      },
    ],
    [inv],
  );

  const devices = listQuery.data?.data?.data ?? [];
  const meta = listQuery.data?.data?.meta;

  // ── Delete confirm state ───────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<IotDeviceResType | null>(
    null,
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Bộ kit đã được xoá thành công");
      setDeleteTarget(null);
    } catch {
      // onMutationError trong query hook đã toast lỗi
    }
  }, [deleteMutation, deleteTarget]);

  return (
    <div className="space-y-4">
      {/* Page header — compact */}
      <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            Quản lý bộ kit IoT
          </h1>
          <p className="text-sm text-muted-foreground">
            Tạo, cập nhật và theo dõi vòng đời thiết bị IoT.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Truck className="mr-2 h-4 w-4" />
                Hàng đợi & tổng quan
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Điều hướng IoT</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  navigate("/dashboard/admin/iot-devices/dashboard")
                }
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Tổng quan IoT
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  navigate(
                    "/dashboard/admin/iot-kit-requests?type=INSTALL_SCHEDULE&status=pending",
                  )
                }
              >
                <Truck className="mr-2 h-4 w-4" />
                Yêu cầu cần lắp đặt
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  navigate(
                    "/dashboard/admin/iot-kit-requests?type=RECOVERY_SCHEDULE&status=pending",
                  )
                }
              >
                <Undo2 className="mr-2 h-4 w-4" />
                Yêu cầu cần thu lại
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() => navigate("/dashboard/admin/iot-devices/create")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tạo bộ kit mới
          </Button>
        </div>
      </section>

      {/* KPI strip — click to filter by status */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {kpiItems.map((item) => (
          <KpiCard
            key={item.key}
            icon={item.icon}
            label={item.label}
            value={overviewQuery.isLoading ? "…" : item.value}
            tone={item.tone}
            active={status === item.key}
            onClick={() =>
              handleStatusChange(status === item.key ? "all" : item.key)
            }
          />
        ))}
      </div>

      {/* Filter bar with inline title + count */}
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Cpu className="h-4 w-4 text-primary" aria-hidden />
          <span>Danh sách thiết bị</span>
          <span className="text-xs font-normal text-muted-foreground">
            · {meta ? `${meta.totalItems} kết quả` : "—"}
          </span>
          <Loader2
            className={`h-3.5 w-3.5 animate-spin text-muted-foreground transition-opacity ${
              listQuery.isFetching && !listQuery.isLoading
                ? "opacity-100"
                : "opacity-0"
            }`}
            aria-label="Đang làm mới"
          />
        </div>
        <IotDeviceFilterBar
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          status={status}
          onStatusChange={handleStatusChange}
          limit={limit}
          onLimitChange={handleLimitChange}
          hasActiveFilter={hasActiveFilter}
          onClear={handleClearFilters}
        />
      </div>

      <div className="min-h-[420px]">
        {listQuery.isError ? (
            <ErrorState
              message="Không thể tải danh sách thiết bị. Thử lại sau."
              onRetry={() => listQuery.refetch()}
            />
          ) : !listQuery.isLoading && devices.length === 0 ? (
            hasActiveFilter ? (
              <EmptyState
                title="Không tìm thấy thiết bị phù hợp"
                description="Thử thay đổi từ khoá hoặc trạng thái lọc."
                action={{
                  label: "Xóa bộ lọc",
                  onClick: handleClearFilters,
                }}
              />
            ) : (
              <EmptyState
                title="Chưa có thiết bị IoT nào"
                description="Tạo bộ kit đầu tiên để bắt đầu cấu hình vòng đời thiết bị."
                action={{
                  label: "Tạo bộ kit mới",
                  onClick: () =>
                    navigate("/dashboard/admin/iot-devices/create"),
                }}
              />
            )
          ) : (
            <div className="rounded-lg border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-30">Nhãn</TableHead>
                    <TableHead className="min-w-55">Tên thiết bị</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Loại
                    </TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Chủ sở hữu / Nông trại
                    </TableHead>
                    <TableHead className="w-14 text-right">
                      <span className="sr-only">Hành động</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listQuery.isLoading ? (
                    <IotDeviceListSkeleton />
                  ) : (
                    devices.map((device) => (
                      <IotDeviceTableRow
                        key={device.id}
                        device={device}
                        onDelete={setDeleteTarget}
                        onView={(d) => {
                          setSelectedDeviceId(d.id);
                          setDialogMode("view");
                        }}
                        onEdit={(d) => {
                          setSelectedDeviceId(d.id);
                          setDialogMode("edit");
                        }}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 flex flex-col items-center gap-2 text-xs text-muted-foreground sm:flex-row sm:justify-between">
            {meta ? (
              <span>
                {meta.totalPages > 1
                  ? `Trang ${meta.page} / ${meta.totalPages} · `
                  : ""}
                {meta.totalItems} thiết bị
              </span>
            ) : (
              <span />
            )}
            {meta && meta.totalPages > 1 && (
              <ProPagination
                currentPage={meta.page}
                totalPages={meta.totalPages}
                buildHref={(p) => {
                  const params = new URLSearchParams(searchParams);
                  const next = p ?? 1;
                  if (next === 1) params.delete("page");
                  else params.set("page", String(next));
                  return { search: params.toString() };
                }}
              />
            )}
          </div>
      </div>

      <DeleteIotDeviceAlert
        device={deleteTarget}
        isPending={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <Dialog
        open={!!selectedDeviceId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDeviceId(undefined);
            setDialogMode("view");
          }
        }}
      >
        <DialogContent className="sm:max-w-[95vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "edit" ? "Chỉnh sửa thiết bị IoT" : "Chi tiết thiết bị IoT"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "edit"
                ? "Cập nhật thông tin thiết bị, cảm biến và sub-devices."
                : "Xem thông tin thiết bị, lịch sử log và trạng thái gán."}
            </DialogDescription>
          </DialogHeader>
          {selectedDeviceId && dialogMode === "view" && (
            <IotDeviceDetail
              deviceId={selectedDeviceId}
              farmId=""
              actor="admin"
              onBack={() => {
                setSelectedDeviceId(undefined);
                setDialogMode("view");
              }}
              onEdit={() => setDialogMode("edit")}
            />
          )}
          {selectedDeviceId && dialogMode === "edit" && detailQuery.data?.data && (
            <IotDeviceForm
              farmId=""
              actor="admin"
              device={detailQuery.data.data}
              onBack={() => setDialogMode("view")}
              onBackRequested={() => setDialogMode("view")}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
