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

export const zoneService = {
  listByFarm: (farmId: string, query: ListZonesQueryType) =>
    api.get<ListZonesResType>(
      `${API_ENDPOINTS.ZONES.LIST_BY_FARM(farmId)}?${queryString.stringify(
        query,
        {
          skipEmptyString: true,
          skipNull: true,
        },
      )}`,
    ),

  getDetail: (id: string) => api.get<ZoneType>(API_ENDPOINTS.ZONES.DETAIL(id)),

  create: (body: CreateZoneBodyType) =>
    api.post<ZoneType>(API_ENDPOINTS.ZONES.CREATE, body),

  update: (id: string, body: UpdateZoneBodyType) =>
    api.put<ZoneType>(API_ENDPOINTS.ZONES.UPDATE(id), body),
};
