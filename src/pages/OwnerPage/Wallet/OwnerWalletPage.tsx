import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingCard from "@/components/common/LoadingCard";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getApiErrorMessageVi } from "@/lib/error-message";
import { isApiErrorResponse } from "@/lib/utils";
import {
  useOwnerCredits,
  usePurchaseServicePackage,
  useServicePackages,
} from "@/queries/useCredit";
import type { ServicePackageType } from "@/schemaValidatation/credit";
import { Coins, Eye, Package } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import BalanceCard from "./components/BalanceCard";
import CreditLedgerTable from "./components/CreditLedgerTable";
import ServicePackageGrid from "./components/ServicePackageGrid";

function OwnerWalletPage() {
  const navigate = useNavigate();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const creditsQuery = useOwnerCredits(true);
  const packagesQuery = useServicePackages(
    { page: 1, limit: 20, search: undefined },
    true,
  );
  const purchaseMutation = usePurchaseServicePackage();

  const credits = creditsQuery.data?.data?.data ?? [];
  const packages = packagesQuery.data?.data?.data ?? [];
  const activePackages = packages.filter((p) => p.isActive);
  const creditTypes = Array.from(
    new Set(credits.map((c) => c.creditType)),
  ).sort();

  const handlePurchase = async (pkg: ServicePackageType) => {
    setPurchasingId(pkg.id);
    try {
      const result = await purchaseMutation.mutateAsync(pkg.id);
      navigate(`/dashboard/owner/payments/${result.data.invoiceId}`);
    } catch (error) {
      if (isApiErrorResponse(error)) {
        toast.error(error.response?.data.message ?? "Mua gói bổ trợ thất bại.");
      } else {
        toast.error(getApiErrorMessageVi(error, "Mua gói bổ trợ thất bại."));
      }
      setPurchasingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="pointer-events-none absolute inset-0 bg-primary/5" />
        <div className="relative flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge className="mb-2 flex w-fit items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              Chủ trang trại
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Ví của bạn
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
              Quản lý số dư credit, mua gói bổ trợ và xem toàn bộ lịch sử giao
              dịch.
            </p>
          </div>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" />
            Số dư credit
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
              description="Mua gói bổ trợ để bắt đầu sử dụng các tính năng nâng cao."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {credits.map((c) => (
                <BalanceCard
                  key={c.id}
                  credit={c}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                "Không thể tải gói bổ trợ.",
              )}
              onRetry={() => packagesQuery.refetch()}
            />
          ) : activePackages.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Chưa có gói bổ trợ khả dụng"
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

      <CreditLedgerTable creditTypes={creditTypes} />
    </div>
  );
}

export default OwnerWalletPage;
