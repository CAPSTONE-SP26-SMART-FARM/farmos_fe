import SubscriptionLifecyclePanel from "@/pages/SubscriptionPlans/components/SubscriptionLifecyclePanel";

type PageMode = "admin" | "owner";

interface Props {
  mode: PageMode;
  detailOnly?: boolean;
  initialSubscriptionId?: string;
}

function SubscriptionLifecycleManagementPage({
  mode,
  detailOnly = false,
  initialSubscriptionId,
}: Props) {
  return (
    <SubscriptionLifecyclePanel
      mode={mode}
      detailOnly={detailOnly}
      initialSubscriptionId={initialSubscriptionId}
    />
  );
}

export default SubscriptionLifecycleManagementPage;
