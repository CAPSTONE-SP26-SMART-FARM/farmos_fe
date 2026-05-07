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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrencyVnd, formatDateVi } from "@/lib/format";
import { cn, isApiErrorResponse } from "@/lib/utils";
import { useMyIotTracking } from "@/queries/useIotKit";
import {
  BOARD_TYPE_LABEL_VI,
  KIT_MODULE_LABEL_VI,
  SENSOR_TYPE_LABEL_VI,
  type IotKitOrderStatus,
  type OwnerKitOrderTrackingType,
  type ProvisionedDeviceSummaryType,
} from "@/schemaValidatation/iotKit";
import {
  CircleSlash,
  Cpu,
  Package,
  PackagePlus,
  ShoppingBag,
  Wifi,
  Zap,
} from "lucide-react";
import { Link, useNavigate } from "react-router";

const ORDER_STATUS_META: Record<
  IotKitOrderStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Chờ thanh toán",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
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
  active: "Hoạt động",
  inactive: "Tắt",
  maintenance: "Bảo trì",
  retired: "Ngưng hoạt động",
};

export default function OwnerIotTrackingPage() {
  const navigate = useNavigate();
  const trackingQuery = useMyIotTracking();

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
            <CardTitle>Theo dõi cấp phát IoT</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={CircleSlash}
              title="Chưa có gói đăng ký active"
              description="Bạn cần có gói đăng ký đang hoạt động để xem các thiết bị đã được cấp phát."
              action={{
                label: "Xem gói đăng ký",
                onClick: () =>
                  navigate("/dashboard/owner/subscription-plans"),
              }}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <ErrorState
        message="Không tải được dữ liệu cấp phát IoT."
        onRetry={() => trackingQuery.refetch()}
      />
    );
  }

  const data = trackingQuery.data?.data;
  if (!data) return null;

  const { quota, kitOrders, subscriptionDevices } = data;
  const totalCapacity = quota.subscriptionMax + quota.kitBonus;
  const usageRatio = totalCapacity > 0 ? quota.used / totalCapacity : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge className="mb-2">Theo dõi</Badge>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Cấp phát thiết bị IoT
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Tổng quan hạn mức, các bộ kit đã mua và thiết bị được cấp phát
              cho bạn.
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <KpiCard
              icon={Zap}
              label="IoT kit chưa sử dụng"
              value={quota.remaining}
              tone={quota.remaining <= 0 ? "danger" : "success"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Subscription devices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-primary" />
            Thiết bị từ gói đăng ký ({subscriptionDevices.length})
          </CardTitle>
          <CardDescription>
            Các bo mạch được admin cấp phát trực tiếp qua hạn mức gói (không
            qua đơn kit).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeviceTable devices={subscriptionDevices} emptyText="Chưa có thiết bị nào được cấp qua gói đăng ký." />
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
            Mỗi đơn hiển thị bộ kit đã mua, slot quota và các thiết bị đã
            được gán.
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
            kitOrders.map((order) => <KitOrderCard key={order.orderId} order={order} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KitOrderCard({ order }: { order: OwnerKitOrderTrackingType }) {
  const meta = ORDER_STATUS_META[order.status];
  const pct =
    order.totalSlots > 0
      ? Math.min(100, (order.usedSlots / order.totalSlots) * 100)
      : 0;
  const full = pct >= 100;
  const near = pct >= 80 && !full;
  const isPaid = order.status === "PAID";

  return (
    <div className="space-y-3 rounded-xl border bg-background p-4">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
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
            <span className="text-xs text-muted-foreground">
              {formatDateVi(order.createdAt)}
            </span>
          </div>
          <p className="text-sm">
            <span className="font-medium">{order.kit.name}</span>
            <span className="text-muted-foreground"> · {order.kit.code}</span>
          </p>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline">
              {BOARD_TYPE_LABEL_VI[order.kit.boardType]}
            </Badge>
            {order.kit.includedSensors?.map((s) => (
              <Badge key={s} variant="secondary">
                {SENSOR_TYPE_LABEL_VI[s]}
              </Badge>
            ))}
            {order.kit.includedModules?.map((m) => (
              <Badge key={m} variant="secondary">
                {KIT_MODULE_LABEL_VI[m]}
              </Badge>
            ))}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Tổng tiền
          </p>
          <p className="text-base font-semibold tabular-nums">
            {formatCurrencyVnd(order.totalAmount)}
          </p>
        </div>
      </div>

      {/* Slot progress (only for PAID orders) */}
      {isPaid && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Slot đã dùng</span>
            <span className="tabular-nums">
              <span
                className={cn(
                  "font-semibold",
                  full && "text-red-600",
                  near && "text-amber-600",
                )}
              >
                {order.usedSlots}
              </span>
              <span className="text-muted-foreground"> / {order.totalSlots}</span>
            </span>
          </div>
          <Progress
            value={pct}
            className={cn(
              "h-1.5",
              full && "[&>div]:bg-red-500",
              near && "[&>div]:bg-amber-500",
            )}
          />
        </div>
      )}

      {/* Devices in this order */}
      {isPaid && (
        <div className="rounded-lg border bg-muted/30 p-2">
          <DeviceTable
            devices={order.devices}
            emptyText="Đơn này chưa có thiết bị được gán. Liên hệ admin để được cấp phát."
            compact
          />
        </div>
      )}

      {order.status === "CANCELLED" && order.cancelledAt && (
        <p className="text-xs text-muted-foreground">
          Đã hủy lúc {formatDateVi(order.cancelledAt)}
        </p>
      )}
    </div>
  );
}

function DeviceTable({
  devices,
  emptyText,
  compact = false,
}: {
  devices: ProvisionedDeviceSummaryType[];
  emptyText: string;
  compact?: boolean;
}) {
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

  return (
    <div className={cn(!compact && "overflow-x-auto rounded-lg border")}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên thiết bị</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Cấp phát lúc</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((d) => (
            <TableRow key={d.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{d.deviceName}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {DEVICE_STATUS_LABEL[d.status] ?? d.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDateVi(d.provisionedAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
