import OwnerSubscriptionDashboard from "./components/OwnerSubscriptionDashboard";
import { useRealtimeBilling } from "@/hooks/useRealtimeBilling";

function OwnerSubscriptionsPage() {
  useRealtimeBilling();
  return <OwnerSubscriptionDashboard />;
}

export default OwnerSubscriptionsPage;
