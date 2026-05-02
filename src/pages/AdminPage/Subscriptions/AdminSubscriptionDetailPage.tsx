import SubscriptionLifecycleManagementPage from "@/pages/SubscriptionLifecycle/SubscriptionLifecycleManagementPage";
import { useParams } from "react-router";
import { useSubscriptionDetail } from "@/queries/useSubscription";
import { useDynamicBreadcrumb } from "@/stores/breadcrumbStore";

function AdminSubscriptionDetailPage() {
  const { subscriptionId = "" } = useParams<{ subscriptionId: string }>();

  const detailQuery = useSubscriptionDetail(subscriptionId, Boolean(subscriptionId));
  const planName = detailQuery.data?.data?.subscription?.plan?.name;
  useDynamicBreadcrumb(
    `/dashboard/admin/subscriptions/${subscriptionId}`,
    planName,
  );

  return (
    <SubscriptionLifecycleManagementPage
      mode="admin"
      detailOnly
      initialSubscriptionId={subscriptionId}
    />
  );
}

export default AdminSubscriptionDetailPage;
