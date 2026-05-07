import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingCard from "@/components/common/LoadingCard";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getApiErrorMessageVi } from "@/lib/error-message";
import { isApiErrorResponse } from "@/lib/utils";
import {
  useOwnerMySubscription,
  useOwnerRenewSubscription,
  useSubscriptionDetail,
  useSubscriptionEntitlements,
} from "@/queries/useSubscription";
import { useOwnerInvoices, useSubscriptionPaymentStatus } from "@/queries/useInvoice";
import type { SubscriptionResType } from "@/schemaValidatation/subscription";
import { ArrowLeft, Package } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import CancelSubscriptionSheet from "./CancelSubscriptionSheet";
import CreditsAddonsTab from "./CreditsAddonsTab";
import DangerZoneSection from "./DangerZoneSection";
import HistoryTab from "./HistoryTab";
import OverviewTab from "./OverviewTab";
import SubscriptionBannerCascade from "./SubscriptionBannerCascade";
import SubscriptionHeroCard from "./SubscriptionHeroCard";
import UsageTab from "./UsageTab";

const TAB_VALUES = ["overview", "usage", "credits", "history"] as const;
type TabValue = (typeof TAB_VALUES)[number];

function isTabValue(value: string | null): value is TabValue {
  return !!value && (TAB_VALUES as readonly string[]).includes(value);
}

const SUBSCRIPTIONS_LIST_PATH = "/dashboard/owner/subscriptions";
const PLANS_PATH = "/dashboard/owner/subscription-plans";
const SUPPORT_TICKETS_PATH = "/dashboard/owner/tickets";

interface OwnerSubscriptionDashboardProps {
  /** When present, fetch this specific subscription (detail route). */
  subscriptionId?: string;
  /** Render a breadcrumb + back button at the top. */
  showBreadcrumb?: boolean;
}

