import { useQueries, useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/endpoints";
import { dailyLogService } from "@/services/dailyLogService";
import type {
  ListDailyLogsQueryType,
  ListTasksForDailyLogQueryType,
} from "@/schemaValidatation/dailyLog";

export const useDailyLogTasksToday = (
  query: ListTasksForDailyLogQueryType,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: QUERY_KEYS.dailyLogs.tasks(query as Record<string, unknown>),
    queryFn: () => dailyLogService.listTasksToday(query),
    enabled: options?.enabled ?? true,
  });

export const useOwnerDailyLogsByFarm = (
  farmId: string | undefined,
  query: ListDailyLogsQueryType,
) =>
  useQuery({
    queryKey: QUERY_KEYS.dailyLogs.ownerByFarm(
      farmId ?? "",
      query as Record<string, unknown>,
    ),
    queryFn: () => dailyLogService.listOwnerByFarm(farmId as string, query),
    enabled: !!farmId,
  });

export const useManagerDailyLogsByZone = (
  zoneId: string | undefined,
  query: ListDailyLogsQueryType,
) =>
  useQuery({
    queryKey: QUERY_KEYS.dailyLogs.managerByZone(
      zoneId ?? "",
      query as Record<string, unknown>,
    ),
    queryFn: () => dailyLogService.listManagerByZone(zoneId as string, query),
    enabled: !!zoneId,
  });

/**
 * Fetch daily logs across multiple zones (manager use-case).
 * Returns a flat list merged from all zone responses.
 */
export const useManagerDailyLogsByZones = (
  zoneIds: string[],
  query: ListDailyLogsQueryType,
) =>
  useQueries({
    queries: zoneIds.map((zoneId) => ({
      queryKey: QUERY_KEYS.dailyLogs.managerByZone(
        zoneId,
        query as Record<string, unknown>,
      ),
      queryFn: () => dailyLogService.listManagerByZone(zoneId, query),
      enabled: !!zoneId,
    })),
  });
