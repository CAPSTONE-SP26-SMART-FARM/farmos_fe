import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import queryString from "query-string";
import type {
  GetLatestReadingsByAssignmentResType,
  ListSensorReadingsQueryType,
  ListSensorReadingsResType,
  SensorIntervalType,
  SensorSeriesIntervalResType,
  SensorStatsPeriodType,
  SensorStatsResType,
} from "@/schemaValidatation/sensorReading";

const OWNER_EP = API_ENDPOINTS.OWNER.SENSOR_READING;
const MANAGER_EP = API_ENDPOINTS.MANAGER.SENSOR_READING;
const COMMON_EP = API_ENDPOINTS.COMMON.SENSOR_READING;

export const ownerSensorReadingService = {
  getLatest: (assignmentId: string) =>
    api.get<GetLatestReadingsByAssignmentResType>(
      OWNER_EP.LATEST(assignmentId),
    ),

  getSeries: (
    assignmentId: string,
    sensorId: string,
    query: ListSensorReadingsQueryType,
  ) =>
    api.get<ListSensorReadingsResType>(
      OWNER_EP.SERIES(assignmentId, sensorId) +
        "?" +
        queryString.stringify(
          { ...query },
          { skipEmptyString: true, skipNull: true },
        ),
    ),
};

export const managerSensorReadingService = {
  getLatest: (assignmentId: string) =>
    api.get<GetLatestReadingsByAssignmentResType>(
      MANAGER_EP.LATEST(assignmentId),
    ),

  getSeries: (
    assignmentId: string,
    sensorId: string,
    query: ListSensorReadingsQueryType,
  ) =>
    api.get<ListSensorReadingsResType>(
      MANAGER_EP.SERIES(assignmentId, sensorId) +
        "?" +
        queryString.stringify(
          { ...query },
          { skipEmptyString: true, skipNull: true },
        ),
    ),
};

// ── Common (route chung — không prefix role) ───────────────────────────

export const sensorReadingService = {
  getSeriesInterval: (
    assignmentId: string,
    sensorId: string,
    interval: SensorIntervalType,
  ) =>
    api.get<SensorSeriesIntervalResType>(
      COMMON_EP.SERIES_INTERVAL(assignmentId, sensorId),
      { params: { interval } },
    ),
  getStats: (
    assignmentId: string,
    sensorId: string,
    period: SensorStatsPeriodType,
  ) =>
    api.get<SensorStatsResType>(COMMON_EP.STATS(assignmentId, sensorId), {
      params: { period },
    }),
};
