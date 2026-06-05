import { useEffect, useLayoutEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocketInstance } from "@/lib/socket";
import { useSocketStore } from "@/stores/socketStore";
import { QUERY_KEYS } from "@/constants";
import { RealtimeEvents } from "@/constants/realtime";
import {
  PrescriptionCreatedPayloadSchema,
  TicketAssignedPayloadSchema,
  TicketResolvedPayloadSchema,
  TicketClosedPayloadSchema,
  TicketFallbackRequiredPayloadSchema,
  WalletCreditedPayloadSchema,
} from "@/schemaValidatation/realtime";
import { useTicketSubscription } from "./useTicketSubscription";

/**
 * Hook dùng trong `TicketDetailPanelV2` (Owner/Manager) và `AdminTicketDetailPage`.
 * Tự động:
 *  - Subscribe socket room ticket (qua `useTicketSubscription`).
 *  - Lắng nghe 5 event lifecycle Module 3 (assigned/resolved/closed/fallback/wallet).
 *  - Filter theo `ticketId` chính xác trước khi invalidate.
 *  - Invalidate cả `tickets.full(id)` (Owner/Manager) và `tickets.adminFull(id)` (Admin).
 *  - Khi nhận `ticket.fallback-required` đúng ticket → gọi callback `onFallbackRequired`
 *    để cha tự mở `AbandonResolutionModal`.
 *
 * Lưu ý: hook KHÔNG hiển thị toast trực tiếp — caller (component) tự xử lý
 * toast theo context UI để tránh duplicate với `useRealtimeTicket` đã chạy
 * ở list page.
 */
export function useRealtimeTicketDetail(
  ticketId: string | undefined,
  options?: {
    onFallbackRequired?: (payload: { doctorId?: string }) => void;
    onAssigned?: () => void;
    onResolved?: () => void;
    onClosed?: () => void;
    onWalletCredited?: () => void;
  },
): void {
  const connected = useSocketStore((s) => s.connected);
  const queryClient = useQueryClient();
  // Giữ callback ref để effect không re-bind khi parent rerender.
  const optionsRef = useRef(options);
  useLayoutEffect(() => {
    optionsRef.current = options;
  });

  // Vào room ticket — endpoint này đã enforce chỉ Owner/Manager. Admin
  // (xem A8) sẽ KHÔNG join được room qua hook này; pending decision với BE
  // về việc cho Admin subscribe (xem mục 9.8 v2 doc).
  useTicketSubscription(ticketId);

  useEffect(() => {
    if (!connected || !ticketId) return;
    const socket = getSocketInstance();
    if (!socket) return;

    const invalidateFull = () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ticketsExt.full(ticketId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ticketsExt.adminFull(ticketId),
      });
      // v2 detail panel cần refresh metadata (status, assignee, attachments)
      // ngay khi lifecycle event đổi state.
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ticketsV2.detail(ticketId),
      });
    };

    const onAssigned = (raw: unknown) => {
      const parsed = TicketAssignedPayloadSchema.safeParse(raw);
      if (!parsed.success || parsed.data.ticketId !== ticketId) return;
      invalidateFull();
      optionsRef.current?.onAssigned?.();
    };

    const onResolved = (raw: unknown) => {
      const parsed = TicketResolvedPayloadSchema.safeParse(raw);
      if (!parsed.success || parsed.data.ticketId !== ticketId) return;
      invalidateFull();
      optionsRef.current?.onResolved?.();
    };

    const onClosed = (raw: unknown) => {
      const parsed = TicketClosedPayloadSchema.safeParse(raw);
      if (!parsed.success || parsed.data.ticketId !== ticketId) return;
      invalidateFull();
      // Khi ticket close → list cũng cần refresh (legacy doctor list + v2).
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tickets.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ticketsV2.root });
      optionsRef.current?.onClosed?.();
    };

    const onFallbackRequired = (raw: unknown) => {
      const parsed = TicketFallbackRequiredPayloadSchema.safeParse(raw);
      if (!parsed.success || parsed.data.ticketId !== ticketId) return;
      invalidateFull();
      optionsRef.current?.onFallbackRequired?.({
        doctorId: parsed.data.doctorId,
      });
    };

    const onWalletCredited = (raw: unknown) => {
      const parsed = WalletCreditedPayloadSchema.safeParse(raw);
      if (!parsed.success || parsed.data.ticketId !== ticketId) return;
      // Wallet credited không cần invalidate ticket; chỉ chuyển callback.
      optionsRef.current?.onWalletCredited?.();
    };

    // BE event `prescription.incident.created` — emit khi Doctor tạo/reissue
    // đơn thuốc. FE invalidate full payload để render đơn thuốc mới.
    const onPrescriptionCreated = (raw: unknown) => {
      const parsed = PrescriptionCreatedPayloadSchema.safeParse(raw);
      if (!parsed.success || parsed.data.ticketId !== ticketId) return;
      invalidateFull();
    };

    socket.on(RealtimeEvents.TicketAssigned, onAssigned);
    socket.on(RealtimeEvents.TicketResolved, onResolved);
    socket.on(RealtimeEvents.TicketClosed, onClosed);
    socket.on(RealtimeEvents.TicketFallbackRequired, onFallbackRequired);
    socket.on(RealtimeEvents.WalletCredited, onWalletCredited);
    socket.on(RealtimeEvents.PrescriptionCreated, onPrescriptionCreated);

    return () => {
      socket.off(RealtimeEvents.TicketAssigned, onAssigned);
      socket.off(RealtimeEvents.TicketResolved, onResolved);
      socket.off(RealtimeEvents.TicketClosed, onClosed);
      socket.off(RealtimeEvents.TicketFallbackRequired, onFallbackRequired);
      socket.off(RealtimeEvents.WalletCredited, onWalletCredited);
      socket.off(RealtimeEvents.PrescriptionCreated, onPrescriptionCreated);
    };
  }, [connected, ticketId, queryClient]);
}
