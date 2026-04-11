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
const MANAGER = API_ENDPOINTS.MANAGER;
const OWNER = API_ENDPOINTS.OWNER;

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

// ── Owner (read-only) ─────────────────────────────────────────────────

export const ownerIotDeviceTemplateService = {
  list: (query: ListIotDeviceTemplateQueryType) =>
    api.get<ListIotDeviceTemplateResType>(
      OWNER.IOT_DEVICE_TEMPLATE.LIST +
        "?" +
        queryString.stringify(
          { ...query },
          { skipEmptyString: true, skipNull: true },
        ),
    ),
  detail: (id: string) =>
    api.get<IotDeviceTemplateResType>(OWNER.IOT_DEVICE_TEMPLATE.DETAIL(id)),
};

export const ownerSensorTemplateService = {
  list: (query: ListSensorTemplatesQueryType) =>
    api.get<ListSensorTemplatesResType>(
      OWNER.SENSOR_TEMPLATE.LIST +
        "?" +
        queryString.stringify(
          { ...query },
          { skipEmptyString: true, skipNull: true },
        ),
    ),
  detail: (id: string) =>
    api.get<SensorTemplateResType>(OWNER.SENSOR_TEMPLATE.DETAIL(id)),
};

// ── Manager (read-only) ───────────────────────────────────────────────

export const managerIotDeviceTemplateService = {
  list: (query: ListIotDeviceTemplateQueryType) =>
    api.get<ListIotDeviceTemplateResType>(
      MANAGER.IOT_DEVICE_TEMPLATE.LIST +
        "?" +
        queryString.stringify(
          { ...query },
          { skipEmptyString: true, skipNull: true },
        ),
    ),
  detail: (id: string) =>
    api.get<IotDeviceTemplateResType>(MANAGER.IOT_DEVICE_TEMPLATE.DETAIL(id)),
};

export const managerSensorTemplateService = {
  list: (query: ListSensorTemplatesQueryType) =>
    api.get<ListSensorTemplatesResType>(
      MANAGER.SENSOR_TEMPLATE.LIST +
        "?" +
        queryString.stringify(
          { ...query },
          { skipEmptyString: true, skipNull: true },
        ),
    ),
  detail: (id: string) =>
    api.get<SensorTemplateResType>(MANAGER.SENSOR_TEMPLATE.DETAIL(id)),
};
