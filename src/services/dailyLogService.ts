import { API_ENDPOINTS } from "@/constants/endpoints";
import { api } from "@/lib/axios";
import queryString from "query-string";
import type {
  ListDailyLogsQueryType,
  ListDailyLogsResType,
  ListTasksForDailyLogQueryType,
  TasksForDailyLogListResType,
} from "@/schemaValidatation/dailyLog";

const DAILY_LOG = API_ENDPOINTS.DAILY_LOG;

export const dailyLogService = {
  listTasksToday: (query: ListTasksForDailyLogQueryType) =>
    api.get<TasksForDailyLogListResType>(
      `${DAILY_LOG.TASKS}?${queryString.stringify(query, {
        skipEmptyString: true,
        skipNull: true,
      })}`,
    ),

  listOwnerByFarm: (farmId: string, query: ListDailyLogsQueryType) =>
    api.get<ListDailyLogsResType>(
      `${DAILY_LOG.OWNER_BY_FARM(farmId)}?${queryString.stringify(query, {
        skipEmptyString: true,
        skipNull: true,
      })}`,
    ),

  listManagerByZone: (zoneId: string, query: ListDailyLogsQueryType) =>
    api.get<ListDailyLogsResType>(
      `${DAILY_LOG.MANAGER_BY_ZONE(zoneId)}?${queryString.stringify(query, {
        skipEmptyString: true,
        skipNull: true,
      })}`,
    ),
};
