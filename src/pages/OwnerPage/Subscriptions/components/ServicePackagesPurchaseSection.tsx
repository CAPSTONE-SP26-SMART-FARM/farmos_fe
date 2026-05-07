import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingCard from "@/components/common/LoadingCard";
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
  usePurchaseServicePackage,
  useServicePackages,
} from "@/queries/useCredit";
import type { ServicePackageType } from "@/schemaValidatation/credit";
import { Package } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import ServicePackageGrid from "./ServicePackageGrid";

interface Props {
  title?: string;
  description?: string;
  /** Hide the wrapping Card (use raw grid) — set true when caller already provides a Card. */
  bare?: boolean;
}

function ServicePackagesPurchaseSection({
  title = "Mua thêm credit",
  description = "Chọn gói phù hợp. Sau khi xác nhận, bạn sẽ được chuyển đến trang thanh toán.",
  bare = false,
}: Props) {
  const navigate = useNavigate();
  const packagesQuery = useServicePackages(
    { page: 1, limit: 20, search: undefined },
    true,
  );
  const purchaseMutation = usePurchaseServicePackage();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const packages = packagesQuery.data?.data?.data ?? [];
  const activePackages = packages.filter((p) => p.isActive);

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

  const body = packagesQuery.isLoading ? (
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
  );

  if (bare) return body;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}

export default ServicePackagesPurchaseSection;
