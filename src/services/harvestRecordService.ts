import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  CreateHarvestRecordBodyType,
  HarvestRecordResType,
  ListHarvestRecordsQueryType,
  ListHarvestRecordsResType,
  UpdateHarvestRecordBodyType,
} from "@/schemaValidatation/harvestRecord";
import queryString from "query-string";

const HR = API_ENDPOINTS.HARVEST_RECORDS;

// LƯU Ý: Module này dùng `z.iso.date()` ở BE (chỉ accept `YYYY-MM-DD`),
// KHÔNG phải `z.iso.datetime()`. Body schema có `.strict()`.
// → FE gửi thẳng date-only string từ form state — KHÔNG dùng `toISO()`.
// (Khác với crop-season vốn dùng datetime.)

const harvestRecordService = {
  listByZone: (zoneId: string, query: ListHarvestRecordsQueryType) =>
    api.get<ListHarvestRecordsResType>(
      `${HR.LIST_BY_ZONE(zoneId)}?${queryString.stringify(
        { ...query },
        { skipNull: true, skipEmptyString: true },
      )}`,
    ),

  detail: (id: string) => api.get<HarvestRecordResType>(HR.DETAIL(id)),

  create: (zoneId: string, body: CreateHarvestRecordBodyType) =>
    api.post<HarvestRecordResType, CreateHarvestRecordBodyType>(
      HR.CREATE(zoneId),
      body,
    ),

  update: (id: string, body: UpdateHarvestRecordBodyType) =>
    api.patch<HarvestRecordResType, UpdateHarvestRecordBodyType>(
      HR.UPDATE(id),
      body,
    ),

  delete: (id: string) => api.delete(HR.DELETE(id)),
};

export default harvestRecordService;
