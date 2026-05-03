import { useEffect, useLayoutEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocketInstance } from "@/lib/socket";
import { useSocketStore } from "@/stores/socketStore";
import {
  RealtimeEvents,
  REALTIME_INVALIDATE_DEBOUNCE_MS,
} from "@/constants/realtime";
import { QUERY_KEYS } from "@/constants";
import {
  IncidentTicketCreatedPayloadSchema,
  IncidentTicketEndedPayloadSchema,
  TicketAssignedPayloadSchema,
  TicketResolvedPayloadSchema,
  TicketClosedPayloadSchema,
  TicketFallbackRequiredPayloadSchema,
} from "@/schemaValidatation/realtime";
import { RoleName, type RoleNameType } from "@/constants/role";

/**
 * Listener cho trang danh sách ticket (owner / manager). Lắng nghe
 * `ticket.incident.created` và `ticket.incident.ended`, chỉ invalidate
 * query ownerList / managerList đúng scope (farmId hoặc zoneId).
 *
 * Bell notification đã được useRealtimeEvents xử lý — hook này chỉ lo
 * invalidate list riêng để refetch nhanh.
 */
export function useRealtimeTicket(
  role: RoleNameType,
  scope: { farmId?: string; zoneId?: string },
): void {
  const connected = useSocketStore((s) => s.connected);
  const queryClient = useQueryClient();
  const scopeRef = useRef(scope);
  useLayoutEffect(() => {
    scopeRef.current = scope;
  });

  useEffect(() => {
    if (!connected) return;
    const socket = getSocketInstance();
    if (!socket) return;
    if (role !== RoleName.Owner && role !== RoleName.Manager) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const debouncedInvalidate = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tickets.all });
      }, REALTIME_INVALIDATE_DEBOUNCE_MS);
    };

    const onCreated = (raw: unknown) => {
      const parsed = IncidentTicketCreatedPayloadSchema.safeParse(raw);
      if (!parsed.success) return;
      const { farmId, zoneId } = scopeRef.current;
      // Owner scope theo farmId; manager scope theo zoneId nếu có.
      if (role === RoleName.Owner && farmId && parsed.data.farmId !== farmId)
        return;
      if (role === RoleName.Manager && zoneId && parsed.data.zoneId !== zoneId)
        return;
      debouncedInvalidate();
    };

    const onEnded = (raw: unknown) => {
      const parsed = IncidentTicketEndedPayloadSchema.safeParse(raw);
      if (!parsed.success) return;
      const { farmId, zoneId } = scopeRef.current;
      if (role === RoleName.Owner && farmId && parsed.data.farmId !== farmId)
        return;
      if (role === RoleName.Manager && zoneId && parsed.data.zoneId !== zoneId)
        return;
      debouncedInvalidate();
    };

    // ── Module 3 — bốn event lifecycle mới ──────────────────────────────
    // Helper filter scope để 4 handler dưới chia sẻ.
    const matchScope = (payloadFarmId?: string, payloadZoneId?: string) => {
      const { farmId, zoneId } = scopeRef.current;
      if (role === RoleName.Owner && farmId && payloadFarmId !== farmId)
        return false;
      if (role === RoleName.Manager && zoneId && payloadZoneId !== zoneId)
        return false;
      return true;
    };

    const onAssigned = (raw: unknown) => {
      const parsed = TicketAssignedPayloadSchema.safeParse(raw);
      if (!parsed.success) return;
      if (!matchScope(parsed.data.farmId, parsed.data.zoneId)) return;
      debouncedInvalidate();
    };

    const onResolved = (raw: unknown) => {
      const parsed = TicketResolvedPayloadSchema.safeParse(raw);
      if (!parsed.success) return;
      if (!matchScope(parsed.data.farmId, parsed.data.zoneId)) return;
      debouncedInvalidate();
    };

    const onClosed = (raw: unknown) => {
      const parsed = TicketClosedPayloadSchema.safeParse(raw);
      if (!parsed.success) return;
      if (!matchScope(parsed.data.farmId, parsed.data.zoneId)) return;
      debouncedInvalidate();
    };

    const onFallbackRequired = (raw: unknown) => {
      const parsed = TicketFallbackRequiredPayloadSchema.safeParse(raw);
      if (!parsed.success) return;
      if (!matchScope(parsed.data.farmId, parsed.data.zoneId)) return;
      debouncedInvalidate();
    };

    socket.on(RealtimeEvents.IncidentTicketCreated, onCreated);
    socket.on(RealtimeEvents.IncidentTicketEnded, onEnded);
    socket.on(RealtimeEvents.TicketAssigned, onAssigned);
    socket.on(RealtimeEvents.TicketResolved, onResolved);
    socket.on(RealtimeEvents.TicketClosed, onClosed);
    socket.on(RealtimeEvents.TicketFallbackRequired, onFallbackRequired);

    return () => {
      socket.off(RealtimeEvents.IncidentTicketCreated, onCreated);
      socket.off(RealtimeEvents.IncidentTicketEnded, onEnded);
      socket.off(RealtimeEvents.TicketAssigned, onAssigned);
      socket.off(RealtimeEvents.TicketResolved, onResolved);
      socket.off(RealtimeEvents.TicketClosed, onClosed);
      socket.off(RealtimeEvents.TicketFallbackRequired, onFallbackRequired);
      if (timer) clearTimeout(timer);
    };
  }, [connected, role, queryClient]);
}
