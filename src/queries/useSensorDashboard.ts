import { useMemo, useEffect, useRef, useCallback } from "react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import { productionMilestoneService } from "@/services/productionMilestoneService";
import {
  milestoneIotDeviceService,
  ownerMilestoneIotDeviceService,
} from "@/services/milestoneIotDeviceService";
import {
  ownerSensorReadingService,
  managerSensorReadingService,
} from "@/services/sensorReadingService";
import {
  useManagerListAssignedZones,
  useOwnerListZones,
} from "@/queries/useZone";
import { getSocketInstance } from "@/lib/socket";
import { useSocketStore } from "@/stores/socketStore";
import type { ProductionMilestoneResType } from "@/schemaValidatation/productionMilestone";
import type { MilestoneAssignmentDetailResType } from "@/schemaValidatation/milestoneIotDevice";
import type {
  GetLatestReadingsByAssignmentResType,
  LatestSensorReadingResType,
} from "@/schemaValidatation/sensorReading";

// ── Public types ──────────────────────────────────────────────────────

export interface ZoneGroup {
  zoneId: string;
  zoneName: string;
  milestone: ProductionMilestoneResType;
  assignment: MilestoneAssignmentDetailResType;
  readings: LatestSensorReadingResType[];
}

export interface DashboardData {
  zones: ZoneGroup[];
  allReadings: LatestSensorReadingResType[];
  isLoading: boolean;
  isPartiallyLoaded: boolean;
  hasError: boolean;
}

// ── Hook ──────────────────────────────────────────────────────────────

export function useSensorDashboard(
  role: "owner" | "manager",
  farmId?: string,
): DashboardData {
  // === Step 1: Fetch zones ===
  const zonesQueryManager = useManagerListAssignedZones({
    page: 1,
    limit: 80,
  });
  const zonesQueryOwner = useOwnerListZones(farmId ?? "", {
    page: 1,
    limit: 80,
  });
  const zonesQuery = role === "manager" ? zonesQueryManager : zonesQueryOwner;

  // === Step 2: Fetch all in_progress milestones ===
  const milestonesQuery = useQuery({
    queryKey:
      role === "manager"
        ? QUERY_KEYS.manager.productionMilestones.listAll({
            status: "in_progress",
          })
        : QUERY_KEYS.owner.productionMilestones.listAll({
            status: "in_progress",
          }),
    queryFn: () => {
      const fn =
        role === "manager"
          ? productionMilestoneService.listAll
          : productionMilestoneService.ownerListAll;
      return fn({ page: 1, limit: 80, status: "in_progress" }).then(
        (r) => r.data,
      );
    },
    staleTime: 30_000,
  });

  const milestones = useMemo(
    () => milestonesQuery.data?.data ?? [],
    [milestonesQuery.data],
  );

  // === Step 3: Fetch assignment per milestone ===
  const assignmentQueries = useQueries({
    queries: milestones.map((m) => ({
      queryKey:
        role === "manager"
          ? QUERY_KEYS.manager.productionMilestones.assignment(m.id)
          : QUERY_KEYS.owner.productionMilestones.assignment(m.id),
      queryFn: () => {
        const svc =
          role === "manager"
            ? milestoneIotDeviceService
            : ownerMilestoneIotDeviceService;
        return svc.getAssignment(m.id).then((r) => r.data);
      },
      staleTime: 60_000,
      enabled: milestones.length > 0,
    })),
  });

  // Extract assignments that actually have device data
  const assignments = useMemo(() => {
    const result: {
      milestone: ProductionMilestoneResType;
      assignment: MilestoneAssignmentDetailResType;
    }[] = [];
    assignmentQueries.forEach((q, idx) => {
      if (q.data?.data) {
        result.push({ milestone: milestones[idx], assignment: q.data.data });
      }
    });
    return result;
  }, [assignmentQueries, milestones]);

  // === Step 4: Fetch latest readings per assignment ===
  const readingQueries = useQueries({
    queries: assignments.map(({ assignment }) => ({
      queryKey:
        role === "manager"
          ? QUERY_KEYS.manager.sensorReadings.latest(assignment.assignmentId)
          : QUERY_KEYS.owner.sensorReadings.latest(assignment.assignmentId),
      queryFn: () => {
        const svc =
          role === "manager"
            ? managerSensorReadingService
            : ownerSensorReadingService;
        return svc.getLatest(assignment.assignmentId).then((r) => r.data);
      },
      staleTime: 10_000,
      refetchInterval: 60_000,
      refetchOnWindowFocus: true,
      enabled: assignments.length > 0,
    })),
  });

  // === Step 5: Build zone map for names ===
  const zoneMap = useMemo(() => {
    const map = new Map<string, string>();
    const items = zonesQuery.data?.data?.data ?? [];
    for (const z of items) {
      map.set(z.id, z.name);
    }
    return map;
  }, [zonesQuery.data]);

  // === Step 6: Aggregate into ZoneGroups ===
  const zones = useMemo<ZoneGroup[]>(() => {
    return assignments
      .map(({ milestone, assignment }, idx) => {
        const readingData = readingQueries[idx]?.data as
          | GetLatestReadingsByAssignmentResType
          | undefined;
        return {
          zoneId: assignment.zoneId,
          zoneName:
            zoneMap.get(assignment.zoneId) ??
            `Khu vực #${assignment.zoneId.slice(0, 8)}`,
          milestone,
          assignment,
          readings: readingData?.data ?? [],
        };
      })
      .sort((a, b) => a.zoneName.localeCompare(b.zoneName));
  }, [assignments, readingQueries, zoneMap]);

  const allReadings = useMemo(() => zones.flatMap((z) => z.readings), [zones]);

  // === Loading state ===
  const isLoading =
    zonesQuery.isLoading ||
    milestonesQuery.isLoading ||
    (milestones.length > 0 && assignmentQueries.every((q) => q.isLoading));

  const isPartiallyLoaded =
    !isLoading &&
    readingQueries.length > 0 &&
    readingQueries.some((q) => q.isLoading);

  const hasError = zonesQuery.isError || milestonesQuery.isError;

  return { zones, allReadings, isLoading, isPartiallyLoaded, hasError };
}

