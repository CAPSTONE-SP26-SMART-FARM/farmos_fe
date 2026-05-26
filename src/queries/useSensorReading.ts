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
  ListSensorReadingsQueryType,
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

// ── Time-series (legacy raw series per sensor) ─────────────────────────

export const useOwnerSensorReadingSeries = (
  assignmentId: string,
  sensorId: string,
  query: ListSensorReadingsQueryType = {},
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.owner.sensorReadings.series(
      assignmentId,
      sensorId,
      query,
    ),
    queryFn: () =>
      ownerSensorReadingService
        .getSeries(assignmentId, sensorId, query)
        .then((r) => r.data),
    enabled: !!assignmentId && !!sensorId && enabled,
    staleTime: 30_000,
  });
};

export const useManagerSensorReadingSeries = (
  assignmentId: string,
  sensorId: string,
  query: ListSensorReadingsQueryType = {},
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.manager.sensorReadings.series(
      assignmentId,
      sensorId,
      query,
    ),
    queryFn: () =>
      managerSensorReadingService
        .getSeries(assignmentId, sensorId, query)
        .then((r) => r.data),
    enabled: !!assignmentId && !!sensorId && enabled,
    staleTime: 30_000,
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
  options?: { skipDeviceLifecycle?: boolean },
): void {
  // Caller có thể tắt 3 listener IotDevice* khi đã mount `useMilestoneAssignmentsRealtime`
  // ở scope ngoài (vd: SensorOverviewTab) để tránh trùng invalidate cùng query key.
  const skipDeviceLifecycle = options?.skipDeviceLifecycle ?? false;
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

  // Khi board nhận data lần đầu → BE flip status install → active và emit
  // `iot.device.activated`. Cần invalidate list assignment để badge cập nhật.
  const invalidateAssignments = useCallback(() => {
    queryClient.invalidateQueries({
      predicate: (q) => {
        const k = q.queryKey;
        return (
          Array.isArray(k) &&
          k[0] === role &&
          k[1] === "production-milestones" &&
          (k[3] === "assignments" || k[3] === "assignments-search")
        );
      },
    });
  }, [role, queryClient]);

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

    // Device lifecycle: chỉ refetch list assignments (cập nhật badge status).
    // Không invalidate reading vì chưa chắc liên quan tới `assignmentId` này.
    const handleDeviceLifecycle = () => invalidateAssignments();

    socket.on("sensor.reading.changed", handleReadingChanged);
    socket.on("alert.created", handleAlertCreated);
    socket.on(RealtimeEvents.SensorTimeoutDetected, handleSensorHealth);
    socket.on(RealtimeEvents.SensorTimeoutRecovered, handleSensorHealth);
    socket.on(RealtimeEvents.SensorHardwareIssueDetected, handleSensorHealth);
    socket.on(RealtimeEvents.SensorAlertRecovered, handleSensorHealth);
    if (!skipDeviceLifecycle) {
      socket.on(RealtimeEvents.IotDeviceActivated, handleDeviceLifecycle);
      socket.on(RealtimeEvents.IotDeviceStatusChanged, handleDeviceLifecycle);
      socket.on(RealtimeEvents.IotDeviceSwapped, handleDeviceLifecycle);
    }

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
      if (!skipDeviceLifecycle) {
        socket.off(RealtimeEvents.IotDeviceActivated, handleDeviceLifecycle);
        socket.off(
          RealtimeEvents.IotDeviceStatusChanged,
          handleDeviceLifecycle,
        );
        socket.off(RealtimeEvents.IotDeviceSwapped, handleDeviceLifecycle);
      }
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    connected,
    assignmentId,
    debouncedInvalidate,
    invalidateAssignments,
    skipDeviceLifecycle,
  ]);
}

/**
 * Lắng các event device lifecycle (activated / status changed / swapped) và
 * invalidate danh sách milestone assignments để badge trạng thái (install →
 * active …) cập nhật ngay, không phụ thuộc vào việc dialog có mở hay không.
 *
 * Dùng ở cấp tab (SensorOverviewTab / OwnerSensorOverviewTab) — luôn mounted
 * khi user đang xem tab cảm biến của vụ mùa.
 */
export function useMilestoneAssignmentsRealtime(
  role: "owner" | "manager",
): void {
  const connected = useSocketStore((s) => s.connected);
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocketInstance();
    if (!socket || !connected) return;

    const invalidate = () => {
      queryClient.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey;
          return (
            Array.isArray(k) &&
            k[0] === role &&
            k[1] === "production-milestones" &&
            (k[3] === "assignments" || k[3] === "assignments-search")
          );
        },
      });
    };

    socket.on(RealtimeEvents.IotDeviceActivated, invalidate);
    socket.on(RealtimeEvents.IotDeviceStatusChanged, invalidate);
    socket.on(RealtimeEvents.IotDeviceSwapped, invalidate);

    return () => {
      socket.off(RealtimeEvents.IotDeviceActivated, invalidate);
      socket.off(RealtimeEvents.IotDeviceStatusChanged, invalidate);
      socket.off(RealtimeEvents.IotDeviceSwapped, invalidate);
    };
  }, [connected, role, queryClient]);
}
