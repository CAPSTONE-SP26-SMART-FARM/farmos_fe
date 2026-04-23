import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocketInstance } from "@/lib/socket";
import { useSocketStore } from "@/stores/socketStore";
import { useAuthStore } from "@/stores/authStore";
import {
  RealtimeEvents,
  REALTIME_INVALIDATE_DEBOUNCE_MS,
} from "@/constants/realtime";
import { RoleName } from "@/constants/role";

/**
 * Listener cho trang billing của owner (subscription / payments). Lắng nghe
 * các event billing → invalidate cache subscription/invoice. Bell
 * notification đã được useRealtimeEvents lo.
 */
export function useRealtimeBilling(): void {
  const connected = useSocketStore((s) => s.connected);
  const role = useAuthStore((s) => s.user?.role);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!connected || role !== RoleName.Owner) return;
    const socket = getSocketInstance();
    if (!socket) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const debounce = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
      }, REALTIME_INVALIDATE_DEBOUNCE_MS);
    };

    const events = [
      RealtimeEvents.SubscriptionCheckoutRequired,
      RealtimeEvents.SubscriptionActivated,
      RealtimeEvents.InvoiceCheckoutCreated,
      RealtimeEvents.InvoicePaid,
    ];

    for (const e of events) socket.on(e, debounce);

    return () => {
      for (const e of events) socket.off(e, debounce);
      if (timer) clearTimeout(timer);
    };
  }, [connected, role, queryClient]);
}
