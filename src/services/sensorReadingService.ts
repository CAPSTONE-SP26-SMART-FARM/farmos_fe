import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type { GetLatestReadingsByAssignmentResType } from "@/schemaValidatation/sensorReading";

const OWNER_EP = API_ENDPOINTS.OWNER.SENSOR_READING;
const MANAGER_EP = API_ENDPOINTS.MANAGER.SENSOR_READING;

export const ownerSensorReadingService = {
  getLatest: (assignmentId: string) =>
    api.get<GetLatestReadingsByAssignmentResType>(
      OWNER_EP.LATEST(assignmentId),
    ),
};

export const managerSensorReadingService = {
  getLatest: (assignmentId: string) =>
    api.get<GetLatestReadingsByAssignmentResType>(
      MANAGER_EP.LATEST(assignmentId),
    ),
};
