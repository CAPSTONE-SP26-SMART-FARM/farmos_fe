import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  GetLatestReadingsByAssignmentResType,
  ListSensorReadingsQueryType,
  ListSensorReadingsResType,
} from "@/schemaValidatation/sensorReading";
import queryString from "query-string";

const OWNER_EP = API_ENDPOINTS.OWNER.SENSOR_READING;
const MANAGER_EP = API_ENDPOINTS.MANAGER.SENSOR_READING;

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
