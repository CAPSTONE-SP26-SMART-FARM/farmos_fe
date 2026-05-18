import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Cpu,
  ExternalLink,
  Mail,
  Package,
  Phone,
  ReceiptText,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import LoadingCard from "@/components/common/LoadingCard";
import ErrorState from "@/components/common/ErrorState";
import {
  IOT_ACTION_LABEL,
  STATUS_META,
} from "@/constants/iotDeviceDisplay";
import { useAdminOwnerOverview } from "@/queries/useIotDeviceAdminOps";
import type {
  OwnerOverviewKitOrderType,
} from "@/schemaValidatation/iotDeviceAdminOps";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Order status mapping — BE trả về status dạng string (PAID/PENDING/...)
// ─────────────────────────────────────────────────────────────
const ORDER_STATUS_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  PAID: {
    label: "Đã thanh toán",
    className:
      "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  PENDING: {
    label: "Chờ thanh toán",
    className:
      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  CANCELLED: {
    label: "Đã hủy",
    className:
      "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
  },
  EXPIRED: {
    label: "Hết hạn",
    className:
      "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  },
};

function getOrderStatusMeta(status: string) {
  return (
    ORDER_STATUS_BADGE[status] ?? {
      label: status,
      className:
        "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
    }
  );
}

function formatAssignProgress(o: OwnerOverviewKitOrderType): string {
  if (o.deviceCount === 0) return "Chưa có thiết bị";
  return `${o.assignedCount}/${o.deviceCount} thiết bị đã gán`;
}

export default function AdminOwnerIotOverviewPage() {
  const navigate = useNavigate();
  const { ownerId = "" } = useParams<{ ownerId: string }>();

  const overviewQuery = useAdminOwnerOverview(ownerId);
  const data = overviewQuery.data?.data;

  const quotaPct = useMemo(() => {
    if (!data) return 0;
    if (data.quota.effectiveLimit === 0) return 0;
    return Math.round((data.quota.used / data.quota.effectiveLimit) * 100);
  }, [data]);

  if (overviewQuery.isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <LoadingCard rows={3} />
        <LoadingCard rows={5} />
      </div>
    );
  }

  if (overviewQuery.isError || !data) {
    return (
      <div className="p-4 md:p-6">
        <ErrorState
          message="Không thể tải hồ sơ chủ trang trại. Vui lòng thử lại."
          onRetry={() => overviewQuery.refetch()}
        />
      </div>
    );
  }

  const hasOutstanding =
    data.outstandingIssues.errorDevices.length > 0 ||
    data.outstandingIssues.unpaidOrders.length > 0 ||
    data.outstandingIssues.expiringSubIn7d;

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard/admin/users")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
          Quay lại danh sách
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to={`/dashboard/admin/users?ownerId=${ownerId}`}>
            Hồ sơ chi tiết
            <ExternalLink className="ml-1 h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>

      {/* ── Thông tin chủ trang trại ────────────────────────────── */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <User className="h-6 w-6 text-muted-foreground" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{data.owner.fullName}</h1>
              {data.owner.isActive ? (
                <Badge
                  variant="outline"
                  className="border-emerald-300 bg-emerald-50 text-emerald-700"
                >
                  Đang hoạt động
                </Badge>
              ) : (
                <Badge variant="outline">Đã khóa</Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" aria-hidden />
                {data.owner.email}
              </span>
              {data.owner.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" aria-hidden />
                  {data.owner.phone}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" aria-hidden />
                Tham gia{" "}
                {new Date(data.owner.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Vấn đề cần xử lý ──────────────────────────────────── */}
      {hasOutstanding && (
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle
                className="h-4 w-4 text-amber-600 dark:text-amber-400"
                aria-hidden
              />
              Cần admin xử lý
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.outstandingIssues.errorDevices.map((d) => (
              <div
                key={d.deviceId}
                className="flex flex-wrap items-center gap-2"
              >
                <span className="text-destructive font-medium">
                  Thiết bị {d.label ?? "(chưa có mã)"} đã lỗi từ{" "}
                  {new Date(d.sinceAt).toLocaleDateString("vi-VN")}
                </span>
                <Button asChild variant="link" size="sm" className="h-auto p-0">
                  <Link
                    to={`/dashboard/admin/iot-devices/${d.deviceId}/decision`}
                  >
                    Mở trang quyết định
                    <ChevronRight className="ml-0.5 h-3.5 w-3.5" aria-hidden />
                  </Link>
                </Button>
              </div>
            ))}
            {data.outstandingIssues.unpaidOrders.map((o) => (
              <div
                key={o.orderId}
                className="flex flex-wrap items-center gap-2"
              >
                <span className="text-amber-700 dark:text-amber-400">
                  Đơn {o.orderNumber} chưa thanh toán{" "}
                  {o.amount.toLocaleString("vi-VN")}đ · chờ {o.ageDays} ngày
                </span>
                <Button asChild variant="link" size="sm" className="h-auto p-0">
                  <Link to={`/dashboard/admin/invoices?orderId=${o.orderId}`}>
                    Xem hóa đơn
                    <ChevronRight className="ml-0.5 h-3.5 w-3.5" aria-hidden />
                  </Link>
                </Button>
              </div>
            ))}
            {data.outstandingIssues.expiringSubIn7d && (
              <div className="text-amber-700 dark:text-amber-400">
                Gói đăng ký sắp hết hạn trong 7 ngày.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Gói đăng ký + Hạn mức ─────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ReceiptText
                className="h-4 w-4 text-muted-foreground"
                aria-hidden
              />
              Gói đăng ký
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.subscription ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Gói</span>
                  <span className="font-medium">
                    {data.subscription.planName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Trạng thái</span>
                  <Badge
                    variant="outline"
                    className="border-emerald-300 bg-emerald-50 text-emerald-700"
                  >
                    {data.subscription.status}
                  </Badge>
                </div>
                {data.subscription.startedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Bắt đầu</span>
                    <span>
                      {new Date(
                        data.subscription.startedAt,
                      ).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                )}
                {data.subscription.expiresAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Hết hạn</span>
                    <span>
                      {new Date(
                        data.subscription.expiresAt,
                      ).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">
                Chưa có gói đăng ký nào.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="h-4 w-4 text-muted-foreground" aria-hidden />
              Hạn mức thiết bị
            </CardTitle>
            <CardDescription>
              Đã dùng {data.quota.used}/{data.quota.effectiveLimit} thiết bị ·
              còn {data.quota.remaining}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={quotaPct} aria-label={`Hạn mức ${quotaPct}%`} />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md border p-2">
                <p className="text-muted-foreground">Từ gói đăng ký</p>
                <p className="text-base font-semibold">
                  {data.quota.subscriptionMax}
                </p>
              </div>
              <div className="rounded-md border p-2">
                <p className="text-muted-foreground">Bonus từ kit</p>
                <p className="text-base font-semibold">
                  +{data.quota.kitBonus}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <Tabs defaultValue="devices">
        <TabsList>
          <TabsTrigger value="devices">
            Thiết bị ({data.devices.length})
          </TabsTrigger>
          <TabsTrigger value="orders">
            Đơn kit ({data.kitOrders.length})
          </TabsTrigger>
          <TabsTrigger value="activity">
            Hoạt động gần đây ({data.recentEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-2 pt-3">
          {data.devices.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                Chủ trang trại chưa được gán thiết bị nào.
              </CardContent>
            </Card>
          ) : (
            data.devices.map((d) => {
              const meta = STATUS_META[d.status];
              const displayLabel = d.label ?? d.deviceName;
              return (
                <Card key={d.id}>
                  <CardContent className="flex flex-wrap items-center gap-3 p-3">
                    <span className="font-medium tabular-nums">
                      {displayLabel}
                    </span>
                    {d.label && (
                      <span className="text-xs text-muted-foreground">
                        {d.deviceName}
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      className={cn("gap-1", meta.badgeClass)}
                    >
                      <meta.icon className="h-3.5 w-3.5" aria-hidden />
                      {meta.labelAdmin}
                    </Badge>
                    {d.farm && (
                      <span className="text-sm text-muted-foreground">
                        · {d.farm.name}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">
                      Cập nhật cuối:{" "}
                      {d.lastSeenAt
                        ? new Date(d.lastSeenAt).toLocaleString("vi-VN")
                        : "—"}
                    </span>
                    <Button asChild variant="ghost" size="sm">
                      <Link
                        to={`/dashboard/admin/iot-devices/${d.id}/decision`}
                        aria-label={`Mở trang quyết định cho ${displayLabel}`}
                      >
                        Mở
                        <ChevronRight
                          className="ml-0.5 h-4 w-4"
                          aria-hidden
                        />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-2 pt-3">
          {data.kitOrders.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                Chưa có đơn kit nào.
              </CardContent>
            </Card>
          ) : (
            data.kitOrders.map((o) => {
              const statusMeta = getOrderStatusMeta(o.status);
              return (
                <Card key={o.orderId}>
                  <CardContent className="flex flex-wrap items-center gap-3 p-3">
                    <Package
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <span className="font-medium">
                      {o.kitName ?? "(Kit không xác định)"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {o.orderNumber}
                    </span>
                    <Badge variant="outline" className={statusMeta.className}>
                      {statusMeta.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatAssignProgress(o)}
                    </span>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="activity" className="pt-3">
          <Card>
            <CardContent className="p-0">
              {data.recentEvents.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Chưa có hoạt động nào gần đây.
                </p>
              ) : (
                <ol className="divide-y">
                  {data.recentEvents.map((e, i) => (
                    <li
                      key={`${e.at}-${i}`}
                      className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm"
                    >
                      <Clock
                        className="h-3.5 w-3.5 text-muted-foreground"
                        aria-hidden
                      />
                      <span className="tabular-nums text-muted-foreground">
                        {new Date(e.at).toLocaleString("vi-VN")}
                      </span>
                      <Separator orientation="vertical" className="h-4" />
                      <span className="font-medium">
                        {e.deviceLabel ?? "(thiết bị chưa có mã)"}
                      </span>
                      <Badge variant="outline" className="text-[11px]">
                        {IOT_ACTION_LABEL[e.action] ?? e.action}
                      </Badge>
                      {e.reason && (
                        <span className="text-muted-foreground">
                          {e.reason}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-3">
          <CircleDollarSign
            className="h-4 w-4 text-muted-foreground"
            aria-hidden
          />
          <span className="text-sm font-medium">Tổng quan tài chính:</span>
          <span className="text-sm text-muted-foreground">
            xem chi tiết trong mô-đun Hóa đơn.
          </span>
          <Button asChild variant="link" size="sm" className="ml-auto h-auto p-0">
            <Link to={`/dashboard/admin/invoices?ownerId=${ownerId}`}>
              Xem hóa đơn
              <ChevronRight className="ml-0.5 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
