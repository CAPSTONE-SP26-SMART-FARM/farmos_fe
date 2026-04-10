import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  AssignIotDeviceBodyType,
  BindSensorsBodyType,
  GetMilestoneAssignmentDetailResType,
  ListAvailableIotDevicesQueryType,
  ListAvailableIotDevicesResType,
  ListBoundSensorsResType,
  UnassignIotDeviceBodyType,
  UnbindSensorsBodyType,
} from "@/schemaValidatation/milestoneIotDevice";
import type { ListSensorsResType } from "@/schemaValidatation/sensor";
import type { MessageResType } from "@/types/api";
import queryString from "query-string";

const MANAGER = API_ENDPOINTS.MANAGER;

// ── IoT Device Assignment ─────────────────────────────────────────────────────

export const milestoneIotDeviceService = {
  getAssignment: (milestoneId: string) =>
    api.get<GetMilestoneAssignmentDetailResType>(
      MANAGER.MILESTONE_IOT_DEVICE.ASSIGNMENT(milestoneId),
    ),

  listAvailable: (
    milestoneId: string,
    query: ListAvailableIotDevicesQueryType,
  ) =>
    api.get<ListAvailableIotDevicesResType>(
      MANAGER.MILESTONE_IOT_DEVICE.AVAILABLE(milestoneId) +
        "?" +
        queryString.stringify(
          { ...query },
          { skipEmptyString: true, skipNull: true },
        ),
    ),

  assign: (milestoneId: string, body: AssignIotDeviceBodyType) =>
    api.post<MessageResType, AssignIotDeviceBodyType>(
      MANAGER.MILESTONE_IOT_DEVICE.ASSIGN(milestoneId),
      body,
    ),

  unassign: (milestoneId: string, body: UnassignIotDeviceBodyType) =>
    api.post<MessageResType, UnassignIotDeviceBodyType>(
      MANAGER.MILESTONE_IOT_DEVICE.UNASSIGN(milestoneId),
      body,
    ),
};

// ── Manager Sensor List ───────────────────────────────────────────────────────

export const managerSensorService = {
  list: (iotDeviceId: string) =>
    api.get<ListSensorsResType>(
      API_ENDPOINTS.MANAGER.SENSOR.LIST(iotDeviceId),
    ),
};

// ── Sensor Binding ────────────────────────────────────────────────────────────

export const milestoneSensorBindingService = {
  listBound: (assignmentId: string) =>
    api.get<ListBoundSensorsResType>(
      MANAGER.MILESTONE_SENSOR_BINDING.LIST(assignmentId),
    ),

  bind: (assignmentId: string, body: BindSensorsBodyType) =>
    api.post<MessageResType, BindSensorsBodyType>(
      MANAGER.MILESTONE_SENSOR_BINDING.BIND(assignmentId),
      body,
    ),

  unbind: (assignmentId: string, body: UnbindSensorsBodyType) =>
    api.post<MessageResType, UnbindSensorsBodyType>(
      MANAGER.MILESTONE_SENSOR_BINDING.UNBIND(assignmentId),
      body,
    ),
};
