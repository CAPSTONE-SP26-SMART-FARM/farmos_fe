import { useParams } from "react-router";
import OwnerSubscriptionDashboard from "./components/OwnerSubscriptionDashboard";

function OwnerSubscriptionDetailPage() {
  const { subscriptionId = "" } = useParams<{ subscriptionId: string }>();

  return (
    <OwnerSubscriptionDashboard
      subscriptionId={subscriptionId}
      showBreadcrumb
    />
  );
}

export default OwnerSubscriptionDetailPage;
