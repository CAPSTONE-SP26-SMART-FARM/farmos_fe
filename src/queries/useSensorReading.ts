import { useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import {
  ownerSensorReadingService,
  managerSensorReadingService,
  sensorReadingService,
} from "@/services/sensorReadingService";
import { getSocketInstance } from "@/lib/socket";
import { useSocketStore } from "@/stores/socketStore";
import { RealtimeEvents } from "@/constants/realtime";
import type {
  SensorIntervalType,
  SensorStatsPeriodType,
} from "@/schemaValidatation/sensorReading";

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

// ── Common (route chung — owner/manager/farmer) ────────────────────────

/**
 * Polling cadence theo bucket interval — dot mới xuất hiện đều theo nhịp bucket.
 * Bucket >= 1D: không poll (data lịch sử, refetch khi focus là đủ).
 */
export function refetchIntervalFor(
  interval: SensorIntervalType,
): number | false {
  if (interval === "10s") return 10_000;
  if (interval === "1m") return 60_000;
  if (interval === "1h") return 360_000;
  return false;
}

export const useSensorSeriesInterval = (
  assignmentId: string,
  sensorId: string,
  interval: SensorIntervalType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.common.sensorReadings.seriesInterval(
      assignmentId,
      sensorId,
      interval,
    ),
    queryFn: () =>
      sensorReadingService
        .getSeriesInterval(assignmentId, sensorId, interval)
        .then((r) => r.data),
    enabled: !!assignmentId && !!sensorId && enabled,
    staleTime: 15_000,
    refetchInterval: refetchIntervalFor(interval),
    placeholderData: (prev) => prev,
  });
};

export const useSensorStats = (
  assignmentId: string,
  sensorId: string,
  period: SensorStatsPeriodType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.common.sensorReadings.stats(
      assignmentId,
      sensorId,
      period,
    ),
    queryFn: () =>
      sensorReadingService
        .getStats(assignmentId, sensorId, period)
        .then((r) => r.data),
    enabled: !!assignmentId && !!sensorId && enabled,
    staleTime: 15_000,
    refetchInterval: period === "today" ? 30_000 : false,
    placeholderData: (prev) => prev,
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
    const latestKey =
      role === "owner"
        ? QUERY_KEYS.owner.sensorReadings.latest(assignmentId)
        : QUERY_KEYS.manager.sensorReadings.latest(assignmentId);
    queryClient.invalidateQueries({ queryKey: latestKey });
    // NOTE: `common.sensor-readings.{seriesInterval,stats}` cố ý KHÔNG invalidate
    // qua socket — giữ nhịp polling cố định để countdown UI dự đoán được.
    // Chart sẽ refresh theo `refetchInterval` của hook (15s/60s tuỳ interval).
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

    // Sensor health events không kèm assignmentId trong payload BE →
    // invalidate unconditionally: refetch reading để classifier cập nhật
    // timestamp mới nhất / trạng thái BE đã chốt (timeout/hardware).
    const handleSensorHealth = () => debouncedInvalidate();

    socket.on("sensor.reading.changed", handleReadingChanged);
    socket.on("alert.created", handleAlertCreated);
    socket.on(RealtimeEvents.SensorTimeoutDetected, handleSensorHealth);
    socket.on(RealtimeEvents.SensorTimeoutRecovered, handleSensorHealth);
    socket.on(RealtimeEvents.SensorHardwareIssueDetected, handleSensorHealth);
    socket.on(RealtimeEvents.SensorAlertRecovered, handleSensorHealth);

    return () => {
      socket.off("sensor.reading.changed", handleReadingChanged);
      socket.off("alert.created", handleAlertCreated);
      socket.off(RealtimeEvents.SensorTimeoutDetected, handleSensorHealth);
      socket.off(RealtimeEvents.SensorTimeoutRecovered, handleSensorHealth);
      socket.off(
        RealtimeEvents.SensorHardwareIssueDetected,
        handleSensorHealth,
      );
      socket.off(RealtimeEvents.SensorAlertRecovered, handleSensorHealth);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [connected, assignmentId, debouncedInvalidate]);
}
