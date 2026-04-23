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

    socket.on(RealtimeEvents.IncidentTicketCreated, onCreated);
    socket.on(RealtimeEvents.IncidentTicketEnded, onEnded);

    return () => {
      socket.off(RealtimeEvents.IncidentTicketCreated, onCreated);
      socket.off(RealtimeEvents.IncidentTicketEnded, onEnded);
      if (timer) clearTimeout(timer);
    };
  }, [connected, role, queryClient]);
}
