import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/endpoints";
import { dailyLogService } from "@/services/dailyLogService";
import { toast } from "sonner";
import type {
  ListDailyLogsQueryType,
  ListManagerTodayTasksQueryType,
  ListTasksForDailyLogQueryType,
  SubmitDailyLogBodyType,
} from "@/schemaValidatation/dailyLog";

export const useFarmerTasksForToday = (
  query: ListTasksForDailyLogQueryType,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: [...QUERY_KEYS.dailyLogs.all, "farmer-today", query],
    queryFn: () => dailyLogService.listFarmerTasksForToday(query),
    enabled: options?.enabled ?? true,
  });

export const useManagerZoneTasksForToday = (
  zoneId: string | undefined,
  query: ListManagerTodayTasksQueryType,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: [...QUERY_KEYS.dailyLogs.all, "manager-zone-today", zoneId, query],
    queryFn: () =>
      dailyLogService.listManagerZoneTasksForToday(zoneId as string, query),
    enabled: (options?.enabled ?? true) && !!zoneId,
  });

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

export const useSubmitDailyLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SubmitDailyLogBodyType) => dailyLogService.submit(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyLogs.all });
      toast.success("Đã ghi nhật ký thành công");
    },
    onError: () => {
      toast.error("Không thể ghi nhật ký");
    },
  });
};

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
