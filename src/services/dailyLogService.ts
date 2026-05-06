import { API_ENDPOINTS } from "@/constants/endpoints";
import { api } from "@/lib/axios";
import queryString from "query-string";
import type {
  DailyLogResType,
  FarmerTasksWithLogStatusListResType,
  ListDailyLogsQueryType,
  ListDailyLogsResType,
  ListManagerTodayTasksQueryType,
  ListTasksForDailyLogQueryType,
  ManagerTasksWithLogStatusListResType,
  SubmitDailyLogBodyType,
  TasksForDailyLogListResType,
} from "@/schemaValidatation/dailyLog";

const DAILY_LOG = API_ENDPOINTS.DAILY_LOG;

export const dailyLogService = {
  listFarmerTasksForToday: (query: ListTasksForDailyLogQueryType) =>
    api.get<FarmerTasksWithLogStatusListResType>(
      `${DAILY_LOG.FARMER_TODAY}?${queryString.stringify(query, {
        skipEmptyString: true,
        skipNull: true,
      })}`,
    ),

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

  listManagerZoneTasksForToday: (
    zoneId: string,
    query: ListManagerTodayTasksQueryType,
  ) =>
    api.get<ManagerTasksWithLogStatusListResType>(
      `${DAILY_LOG.MANAGER_ZONE_TODAY(zoneId)}?${queryString.stringify(query, {
        skipEmptyString: true,
        skipNull: true,
      })}`,
    ),

  submit: (body: SubmitDailyLogBodyType) =>
    api.post<DailyLogResType>(DAILY_LOG.SUBMIT, body),
};
