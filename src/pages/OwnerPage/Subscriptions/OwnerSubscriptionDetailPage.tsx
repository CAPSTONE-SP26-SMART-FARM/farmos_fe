import { useParams } from "react-router";
import { useSubscriptionDetail } from "@/queries/useSubscription";
import { useDynamicBreadcrumb } from "@/stores/breadcrumbStore";
import OwnerSubscriptionDashboard from "./components/OwnerSubscriptionDashboard";

function OwnerSubscriptionDetailPage() {
  const { subscriptionId = "" } = useParams<{ subscriptionId: string }>();

  const detailQuery = useSubscriptionDetail(subscriptionId, Boolean(subscriptionId));
  const planName = detailQuery.data?.data?.subscription?.plan?.name;
  useDynamicBreadcrumb(
    `/dashboard/owner/subscriptions/${subscriptionId}`,
    planName,
  );

  return (
    <OwnerSubscriptionDashboard
      subscriptionId={subscriptionId}
      showBreadcrumb
    />
  );
}

export default OwnerSubscriptionDetailPage;
