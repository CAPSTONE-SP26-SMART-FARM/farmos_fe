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
import { formatCreditLabel } from "@/constants/creditLabel";
import { formatCurrencyVnd } from "@/lib/format";
import { getApiErrorMessageVi } from "@/lib/error-message";
import { useServicePackages } from "@/queries/useCredit";
import { useOwnerMyQuota } from "@/queries/useSubscription";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Coins, Cpu, Wallet } from "lucide-react";
import { useNavigate } from "react-router";

function CreditsAddonsTab() {
  const navigate = useNavigate();
  const quotaQuery = useOwnerMyQuota(true);
  const packagesQuery = useServicePackages(
    { page: 1, limit: 20, search: undefined },
    true,
  );

  const credits = quotaQuery.data?.data?.ticketCredits ?? [];
  const iotDevices = quotaQuery.data?.data?.iotDevices;
  const packages = packagesQuery.data?.data?.data ?? [];

  const formatDateVi = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("vi-VN");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Số dư credit
            </CardTitle>
            <CardDescription>
              Tổng quan nhanh. Xem chi tiết và lịch sử tại trang Ví.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard/owner/wallet")}
          >
            Mở ví
          </Button>
        </CardHeader>
        <CardContent>
          {quotaQuery.isLoading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <LoadingCard rows={1} />
              <LoadingCard rows={1} />
            </div>
          ) : quotaQuery.isError ? (
            <ErrorState
              message={getApiErrorMessageVi(
                quotaQuery.error,
                "Không thể tải số dư credit.",
              )}
              onRetry={() => quotaQuery.refetch()}
            />
          ) : credits.length === 0 ? (
            <EmptyState
              icon={Coins}
              title="Chưa có credit"
              description="Mua gói bổ trợ để bắt đầu dùng các tính năng nâng cao."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {credits.map((credit) => (
                <div
                  key={credit.creditType}
                  className="rounded-lg border bg-primary/5 p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {formatCreditLabel(credit.creditType)}
                  </p>
                  <p className="mt-1 text-3xl font-bold">
                    {credit.balance.toLocaleString("vi-VN")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              Hạn mức thiết bị IoT
            </CardTitle>
            <CardDescription>
              Số bộ kit đã mua thêm và slot thiết bị đang sử dụng.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard/owner/iot-devices")}
          >
            Quản lý thiết bị
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {quotaQuery.isLoading ? (
            <LoadingCard rows={2} />
          ) : !iotDevices ? null : (
            <>
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Hạn mức gói
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {iotDevices.subscriptionMax.toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Bonus từ kit
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-600">
                    +{iotDevices.kitBonus.toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Đang sử dụng
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {iotDevices.used.toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Còn lại
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-2xl font-semibold tabular-nums",
                      iotDevices.remaining <= 0
                        ? "text-red-600"
                        : "text-primary",
                    )}
                  >
                    {iotDevices.remaining.toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">
                  Bộ kit đã mua ({iotDevices.kitOrders.length})
                </p>
                {iotDevices.kitOrders.length === 0 ? (
                  <EmptyState
                    icon={Cpu}
                    title="Chưa mua bộ kit nào"
                    description="Mua thêm bộ kit IoT để mở rộng hạn mức thiết bị của bạn."
                  />
                ) : (
                  <div className="space-y-2">
                    {iotDevices.kitOrders.map((order) => {
                      const pct =
                        order.totalSlots > 0
                          ? Math.min(
                              100,
                              (order.usedSlots / order.totalSlots) * 100,
                            )
                          : 0;
                      const full = pct >= 100;
                      const near = pct >= 80 && !full;
                      return (
                        <div
                          key={order.orderId}
                          className="rounded-lg border p-3"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <div>
                              <p className="font-medium">
                                Đơn #{order.orderNumber}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Mua ngày {formatDateVi(order.createdAt)}
                              </p>
                            </div>
                            <p className="text-sm tabular-nums">
                              <span className="font-semibold">
                                {order.usedSlots}
                              </span>
                              <span className="text-muted-foreground">
                                {" "}
                                / {order.totalSlots} slot
                              </span>
                            </p>
                          </div>
                          <Progress
                            value={pct}
                            className={cn(
                              "mt-2",
                              full && "[&>div]:bg-red-500",
                              near && "[&>div]:bg-amber-500",
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gói bổ trợ khả dụng</CardTitle>
          <CardDescription>
            Mua thêm credit theo nhu cầu. Mua nhanh ngay dưới đây hoặc mở Ví để
            xem thêm.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {packagesQuery.isLoading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <LoadingCard rows={1} />
              <LoadingCard rows={1} />
            </div>
          ) : packagesQuery.isError ? (
            <ErrorState
              message={getApiErrorMessageVi(
                packagesQuery.error,
                "Không thể tải gói bổ trợ.",
              )}
              onRetry={() => packagesQuery.refetch()}
            />
          ) : packages.length === 0 ? (
            <EmptyState
              icon={Coins}
              title="Chưa có gói bổ trợ"
              description="Vui lòng quay lại sau."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {packages.slice(0, 4).map((pkg) => (
                <div
                  key={pkg.id}
                  className="flex flex-col justify-between gap-3 rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{pkg.name}</p>
                    <p className="text-xs text-muted-foreground">
                      +{pkg.creditAmount} {formatCreditLabel(pkg.creditType)}
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {formatCurrencyVnd(pkg.price)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("/dashboard/owner/wallet")}
                  >
                    Mua
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CreditsAddonsTab;
