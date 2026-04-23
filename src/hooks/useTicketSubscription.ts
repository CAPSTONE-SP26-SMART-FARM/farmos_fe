import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocketInstance } from "@/lib/socket";
import { useSocketStore } from "@/stores/socketStore";
import { useAuthStore } from "@/stores/authStore";
import {
  RealtimeClientEvents,
  RealtimeEvents,
  REALTIME_INVALIDATE_DEBOUNCE_MS,
  type RealtimeAck,
} from "@/constants/realtime";
import { RoleName } from "@/constants/role";
import { TicketMessageCreatedPayloadSchema } from "@/schemaValidatation/realtime";

/**
 * Dùng trong ticket detail panel (owner / manager). Đăng ký:
 *  - emit `ticket.subscribe` để vào room `ticket:{id}` cho BE push message.
 *  - listen `ticket.message.created` → invalidate `["tickets", ticketId, "messages"]`
 *    với debounce 500ms để gom burst message.
 *
 * Admin / doctor / farmer không emit subscribe (FE không hỗ trợ đầy đủ
 * dashboard 3 role này cho ticket; BE sẽ deny doctor/farmer nếu không
 * phải assignee/creator). Ticket message chỉ target owner/manager.
 */
export function useTicketSubscription(ticketId: string | undefined): void {
  const connected = useSocketStore((s) => s.connected);
  const role = useAuthStore((s) => s.user?.role);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!connected || !ticketId || !role) return;
    const socket = getSocketInstance();
    if (!socket) return;
    if (role !== RoleName.Owner && role !== RoleName.Manager) return;

    socket.emit(
      RealtimeClientEvents.TicketSubscribe,
      { ticketId },
      (ack: RealtimeAck) => {
        if (!ack?.ok) {
          console.warn("[realtime] ticket.subscribe denied", ticketId);
        }
      },
    );

    let timer: ReturnType<typeof setTimeout> | null = null;
    const onMessage = (raw: unknown) => {
      const parsed = TicketMessageCreatedPayloadSchema.safeParse(raw);
      if (!parsed.success) return;
      if (parsed.data.ticketId !== ticketId) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["tickets", ticketId, "messages"],
        });
      }, REALTIME_INVALIDATE_DEBOUNCE_MS);
    };

    socket.on(RealtimeEvents.TicketMessageCreated, onMessage);

    return () => {
      socket.off(RealtimeEvents.TicketMessageCreated, onMessage);
      if (timer) clearTimeout(timer);
    };
  }, [connected, ticketId, role, queryClient]);
}
