import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/constants/endpoints";
import queryString from "query-string";
import type {
  CreateZoneBodyType,
  ListZonesQueryType,
  ListZonesResType,
  UpdateZoneBodyType,
  ZoneType,
} from "@/types/zone";
import type {
  AssignBulkManagerBodyType,
  ListAvailableManagersQueryType,
  ListAvailableManagersResType,
  AssignManagerBodyType,
  ListZoneManagersQueryType,
  ListZoneManagersResType,
  ZoneManagerResType,
} from "@/schemaValidatation/zoneMember";
import type { MessageResType } from "@/types/api";

const ZONES = API_ENDPOINTS.ZONES;
const MANAGER = API_ENDPOINTS.MANAGER;

export const zoneService = {
  listByFarm: (farmId: string, query: ListZonesQueryType) =>
    api.get<ListZonesResType>(
      `${ZONES.LIST_BY_FARM(farmId)}?${queryString.stringify(query, {
        skipEmptyString: true,
        skipNull: true,
      })}`,
    ),

  listAssignedForManager: (query: ListZonesQueryType) =>
    api.get<ListZonesResType>(
      `${MANAGER.ZONES.LIST}?${queryString.stringify(query, {
        skipEmptyString: true,
        skipNull: true,
      })}`,
    ),

  getDetail: (id: string) => api.get<ZoneType>(ZONES.DETAIL(id)),

  create: (body: CreateZoneBodyType) => api.post<ZoneType>(ZONES.CREATE, body),

  update: (id: string, body: UpdateZoneBodyType) =>
    api.put<ZoneType>(ZONES.UPDATE(id), body),

  // ── Zone Member Management ──────────────────────────────
  listManagers: (zoneId: string, query: ListZoneManagersQueryType) =>
    api.get<ListZoneManagersResType>(
      `${ZONES.MANAGERS.LIST(zoneId)}?${queryString.stringify(query, {
        skipEmptyString: true,
        skipNull: true,
      })}`,
    ),

  listAvailableManagers: (
    zoneId: string,
    query: ListAvailableManagersQueryType,
  ) =>
    api.get<ListAvailableManagersResType>(
      `${ZONES.MANAGERS.AVAILABLE(zoneId)}?${queryString.stringify(query, {
        skipEmptyString: true,
        skipNull: true,
      })}`,
    ),

  assignManager: (zoneId: string, body: AssignManagerBodyType) =>
    api.post<ZoneManagerResType>(ZONES.MANAGERS.ASSIGN(zoneId), body),

  assignBulkManagers: (zoneId: string, body: AssignBulkManagerBodyType) =>
    api.post<ZoneManagerResType[]>(ZONES.MANAGERS.ASSIGN_BULK(zoneId), body),

  removeManager: (zoneId: string, managerId: string) =>
    api.delete<MessageResType>(ZONES.MANAGERS.REMOVE(zoneId, managerId)),

  updatePrimaryManager: (
    zoneId: string,
    managerId: string,
    body: { isPrimary: boolean },
  ) =>
    api.put<ZoneManagerResType>(
      ZONES.MANAGERS.UPDATE_PRIMARY(zoneId, managerId),
      body,
    ),
};
