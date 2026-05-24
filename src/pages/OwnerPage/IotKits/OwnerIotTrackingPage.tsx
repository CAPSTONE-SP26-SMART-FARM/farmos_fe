import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import KpiCard from "@/components/common/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { formatCurrencyVnd, formatDateVi } from "@/lib/format";
import { cn, isApiErrorResponse } from "@/lib/utils";
import { useMyIotTracking } from "@/queries/useIotKit";
import {
  type IotKitOrderStatus,
  type OwnerKitOrderTrackingType,
  type ProvisionedDeviceSummaryType,
} from "@/schemaValidatation/iotKit";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  ChevronRight,
  CircleSlash,
  Cpu,
  Package,
  PackagePlus,
  Search,
  ShoppingBag,
  Wifi,
} from "lucide-react";
import { useMemo, useState } from "react";
import IotKitOrderDetailDialog from "@/pages/OwnerPage/Subscriptions/components/IotKitOrderDetailDialog";
import ProvisionedDeviceDetailDialog from "./components/ProvisionedDeviceDetailDialog";
import { Link, useNavigate } from "react-router";

const ORDER_STATUS_META: Record<
  IotKitOrderStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Chờ thanh toán",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  PAID: {
    label: "Đã thanh toán",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  CANCELLED: {
    label: "Đã hủy",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  },
  REFUNDED: {
    label: "Đã hoàn tiền",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  },
};

const DEVICE_STATUS_LABEL: Record<string, string> = {
  available: "Có thể sử dụng",
  purchase: "Khả dụng",
  install: "Đang cài đặt",
  inactive: "Đợi giai đoạn bắt đầu",
  active: "Hoạt động",
  error: "Lỗi",
  revoked: "Thu hồi",
};

const DEVICE_STATUS_BADGE_CLASS: Record<string, string> = {
  available:
    "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
  purchase:
    "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
  install:
    "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  inactive:
    "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300",
  active:
    "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  error:
    "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  revoked:
    "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
};

const DEVICES_PER_PAGE = 8;

