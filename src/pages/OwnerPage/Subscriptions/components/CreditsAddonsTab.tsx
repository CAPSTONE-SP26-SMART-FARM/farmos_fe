import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingCard from "@/components/common/LoadingCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getApiErrorMessageVi } from "@/lib/error-message";
import { isApiErrorResponse } from "@/lib/utils";
import {
  useOwnerCredits,
  usePurchaseServicePackage,
  useServicePackages,
} from "@/queries/useCredit";
import { useMyIotTracking } from "@/queries/useIotKit";
import { useOwnerMyQuota } from "@/queries/useSubscription";
import { cn } from "@/lib/utils";
import type { ServicePackageType } from "@/schemaValidatation/credit";
import type { OwnerKitOrderTrackingType } from "@/schemaValidatation/iotKit";
import { ChevronRight, Coins, Cpu, Package } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import CreditBalanceCard from "./CreditBalanceCard";
import CreditLedgerTable from "./CreditLedgerTable";
import IotKitOrderDetailDialog from "./IotKitOrderDetailDialog";
import ServicePackageGrid from "./ServicePackageGrid";

const formatDateVi = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN");
};

function CreditsAddonsTab() {
  const navigate = useNavigate();

  // ────────────────────────────────────────────────────────────────
  // Data sources (đã hợp nhất từ trang Ví Credit cũ)
  //   - useOwnerMyQuota         → iotDevices snapshot (subscription + kit)
  //   - useOwnerCredits         → full credit list (cho thẻ số dư)
  //   - useMyIotTracking        → rich kit-orders + devices đã cấp
  //   - useServicePackages      → các gói có thể mua
  //   - usePurchaseServicePackage → mua gói (tạo invoice → checkout)
  // ────────────────────────────────────────────────────────────────
  const quotaQuery = useOwnerMyQuota(true);
  const creditsQuery = useOwnerCredits(true);
  const trackingQuery = useMyIotTracking(true);
  const packagesQuery = useServicePackages(
    { page: 1, limit: 20, search: undefined },
    true,
  );
  const purchaseMutation = usePurchaseServicePackage();

  const [selectedOrder, setSelectedOrder] =
    useState<OwnerKitOrderTrackingType | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const credits = creditsQuery.data?.data?.data ?? [];
  const iotDevices = quotaQuery.data?.data?.iotDevices;
  const trackingOrders = trackingQuery.data?.data?.kitOrders ?? [];
  const packages = packagesQuery.data?.data?.data ?? [];
  const activePackages = packages.filter((p) => p.isActive);
  const creditTypeFilters = Array.from(
    new Set(credits.map((c) => c.creditType)),
  ).sort();

  const iotTotal = iotDevices
    ? iotDevices.subscriptionMax + iotDevices.kitBonus
    : 0;
  const iotUsageRatio =
    iotDevices && iotTotal > 0 ? iotDevices.used / iotTotal : 0;

  const handlePurchase = async (pkg: ServicePackageType) => {
    setPurchasingId(pkg.id);
    try {
      const result = await purchaseMutation.mutateAsync(pkg.id);
      navigate(`/dashboard/owner/payments/${result.data.invoiceId}`);
    } catch (error) {
      if (isApiErrorResponse(error)) {
        toast.error(error.response?.data.message ?? "Mua gói thất bại.");
      } else {
        toast.error(getApiErrorMessageVi(error, "Mua gói thất bại."));
      }
      setPurchasingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ──────────────────────────────────────────────────────── */}
      {/* Section 1 — Số dư của bạn                                */}
      {/* ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" />
            Số dư của bạn
          </CardTitle>
          <CardDescription>
            Tổng quan nhanh số dư theo từng loại credit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {creditsQuery.isLoading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <LoadingCard rows={1} />
              <LoadingCard rows={1} />
              <LoadingCard rows={1} />
            </div>
          ) : creditsQuery.isError ? (
            <ErrorState
              message={getApiErrorMessageVi(
                creditsQuery.error,
                "Không thể tải số dư credit.",
              )}
              onRetry={() => creditsQuery.refetch()}
            />
          ) : credits.length === 0 ? (
            <EmptyState
              icon={Coins}
              title="Chưa có credit"
              description="Mua gói bên dưới để bắt đầu sử dụng các tính năng nâng cao."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {credits.map((c) => (
                <CreditBalanceCard
                  key={c.id}
                  credit={c}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ──────────────────────────────────────────────────────── */}
      {/* Section 2 — Thiết bị IoT (snapshot quota)                */}
      {/* ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            Thiết bị IoT
          </CardTitle>
          <CardDescription>
            Tổng số thiết bị bạn có thể kết nối — gộp từ gói đăng ký và IoT
            kit đã mua thêm.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quotaQuery.isLoading || !iotDevices ? (
            <p className="text-2xl text-muted-foreground">…</p>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span
                  className={cn(
                    "text-3xl font-bold tabular-nums",
                    iotDevices.remaining <= 0
                      ? "text-destructive"
                      : "text-foreground",
                  )}
                >
                  {iotDevices.remaining.toLocaleString("vi-VN")}
                </span>
                <span className="text-sm text-muted-foreground">
                  thiết bị có thể thêm
                </span>
              </div>
              <Progress
                value={Math.min(100, iotUsageRatio * 100)}
                className={cn(
                  "mt-3",
                  iotUsageRatio >= 1 && "[&>div]:bg-red-500",
                  iotUsageRatio >= 0.8 &&
                    iotUsageRatio < 1 &&
                    "[&>div]:bg-amber-500",
                )}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Đang dùng {iotDevices.used.toLocaleString("vi-VN")} /{" "}
                {iotTotal.toLocaleString("vi-VN")} thiết bị (gói:{" "}
                {iotDevices.subscriptionMax} · mua thêm: {iotDevices.kitBonus})
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => navigate("/dashboard/owner/iot-devices")}
              >
                Quản lý thiết bị
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* ──────────────────────────────────────────────────────── */}
      {/* Section 3 — IoT kit đã mua                              */}
      {/* ──────────────────────────────────────────────────────── */}
      {trackingOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>IoT kit đã mua ({trackingOrders.length})</CardTitle>
            <CardDescription>
              Bấm vào một đơn để xem chi tiết kit, thiết bị đã cấp và tiến độ
              sử dụng.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {trackingOrders.map((order) => {
              const pct =
                order.totalSlots > 0
                  ? Math.min(100, (order.usedSlots / order.totalSlots) * 100)
                  : 0;
              const full = pct >= 100;
              const near = pct >= 80 && !full;
              return (
                <button
                  key={order.orderId}
                  type="button"
                  onClick={() => setSelectedOrder(order)}
                  className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">Đơn #{order.orderNumber}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {order.kit.name} · Mua ngày{" "}
                        {formatDateVi(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm tabular-nums">
                        <span className="font-semibold">
                          {order.usedSlots}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          / {order.totalSlots} thiết bị đã kết nối
                        </span>
                      </p>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <Progress
                    value={pct}
                    className={cn(
                      "mt-2",
                      full && "[&>div]:bg-red-500",
                      near && "[&>div]:bg-amber-500",
                    )}
                  />
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Empty state — chưa mua IoT kit nào */}
      {!trackingQuery.isLoading && trackingOrders.length === 0 && (
        <EmptyState
          icon={Package}
          title="Chưa mua IoT kit nào"
          description="Mua thêm IoT kit để mở rộng số lượng thiết bị có thể kết nối."
          action={{
            label: "Xem IoT kit",
            onClick: () => navigate("/dashboard/owner/iot-kits"),
          }}
        />
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* Section 4 — Mua thêm credit                              */}
      {/* ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Mua thêm credit</CardTitle>
          <CardDescription>
            Chọn gói phù hợp. Sau khi xác nhận, bạn sẽ được chuyển đến trang
            thanh toán.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {packagesQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <LoadingCard rows={2} />
              <LoadingCard rows={2} />
              <LoadingCard rows={2} />
              <LoadingCard rows={2} />
            </div>
          ) : packagesQuery.isError ? (
            <ErrorState
              message={getApiErrorMessageVi(
                packagesQuery.error,
                "Không thể tải danh sách gói.",
              )}
              onRetry={() => packagesQuery.refetch()}
            />
          ) : activePackages.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Chưa có gói khả dụng"
              description="Vui lòng quay lại sau."
            />
          ) : (
            <ServicePackageGrid
              packages={activePackages}
              onPurchase={handlePurchase}
              purchasingId={purchasingId}
            />
          )}
        </CardContent>
      </Card>

      {/* ──────────────────────────────────────────────────────── */}
      {/* Section 5 — Lịch sử biến động credit                     */}
      {/* ──────────────────────────────────────────────────────── */}
      <CreditLedgerTable creditTypes={creditTypeFilters} />

      <IotKitOrderDetailDialog
        order={selectedOrder}
        open={Boolean(selectedOrder)}
        onOpenChange={(open) => {
          if (!open) setSelectedOrder(null);
        }}
      />
    </div>
  );
}

export default CreditsAddonsTab;
