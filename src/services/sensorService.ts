import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  CreateSensorBatchBodyType,
  ListSensorsQueryType,
  ListSensorsResType,
  SensorResType,
  UpdateSensorBodyType,
} from "@/schemaValidatation/sensor";
import type { MessageResType } from "@/types/api";
import queryString from "query-string";

const EP = API_ENDPOINTS.OWNER.SENSOR;

export const ownerSensorService = {
  list: (iotDeviceId: string, query: ListSensorsQueryType) =>
    api.get<ListSensorsResType>(
      EP.LIST(iotDeviceId) +
        "?" +
        queryString.stringify(
          { ...query },
          { skipEmptyString: true, skipNull: true },
        ),
    ),

  create: (iotDeviceId: string, body: CreateSensorBatchBodyType) =>
    api.post<SensorResType[]>(EP.CREATE(iotDeviceId), body),

  update: (sensorId: string, iotDeviceId: string, body: UpdateSensorBodyType) =>
    api.put<SensorResType>(EP.UPDATE(sensorId, iotDeviceId), body),

  delete: (sensorId: string, iotDeviceId: string) =>
    api.delete<MessageResType>(EP.DELETE(sensorId, iotDeviceId)),
};
