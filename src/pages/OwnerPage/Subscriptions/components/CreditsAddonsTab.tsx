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
import { formatCurrencyVnd } from "@/lib/format";
import { getApiErrorMessageVi } from "@/lib/error-message";
import { useOwnerCredits, useServicePackages } from "@/queries/useCredit";
import { Coins, Wallet } from "lucide-react";
import { useNavigate } from "react-router";

function CreditsAddonsTab() {
  const navigate = useNavigate();
  const creditsQuery = useOwnerCredits(true);
  const packagesQuery = useServicePackages(
    { page: 1, limit: 20, search: undefined },
    true,
  );

  const credits = creditsQuery.data?.data?.data ?? [];
  const packages = packagesQuery.data?.data?.data ?? [];

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
          {creditsQuery.isLoading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
              description="Mua gói bổ trợ để bắt đầu dùng các tính năng nâng cao."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {credits.map((credit) => (
                <div
                  key={credit.id}
                  className="rounded-lg border bg-primary/5 p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {credit.creditType}
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
                      +{pkg.creditAmount} {pkg.creditType}
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
