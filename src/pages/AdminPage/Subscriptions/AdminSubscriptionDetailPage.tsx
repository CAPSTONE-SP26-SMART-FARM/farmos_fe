import SubscriptionLifecycleManagementPage from "@/pages/SubscriptionLifecycle/SubscriptionLifecycleManagementPage";
import { useParams } from "react-router";

function AdminSubscriptionDetailPage() {
  const { subscriptionId = "" } = useParams<{ subscriptionId: string }>();

  return (
    <SubscriptionLifecycleManagementPage
      mode="admin"
      detailOnly
      initialSubscriptionId={subscriptionId}
    />
  );
}

export default AdminSubscriptionDetailPage;
