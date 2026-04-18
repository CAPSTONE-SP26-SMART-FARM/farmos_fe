import { useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import {
  ownerSensorReadingService,
  managerSensorReadingService,
} from "@/services/sensorReadingService";
import { getSocketInstance } from "@/lib/socket";
import { useSocketStore } from "@/stores/socketStore";

// ── Owner ──────────────────────────────────────────────────────────────

export const useOwnerLatestSensorReadings = (
  assignmentId: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.owner.sensorReadings.latest(assignmentId),
    queryFn: () =>
      ownerSensorReadingService.getLatest(assignmentId).then((r) => r.data),
    enabled: !!assignmentId && enabled,
    staleTime: 10_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
};

// ── Manager ────────────────────────────────────────────────────────────

export const useManagerLatestSensorReadings = (
  assignmentId: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.manager.sensorReadings.latest(assignmentId),
    queryFn: () =>
      managerSensorReadingService.getLatest(assignmentId).then((r) => r.data),
    enabled: !!assignmentId && enabled,
    staleTime: 10_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
};

// ── Realtime invalidation ──────────────────────────────────────────────

/**
 * Listens for `sensor.reading.changed` and `alert.created` socket events
 * scoped to `assignmentId`, then invalidates the matching React Query cache.
 *
 * Includes a 500 ms debounce so that a single ingest cycle (which may fire
 * events for all 4 sensors) only triggers one refetch.
 */
export function useSensorReadingRealtime(
  assignmentId: string | undefined,
  role: "owner" | "manager",
): void {
  const connected = useSocketStore((s) => s.connected);
  const queryClient = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const invalidateReadings = useCallback(() => {
    if (!assignmentId) return;
    const key =
      role === "owner"
        ? QUERY_KEYS.owner.sensorReadings.latest(assignmentId)
        : QUERY_KEYS.manager.sensorReadings.latest(assignmentId);
    queryClient.invalidateQueries({ queryKey: key });
  }, [assignmentId, role, queryClient]);

  const debouncedInvalidate = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(invalidateReadings, 500);
  }, [invalidateReadings]);

  useEffect(() => {
    const socket = getSocketInstance();
    if (!socket || !connected || !assignmentId) return;

    const handleReadingChanged = (payload: {
      assignmentId: string;
      zoneId: string;
      milestoneId: string;
    }) => {
      if (payload.assignmentId === assignmentId) {
        debouncedInvalidate();
      }
    };

    const handleAlertCreated = (_payload: {
      zoneId: string;
      alertId: string;
    }) => {
      // Alert was created for this zone — could invalidate alert queries here
      debouncedInvalidate();
    };

    socket.on("sensor.reading.changed", handleReadingChanged);
    socket.on("alert.created", handleAlertCreated);

    return () => {
      socket.off("sensor.reading.changed", handleReadingChanged);
      socket.off("alert.created", handleAlertCreated);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [connected, assignmentId, debouncedInvalidate]);
}
