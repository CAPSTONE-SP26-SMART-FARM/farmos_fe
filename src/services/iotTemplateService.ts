import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  CreateIotDeviceTemplateBodyType,
  IotDeviceTemplateResType,
  ListIotDeviceTemplateQueryType,
  ListIotDeviceTemplateResType,
  UpdateIotDeviceTemplateBodyType,
  CreateSensorTemplateBodyType,
  SensorTemplateResType,
  ListSensorTemplatesQueryType,
  ListSensorTemplatesResType,
  UpdateSensorTemplateBodyType,
} from "@/schemaValidatation/iotTemplate";
import type { MessageResType } from "@/types/api";
import queryString from "query-string";

const ADMIN = API_ENDPOINTS.ADMIN;

export const iotDeviceTemplateService = {
  list: (query: ListIotDeviceTemplateQueryType) =>
    api.get<ListIotDeviceTemplateResType>(
      ADMIN.IOT_DEVICE_TEMPLATE.LIST +
        "?" +
        queryString.stringify(
          { ...query },
          { skipEmptyString: true, skipNull: true },
        ),
    ),
  detail: (id: string) =>
    api.get<IotDeviceTemplateResType>(ADMIN.IOT_DEVICE_TEMPLATE.DETAIL(id)),
  create: (body: CreateIotDeviceTemplateBodyType) =>
    api.post<IotDeviceTemplateResType, CreateIotDeviceTemplateBodyType>(
      ADMIN.IOT_DEVICE_TEMPLATE.CREATE,
      body,
    ),
  update: (id: string, body: UpdateIotDeviceTemplateBodyType) =>
    api.put<IotDeviceTemplateResType, UpdateIotDeviceTemplateBodyType>(
      ADMIN.IOT_DEVICE_TEMPLATE.UPDATE(id),
      body,
    ),
  delete: (id: string) =>
    api.delete<MessageResType>(ADMIN.IOT_DEVICE_TEMPLATE.DELETE(id)),
};

export const sensorTemplateService = {
  list: (query: ListSensorTemplatesQueryType) =>
    api.get<ListSensorTemplatesResType>(
      ADMIN.SENSOR_TEMPLATE.LIST +
        "?" +
        queryString.stringify(
          { ...query },
          { skipEmptyString: true, skipNull: true },
        ),
    ),
  detail: (id: string) =>
    api.get<SensorTemplateResType>(ADMIN.SENSOR_TEMPLATE.DETAIL(id)),
  create: (body: CreateSensorTemplateBodyType) =>
    api.post<SensorTemplateResType, CreateSensorTemplateBodyType>(
      ADMIN.SENSOR_TEMPLATE.CREATE,
      body,
    ),
  update: (id: string, body: UpdateSensorTemplateBodyType) =>
    api.put<SensorTemplateResType, UpdateSensorTemplateBodyType>(
      ADMIN.SENSOR_TEMPLATE.UPDATE(id),
      body,
    ),
  delete: (id: string) =>
    api.delete<MessageResType>(ADMIN.SENSOR_TEMPLATE.DELETE(id)),
};
