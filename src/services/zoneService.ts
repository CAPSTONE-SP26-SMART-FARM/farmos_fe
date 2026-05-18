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
import type { IotCoverageResType } from "@/schemaValidatation/iotCoverage";

const ZONES = API_ENDPOINTS.ZONES;
const MANAGER = API_ENDPOINTS.MANAGER;
const OWNER = API_ENDPOINTS.OWNER;

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

  listForOwner: (query: ListZonesQueryType) =>
    api.get<ListZonesResType>(
      `${OWNER.ZONES.LIST}?${queryString.stringify(query, {
        skipEmptyString: true,
        skipNull: true,
      })}`,
    ),

  getDetail: (id: string) => api.get<ZoneType>(ZONES.DETAIL(id)),

  // Tính độ phủ thiết bị IoT cho zone. Truyền `kitId` để biết "cần thêm
  // bao nhiêu bộ loại này". Không truyền kitId → vẫn nhận currentActive +
  // zoneArea + status (sufficient/under_covered/unknown).
  getIotCoverage: (zoneId: string, kitId?: string | null) =>
    api.get<IotCoverageResType>(
      `${ZONES.IOT_COVERAGE(zoneId)}?${queryString.stringify(
        { kitId: kitId || undefined },
        { skipEmptyString: true, skipNull: true },
      )}`,
    ),

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

  /** Owner: soft-delete staff user tied to zone's farm (backend validates farm membership). */
  softDeleteFarmStaffUser: (zoneId: string, userId: string) =>
    api.delete<MessageResType>(ZONES.MEMBERS.SOFT_DELETE(zoneId, userId)),
};
