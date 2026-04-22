import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  AdminAssignOwnerBodyType,
  AdminCreateIotDeviceBatchBodyType,
  AdminCreateSensorBatchBodyType,
  AdminUnassignOwnerBodyType,
  AdminUpdateSensorBodyType,
  IotDeviceBatchResType,
  IotDeviceDetailResType,
  IotDeviceResType,
  ListIotDevicesQueryType,
  ListIotDevicesResType,
  UpdateIotDeviceBodyType,
} from "@/schemaValidatation/iotDevice";
import type { MessageResType } from "@/types/api";
import queryString from "query-string";

const ADMIN_EP = API_ENDPOINTS.ADMIN.IOT_DEVICE;
const EP = API_ENDPOINTS.OWNER.IOT_DEVICE;
const MANAGER_EP = API_ENDPOINTS.MANAGER.IOT_DEVICE;

export const adminIotDeviceService = {
  list: (query: ListIotDevicesQueryType) =>
    api.get<ListIotDevicesResType>(
      ADMIN_EP.LIST +
        "?" +
        queryString.stringify(
          { ...query },
          { skipEmptyString: true, skipNull: true },
        ),
    ),

  detail: (deviceId: string) =>
    api.get<IotDeviceDetailResType>(ADMIN_EP.DETAIL(deviceId)),

  createBatch: (body: AdminCreateIotDeviceBatchBodyType) =>
    api.post<IotDeviceBatchResType, AdminCreateIotDeviceBatchBodyType>(
      ADMIN_EP.CREATE_BATCH,
      body,
    ),

  createBatchByFarm: (farmId: string, body: AdminCreateIotDeviceBatchBodyType) =>
    api.post<IotDeviceBatchResType, AdminCreateIotDeviceBatchBodyType>(
      ADMIN_EP.CREATE_BATCH_BY_FARM(farmId),
      body,
    ),

  update: (deviceId: string, body: UpdateIotDeviceBodyType) =>
    api.put<IotDeviceResType, UpdateIotDeviceBodyType>(
      ADMIN_EP.UPDATE(deviceId),
      body,
    ),

  delete: (deviceId: string) =>
    api.delete<MessageResType>(ADMIN_EP.DELETE(deviceId)),

  createSensorBatch: (deviceId: string, body: AdminCreateSensorBatchBodyType) =>
    api.post<MessageResType, AdminCreateSensorBatchBodyType>(
      ADMIN_EP.CREATE_SENSOR_BATCH(deviceId),
      body,
    ),

  updateSensor: (
    deviceId: string,
    sensorId: string,
    body: AdminUpdateSensorBodyType,
  ) =>
    api.put<MessageResType, AdminUpdateSensorBodyType>(
      ADMIN_EP.UPDATE_SENSOR(deviceId, sensorId),
      body,
    ),

  deleteSensor: (deviceId: string, sensorId: string) =>
    api.delete<MessageResType>(ADMIN_EP.DELETE_SENSOR(deviceId, sensorId)),

  assignOwner: (body: AdminAssignOwnerBodyType) =>
    api.post<MessageResType, AdminAssignOwnerBodyType>(ADMIN_EP.ASSIGN_OWNER, body),

  unassignOwner: (body: AdminUnassignOwnerBodyType) =>
    api.post<MessageResType, AdminUnassignOwnerBodyType>(
      ADMIN_EP.UNASSIGN_OWNER,
      body,
    ),
};

export const ownerIotDeviceService = {
  list: (query: ListIotDevicesQueryType) =>
    api.get<ListIotDevicesResType>(
      EP.LIST +
        "?" +
        queryString.stringify(
          { ...query },
          { skipEmptyString: true, skipNull: true },
        ),
    ),

  detail: (deviceId: string) => api.get<IotDeviceDetailResType>(EP.DETAIL(deviceId)),
};

export const managerIotDeviceService = {
  list: (query: ListIotDevicesQueryType) =>
    api.get<ListIotDevicesResType>(
      MANAGER_EP.LIST +
        "?" +
        queryString.stringify(
          { ...query },
          { skipEmptyString: true, skipNull: true },
        ),
    ),

  detail: (deviceId: string) => api.get<IotDeviceDetailResType>(MANAGER_EP.DETAIL(deviceId)),
};
