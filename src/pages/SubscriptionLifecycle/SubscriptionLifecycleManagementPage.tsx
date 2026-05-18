import SubscriptionLifecyclePanel from "@/pages/SubscriptionPlans/components/SubscriptionLifecyclePanel";

type PageMode = "admin" | "owner";

interface Props {
  mode: PageMode;
  detailOnly?: boolean;
  initialSubscriptionId?: string;
  onBack?: () => void;
}

function SubscriptionLifecycleManagementPage({
  mode,
  detailOnly = false,
  initialSubscriptionId,
  onBack,
}: Props) {
  return (
    <SubscriptionLifecyclePanel
      mode={mode}
      detailOnly={detailOnly}
      initialSubscriptionId={initialSubscriptionId}
      onBack={onBack}
    />
  );
}

export default SubscriptionLifecycleManagementPage;
