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
import { Input } from "@/components/ui/input";
import useDebounce from "@/hooks/useDebounce";
import { getApiErrorMessageVi } from "@/lib/error-message";
import { useListSubscriptionPlans } from "@/queries/useSubscriptionPlan";
import { useOwnerMySubscription } from "@/queries/useSubscription";
import type {
  ListPlansQueryType,
  PlanResType,
} from "@/schemaValidatation/subscriptionPlan";
import { Eye, Package } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import PlanCard from "./components/PlanCard";

function OwnerSubscriptionPlansPage() {
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState("");
  const debounced = useDebounce(searchKeyword, 400);

  const query = useMemo<ListPlansQueryType>(
    () => ({
      page: 1,
      limit: 50,
      search: debounced.trim() || undefined,
      status: "ACTIVE",
    }),
    [debounced],
  );

  const plansQuery = useListSubscriptionPlans(query);
  const mySubQuery = useOwnerMySubscription(true);

  const mySubscription = mySubQuery.data?.data;
  const canSubscribe = !mySubscription;

  const ownerPricingPlans = useMemo(() => {
    const plans = plansQuery.data?.data?.data ?? [];
    return plans
      .filter((plan) => plan.status === "ACTIVE")
      .sort((a, b) => a.listPrice - b.listPrice);
  }, [plansQuery.data?.data?.data]);

  const handleViewDetail = (plan: PlanResType) => {
    navigate(`/dashboard/owner/subscription-plans/${plan.id}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge className="mb-2 flex w-fit items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              Chủ trang trại
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Bảng giá gói đăng ký
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
              Chọn gói phù hợp để nâng cấp vận hành trang trại. Bạn có thể huỷ
              bất cứ lúc nào trong mục “Gói đăng ký của tôi”.
            </p>
          </div>
          <div className="rounded-xl border bg-background/80 px-4 py-3 text-sm backdrop-blur-sm">
            <div className="flex items-center gap-2 font-medium">
              <Package className="h-4 w-4 text-primary" />
              {ownerPricingPlans.length} gói đang mở
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Gói hiện tại: {mySubscription?.plan?.name ?? "Chưa có"}
            </p>
          </div>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Tìm kiếm gói</CardTitle>
          <CardDescription>
            Dùng từ khoá theo mã hoặc tên gói để lọc nhanh.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Tìm theo mã hoặc tên gói..."
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
          />
        </CardContent>
      </Card>

      {plansQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <LoadingCard rows={4} />
          <LoadingCard rows={4} />
          <LoadingCard rows={4} />
        </div>
      ) : plansQuery.isError ? (
        <ErrorState
          message={getApiErrorMessageVi(
            plansQuery.error,
            "Không thể tải bảng giá gói.",
          )}
          onRetry={() => plansQuery.refetch()}
        />
      ) : ownerPricingPlans.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Không có gói đăng ký nào khả dụng"
          description={
            query.search
              ? "Thử từ khoá khác hoặc xoá bộ lọc."
              : "Vui lòng quay lại sau hoặc liên hệ hỗ trợ."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ownerPricingPlans.map((plan, index) => {
            const isCurrentPlan = mySubscription?.planId === plan.id;
            const recommended =
              !isCurrentPlan &&
              ownerPricingPlans.length >= 3 &&
              index === Math.floor(ownerPricingPlans.length / 2);
            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrent={isCurrentPlan}
                disableSubscribe={!canSubscribe && !isCurrentPlan}
                disabledHint={
                  !canSubscribe && !isCurrentPlan
                    ? "Bạn đang có gói đang hoạt động. Quản lý tại trang Gói của tôi."
                    : undefined
                }
                recommended={recommended}
                onSubscribe={handleViewDetail}
                onViewDetail={handleViewDetail}
                ctaLabel="Đăng ký gói này"
              />
            );
          })}
        </div>
      )}

      {!canSubscribe && (
        <Card>
          <CardContent className="flex flex-col items-start gap-2 py-4 text-sm md:flex-row md:items-center md:justify-between">
            <p className="text-muted-foreground">
              Bạn đang có gói đăng ký. Muốn đổi gói? Hãy huỷ gói hiện tại trước.
            </p>
            <button
              type="button"
              className="text-primary underline-offset-4 hover:underline"
              onClick={() => navigate("/dashboard/owner/subscriptions")}
            >
              Quản lý gói của tôi →
            </button>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

export default OwnerSubscriptionPlansPage;
