import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  ListSystemConfigsQueryType,
  SystemConfigItemType,
  SystemConfigListResType,
  UpsertSystemConfigBodyType,
} from "@/schemaValidatation/systemConfig";
import queryString from "query-string";

const SC = API_ENDPOINTS.SYSTEM_CONFIGS;

const systemConfigService = {
  // ── B18 GET /admin/system-configs?prefix=ticket. ──
  list: (query: ListSystemConfigsQueryType) =>
    api.get<SystemConfigListResType>(
      `${SC.LIST}?${queryString.stringify(
        { ...query },
        { skipNull: true, skipEmptyString: true },
      )}`,
    ),

  // ── B18 PATCH /admin/system-configs/:key (single-key upsert) ──
  // Edge case 6.5: thay đổi config có thể ảnh hưởng ticket đang trong window
  // (pending decision 9.12 — snapshot tại resolve hay áp dụng ngay).
  upsert: (key: string, body: UpsertSystemConfigBodyType) =>
    api.patch<SystemConfigItemType, UpsertSystemConfigBodyType>(
      SC.UPSERT(key),
      body,
    ),
};

export default systemConfigService;
