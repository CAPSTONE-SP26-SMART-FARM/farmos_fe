import SubscriptionLifecycleManagementPage from "@/pages/SubscriptionLifecycle/SubscriptionLifecycleManagementPage";
import { useParams } from "react-router";

function OwnerSubscriptionDetailPage() {
  const { subscriptionId = "" } = useParams<{ subscriptionId: string }>();

  return (
    <SubscriptionLifecycleManagementPage
      mode="owner"
      detailOnly
      initialSubscriptionId={subscriptionId}
    />
  );
}

export default OwnerSubscriptionDetailPage;
