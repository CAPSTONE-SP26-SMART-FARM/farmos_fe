import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  GetThresholdsByAssignmentResType,
  UpsertSensorThresholdBodyType,
} from "@/schemaValidatation/sensorThreshold";

const MANAGER = API_ENDPOINTS.MANAGER;
const OWNER = API_ENDPOINTS.OWNER;

export const sensorThresholdService = {
  get: (assignmentId: string) =>
    api.get<GetThresholdsByAssignmentResType>(
      MANAGER.SENSOR_THRESHOLD.GET(assignmentId),
    ),

  create: (assignmentId: string, body: UpsertSensorThresholdBodyType) =>
    api.post<GetThresholdsByAssignmentResType, UpsertSensorThresholdBodyType>(
      MANAGER.SENSOR_THRESHOLD.CREATE(assignmentId),
      body,
    ),

  update: (assignmentId: string, body: UpsertSensorThresholdBodyType) =>
    api.put<GetThresholdsByAssignmentResType, UpsertSensorThresholdBodyType>(
      MANAGER.SENSOR_THRESHOLD.UPDATE(assignmentId),
      body,
    ),
};

export const ownerSensorThresholdService = {
  get: (assignmentId: string) =>
    api.get<GetThresholdsByAssignmentResType>(OWNER.SENSOR_THRESHOLD.GET(assignmentId)),

  create: (assignmentId: string, body: UpsertSensorThresholdBodyType) =>
    api.post<GetThresholdsByAssignmentResType, UpsertSensorThresholdBodyType>(
      OWNER.SENSOR_THRESHOLD.CREATE(assignmentId),
      body,
    ),

  update: (assignmentId: string, body: UpsertSensorThresholdBodyType) =>
    api.put<GetThresholdsByAssignmentResType, UpsertSensorThresholdBodyType>(
      OWNER.SENSOR_THRESHOLD.UPDATE(assignmentId),
      body,
    ),
};