// ── Realtime invalidation for dashboard (all assignments) ─────────────

export function useDashboardRealtime(
  zones: ZoneGroup[],
  role: "owner" | "manager",
): void {
  const connected = useSocketStore((s) => s.connected);
  const queryClient = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const invalidateAll = useCallback(() => {
    for (const zone of zones) {
      const key =
        role === "owner"
          ? QUERY_KEYS.owner.sensorReadings.latest(zone.assignment.assignmentId)
          : QUERY_KEYS.manager.sensorReadings.latest(
              zone.assignment.assignmentId,
            );
      queryClient.invalidateQueries({ queryKey: key });
    }
  }, [zones, role, queryClient]);

  const debouncedInvalidate = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(invalidateAll, 500);
  }, [invalidateAll]);

  useEffect(() => {
    const socket = getSocketInstance();
    if (!socket || !connected || zones.length === 0) return;

    const assignmentIds = new Set(zones.map((z) => z.assignment.assignmentId));

    const handleReadingChanged = (payload: {
      assignmentId: string;
      zoneId: string;
      milestoneId: string;
    }) => {
      if (assignmentIds.has(payload.assignmentId)) {
        debouncedInvalidate();
      }
    };

    const handleAlertCreated = () => {
      debouncedInvalidate();
      // Also invalidate alerts list
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    };

    socket.on("sensor.reading.changed", handleReadingChanged);
    socket.on("alert.created", handleAlertCreated);

    return () => {
      socket.off("sensor.reading.changed", handleReadingChanged);
      socket.off("alert.created", handleAlertCreated);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [connected, zones, debouncedInvalidate, queryClient]);
}
