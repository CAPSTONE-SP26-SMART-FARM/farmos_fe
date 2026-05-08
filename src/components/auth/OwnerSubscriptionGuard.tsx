import { useEffect } from "react";
import { Navigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import { useOwnerMySubscription } from "@/queries/useSubscription";
import { useAuthStore } from "@/stores/authStore";
import { Loader2 } from "lucide-react";

const SUBSCRIPTIONS_PATH = "/dashboard/owner/subscriptions";

export function OwnerSubscriptionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const isOwner = user?.role === "owner";
  const queryClient = useQueryClient();

  const mySubQuery = useOwnerMySubscription(isOwner);

  const sub = mySubQuery.data?.data;
  const isActive = sub?.status === "ACTIVE";

  // Case 3: subscription expires while user is on a gated page.
  // Schedule an invalidation at the exact expiresAt moment so the guard
  // re-evaluates and redirects without waiting for staleTime to elapse.
  useEffect(() => {
    if (!isOwner || !isActive || !sub?.expiresAt) return;

    const msUntilExpiry = new Date(sub.expiresAt).getTime() - Date.now();
    if (msUntilExpiry <= 0) {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscriptions.my() });
      return;
    }

    const timer = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscriptions.my() });
    }, msUntilExpiry);

    return () => clearTimeout(timer);
  }, [isOwner, isActive, sub?.expiresAt, queryClient]);

  if (!isOwner) return <>{children}</>;

  if (mySubQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!isActive) {
    return <Navigate to={SUBSCRIPTIONS_PATH} replace />;
  }

  return <>{children}</>;
}