export default function OwnerIotTrackingPage({
  embedded = false,
}: {
  embedded?: boolean;
} = {}) {
  const navigate = useNavigate();
  const trackingQuery = useMyIotTracking();
  const [selectedOrder, setSelectedOrder] =
    useState<OwnerKitOrderTrackingType | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<
    "ALL" | IotKitOrderStatus
  >("ALL");

  const kitOrders = trackingQuery.data?.data?.kitOrders ?? [];
  const filteredKitOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return kitOrders.filter((o) => {
      if (orderStatusFilter !== "ALL" && o.status !== orderStatusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.kit.name.toLowerCase().includes(q) ||
        o.kit.code.toLowerCase().includes(q)
      );
    });
  }, [kitOrders, orderSearch, orderStatusFilter]);

  if (trackingQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (trackingQuery.isError) {
    const noActiveSub =
      isApiErrorResponse(trackingQuery.error) &&
      trackingQuery.error.response?.status === 422;

    if (noActiveSub) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Theo dõi gán Iot kit</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={CircleSlash}
              title="Chưa có gói đăng ký active"
              description="Bạn cần có gói đăng ký đang hoạt động để xem các Iot kit đã được gán."
              action={{
                label: "Xem gói đăng ký",
                onClick: () => navigate("/dashboard/owner/subscription-plans"),
              }}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <ErrorState
        message="Không tải được dữ liệu gán Iot kit."
        onRetry={() => trackingQuery.refetch()}
      />
    );
  }

  const data = trackingQuery.data?.data;
  if (!data) return null;

  const { quota, subscriptionDevices } = data;
  const totalCapacity = quota.subscriptionMax + quota.kitBonus;
  const usageRatio = totalCapacity > 0 ? quota.used / totalCapacity : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {!embedded && (
        <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <Badge className="mb-2">Theo dõi</Badge>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Gán Iot kit
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                Tổng quan hạn mức, các bộ kit đã mua và Iot kit được gán cho
                bạn.
              </p>
            </div>
            <Button asChild>
              <Link to="/dashboard/owner/iot-kits">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Mua thêm kit
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* Quota overview */}
      <Card>
        <CardHeader>
          <CardTitle>Hạn mức thiết bị IoT</CardTitle>
          <CardDescription>
            Cộng dồn từ gói đăng ký và các bộ kit đã mua
            {quota.expiresAt
              ? ` · hết hạn ${formatDateVi(quota.expiresAt)}`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <KpiCard
              icon={Package}
              label="Hạn mức gói"
              value={quota.subscriptionMax}
            />
            <KpiCard
              icon={PackagePlus}
              label="IoT kit mua thêm"
              value={quota.kitBonus}
              tone="success"
              hint={
                quota.kitBonus > 0
                  ? `+${quota.kitBonus} từ kit đã mua`
                  : undefined
              }
            />
            <KpiCard
              icon={Cpu}
              label="Đang sử dụng"
              value={quota.used}
              tone={usageRatio >= 0.8 ? "warning" : "default"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Subscription devices — devices admin gán trực tiếp qua hạn mức gói */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-primary" />
                Thiết bị từ gói đăng ký ({subscriptionDevices.length})
              </CardTitle>
              <CardDescription>
                Các thiết bị nằm trong hạn mức của gói đăng ký. Khi gói hết
                hạn, các thiết bị này sẽ bị thu hồi.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={() => navigate("/dashboard/owner/iot?tab=devices")}
            >
              Xem tất cả thiết bị
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DeviceTable
            devices={subscriptionDevices}
            emptyText="Chưa có thiết bị nào được cấp qua gói đăng ký."
            onRowClick={(d) => setSelectedDeviceId(d.id)}
          />
        </CardContent>
      </Card>

      {/* Kit orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Đơn kit đã mua ({kitOrders.length})
          </CardTitle>
          <CardDescription>
            Mỗi đơn hiển thị bộ kit đã mua, slot quota và các thiết bị đã được
            gán.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {kitOrders.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="Chưa có đơn kit nào"
              description="Mua kit để mở rộng hạn mức thiết bị IoT."
              action={{
                label: "Mua kit",
                onClick: () => navigate("/dashboard/owner/iot-kits"),
              }}
            />
          ) : (
            <>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Tìm theo mã đơn, tên kit hoặc mã kit…"
                    className="pl-8"
                  />
                </div>
                <Select
                  value={orderStatusFilter}
                  onValueChange={(v) =>
                    setOrderStatusFilter(v as typeof orderStatusFilter)
                  }
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                    {(
                      Object.entries(ORDER_STATUS_META) as Array<
                        [IotKitOrderStatus, { label: string }]
                      >
                    ).map(([value, meta]) => (
                      <SelectItem key={value} value={value}>
                        {meta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filteredKitOrders.length === 0 ? (
                <p className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
                  Không có đơn nào khớp với bộ lọc hiện tại.
                </p>
              ) : (
                filteredKitOrders.map((order) => (
                  <KitOrderCard
                    key={order.orderId}
                    order={order}
                    onOpen={() => setSelectedOrder(order)}
                  />
                ))
              )}
            </>
          )}
        </CardContent>
      </Card>

      <IotKitOrderDetailDialog
        order={selectedOrder}
        open={selectedOrder !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedOrder(null);
        }}
      />

      <ProvisionedDeviceDetailDialog
        deviceId={selectedDeviceId}
        open={selectedDeviceId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDeviceId(null);
        }}
      />
    </div>
  );
}

function KitOrderCard({
  order,
  onOpen,
}: {
  order: OwnerKitOrderTrackingType;
  onOpen: () => void;
}) {
  const meta = ORDER_STATUS_META[order.status];
  const pct =
    order.totalSlots > 0
      ? Math.min(100, (order.usedSlots / order.totalSlots) * 100)
      : 0;
  const full = pct >= 100;
  const near = pct >= 80 && !full;
  const isPaid = order.status === "PAID";
  const isAssigned = order.devices.length > 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-start justify-between gap-3 rounded-xl border bg-background p-4 text-left transition-colors hover:bg-muted/40 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">#{order.orderNumber}</p>
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-xs font-medium",
              meta.className,
            )}
          >
            {meta.label}
          </span>
          {isPaid && (
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-medium",
                isAssigned
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
              )}
            >
              {isAssigned ? "Đã gán Iot kit" : "Chưa gán Iot kit"}
            </span>
          )}
        </div>
        <p className="truncate text-sm font-medium">{order.kit.name}</p>
        {isPaid && (
          <div className="flex items-center gap-3">
            <Progress
              value={pct}
              className={cn(
                "h-1.5 flex-1",
                full && "[&>div]:bg-red-500",
                near && "[&>div]:bg-amber-500",
              )}
            />
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              <span
                className={cn(
                  "font-semibold",
                  full && "text-red-600",
                  near && "text-amber-600",
                )}
              >
                {order.usedSlots}
              </span>
              <span> / {order.totalSlots} slot</span>
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 text-right">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Tổng tiền
          </p>
          <p className="text-base font-semibold tabular-nums">
            {formatCurrencyVnd(order.totalAmount)}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
    </button>
  );
}

function DeviceTable({
  devices,
  emptyText,
  compact = false,
  onRowClick,
}: {
  devices: ProvisionedDeviceSummaryType[];
  emptyText: string;
  compact?: boolean;
  onRowClick?: (device: ProvisionedDeviceSummaryType) => void;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(devices.length / DEVICES_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = devices.slice(
    (safePage - 1) * DEVICES_PER_PAGE,
    safePage * DEVICES_PER_PAGE,
  );

  if (devices.length === 0) {
    return (
      <p
        className={cn(
          "text-center text-sm text-muted-foreground",
          compact ? "py-4" : "py-8",
        )}
      >
        {emptyText}
      </p>
    );
  }

  const columns: ColumnDef<ProvisionedDeviceSummaryType>[] = [
    {
      accessorKey: "deviceName",
      header: "Tên thiết bị",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.deviceName}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const s = row.original.status;
        return (
          <Badge
            variant="outline"
            className={DEVICE_STATUS_BADGE_CLASS[s]}
          >
            {DEVICE_STATUS_LABEL[s] ?? s}
          </Badge>
        );
      },
    },
    {
      accessorKey: "provisionedAt",
      header: "Gán lúc",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateVi(row.original.provisionedAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className={cn(!compact && "overflow-x-auto rounded-lg border")}>
        <DataTable
          columns={columns}
          data={pageItems}
          emptyText={emptyText}
          onRowClick={onRowClick}
        />
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Trang {safePage} / {totalPages} ({devices.length} thiết bị)
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