function OwnerSubscriptionDashboard({
  subscriptionId: subscriptionIdFromProps,
  showBreadcrumb = false,
}: OwnerSubscriptionDashboardProps = {}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: TabValue = isTabValue(searchParams.get("tab"))
    ? (searchParams.get("tab") as TabValue)
    : "overview";

  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const isDetailMode = Boolean(subscriptionIdFromProps);

  const mySubscriptionQuery = useOwnerMySubscription(!isDetailMode);
  const detailQuery = useSubscriptionDetail(
    subscriptionIdFromProps ?? "",
    isDetailMode,
  );

  const subscription: SubscriptionResType | null = isDetailMode
    ? (detailQuery.data?.data?.subscription ?? null)
    : (mySubscriptionQuery.data?.data ?? null);

  const subscriptionId = subscription?.id ?? "";

  const isLoading = isDetailMode
    ? detailQuery.isLoading
    : mySubscriptionQuery.isLoading;
  const isError = isDetailMode ? detailQuery.isError : mySubscriptionQuery.isError;
  const errorObj = isDetailMode ? detailQuery.error : mySubscriptionQuery.error;
  const refetch = isDetailMode
    ? () => detailQuery.refetch()
    : () => mySubscriptionQuery.refetch();

  const entitlementsQuery = useSubscriptionEntitlements(
    subscriptionId,
    { page: 1, limit: 50, search: undefined },
    Boolean(subscriptionId),
  );
  const invoicesQuery = useOwnerInvoices(
    {
      page: 1,
      limit: 20,
      search: undefined,
      status: undefined,
      referenceType: "SUBSCRIPTION",
      referenceId: subscriptionId || undefined,
    },
    Boolean(subscriptionId),
  );

  const paymentStatusQuery = useSubscriptionPaymentStatus(
    subscriptionId,
    Boolean(subscriptionId),
  );

  const unpaidInvoice = useMemo(
    () =>
      invoicesQuery.data?.data?.data?.find((inv) => inv.status === "OPEN"),
    [invoicesQuery.data?.data?.data],
  );

  const featureCodes = useMemo(() => {
    const set = new Set<string>();
    for (const e of entitlementsQuery.data?.data?.data ?? []) {
      set.add(e.featureCode);
    }
    return Array.from(set).sort();
  }, [entitlementsQuery.data?.data?.data]);

  const setTab = (next: TabValue, extra?: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", next);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) params.set(k, v);
    }
    setSearchParams(params, { replace: false });
  };

  const renewMutation = useOwnerRenewSubscription();

  const handleRenew = async () => {
    if (!subscriptionId) return;
    try {
      const result = await renewMutation.mutateAsync(subscriptionId);
      toast.success(
        `Đã tạo hóa đơn gia hạn ${result.data.invoiceNumber}. Chuyển tới trang thanh toán...`,
      );
      navigate(`/dashboard/owner/payments/${result.data.invoiceId}`);
    } catch (error) {
      toast.error(getApiErrorMessageVi(error, "Gia hạn đăng ký thất bại."));
    }
  };

  const handleResubscribe = () => navigate(PLANS_PATH);
  const handlePayPending = () => {
    if (unpaidInvoice) {
      navigate(`/dashboard/owner/payments/${unpaidInvoice.id}`);
    } else {
      navigate("/dashboard/owner/payments");
    }
  };
  const handleContactSupport = () => navigate(SUPPORT_TICKETS_PATH);

  const breadcrumbNode = showBreadcrumb ? (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={SUBSCRIPTIONS_LIST_PATH}>Gói đăng ký của tôi</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {subscription?.plan?.name
                ? `Chi tiết · ${subscription.plan.name}`
                : "Chi tiết"}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(SUBSCRIPTIONS_LIST_PATH)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quay lại
      </Button>
    </div>
  ) : null;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {breadcrumbNode}
        <LoadingCard rows={3} />
        <LoadingCard rows={4} />
      </div>
    );
  }

  if (isError) {
    const status = isApiErrorResponse(errorObj)
      ? errorObj.response?.status
      : undefined;

    const title =
      status === 404
        ? "Không tìm thấy gói đăng ký"
        : status === 403
          ? "Bạn không có quyền xem gói này"
          : "Không thể tải thông tin gói đăng ký";
    const description =
      status === 404
        ? "Đường dẫn có thể không hợp lệ hoặc gói đã bị xoá."
        : status === 403
          ? "Gói này không thuộc tài khoản của bạn."
          : getApiErrorMessageVi(errorObj, "Vui lòng thử lại sau.");

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {breadcrumbNode}
        <ErrorState
          title={title}
          message={description}
          onRetry={status === 404 || status === 403 ? undefined : refetch}
        />
        {(status === 404 || status === 403) && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(SUBSCRIPTIONS_LIST_PATH)}
            >
              Về gói của tôi
            </Button>
            <Button onClick={() => navigate(PLANS_PATH)}>
              Xem bảng giá
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {breadcrumbNode}
        <EmptyState
          icon={Package}
          title="Chưa có gói đăng ký"
          description="Chọn một gói phù hợp để bắt đầu sử dụng dịch vụ đầy đủ."
          action={{
            label: "Xem bảng giá",
            onClick: () => navigate(PLANS_PATH),
          }}
        />
      </div>
    );
  }

  const paymentPending =
    paymentStatusQuery.data?.data?.subscriptionStatus === "PENDING";
  const paymentOrderCode =
    (paymentStatusQuery.data?.data?.latestTransaction
      ?.gatewayResponse as { orderCode?: string | number } | null)?.orderCode ??
    null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {breadcrumbNode}

      <SubscriptionHeroCard
        subscription={subscription}
        onRenew={handleRenew}
        renewLoading={renewMutation.isPending}
        onResubscribe={handleResubscribe}
        onPayPending={handlePayPending}
        onContactSupport={handleContactSupport}
      />

      <SubscriptionBannerCascade
        subscription={subscription}
        unpaidInvoice={unpaidInvoice}
        paymentPending={paymentPending}
        paymentOrderCode={paymentOrderCode}
        onPayNow={(invoiceId) =>
          navigate(`/dashboard/owner/payments/${invoiceId}`)
        }
        onContactSupport={handleContactSupport}
      />

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as TabValue)}
      >
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="usage">Sử dụng</TabsTrigger>
          <TabsTrigger value="credits">Credit &amp; Bổ trợ</TabsTrigger>
          <TabsTrigger value="history">Lịch sử</TabsTrigger>
        </TabsList>

        <TabsContent
          value="overview"
          className="mt-4"
        >
          <OverviewTab
            subscriptionId={subscriptionId}
            enabled={Boolean(subscriptionId)}
          />
        </TabsContent>

        <TabsContent
          value="usage"
          className="mt-4"
        >
          <UsageTab
            enabled={Boolean(subscriptionId)}
            featureCodes={featureCodes}
          />
        </TabsContent>

        <TabsContent
          value="credits"
          className="mt-4"
        >
          <CreditsAddonsTab />
        </TabsContent>

        <TabsContent
          value="history"
          className="mt-4"
        >
          <HistoryTab />
        </TabsContent>
      </Tabs>

      <DangerZoneSection
        subscription={subscription}
        onOpenCancel={() => setIsCancelOpen(true)}
      />

      <CancelSubscriptionSheet
        open={isCancelOpen}
        onOpenChange={setIsCancelOpen}
        subscriptionId={subscriptionId}
        onCancelled={() => navigate(PLANS_PATH)}
      />
    </div>
  );
}

export default OwnerSubscriptionDashboard;
