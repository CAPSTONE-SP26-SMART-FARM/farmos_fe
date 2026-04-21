import SubscriptionLifecycleManagementPage from "@/pages/SubscriptionLifecycle/SubscriptionLifecycleManagementPage";

function AdminSubscriptionsPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <SubscriptionLifecycleManagementPage mode="admin" />
    </div>
  );
}

export default AdminSubscriptionsPage;
