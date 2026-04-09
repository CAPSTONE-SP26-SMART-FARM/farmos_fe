import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  CreateIotDeviceBatchBodyType,
  IotDeviceResType,
  ListIotDevicesQueryType,
  ListIotDevicesResType,
  UpdateIotDeviceBodyType,
} from "@/schemaValidatation/iotDevice";
import type { MessageResType } from "@/types/api";
import queryString from "query-string";

const EP = API_ENDPOINTS.OWNER.IOT_DEVICE;

export const ownerIotDeviceService = {
  list: (farmId: string, query: ListIotDevicesQueryType) =>
    api.get<ListIotDevicesResType>(
      EP.LIST(farmId) +
        "?" +
        queryString.stringify(
          { ...query },
          { skipEmptyString: true, skipNull: true },
        ),
    ),

  detail: (deviceId: string, farmId: string) =>
    api.get<IotDeviceResType>(EP.DETAIL(deviceId, farmId)),

  create: (farmId: string, body: CreateIotDeviceBatchBodyType) =>
    api.post<IotDeviceResType[]>(EP.CREATE(farmId), body),

  update: (deviceId: string, farmId: string, body: UpdateIotDeviceBodyType) =>
    api.put<IotDeviceResType>(EP.UPDATE(deviceId, farmId), body),

  delete: (deviceId: string, farmId: string) =>
    api.delete<MessageResType>(EP.DELETE(deviceId, farmId)),

  lockSensors: (deviceId: string, farmId: string) =>
    api.post<IotDeviceResType>(EP.LOCK_SENSORS(deviceId, farmId)),
};
