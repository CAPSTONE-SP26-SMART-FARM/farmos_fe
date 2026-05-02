import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  CancelTicketV2BodyType,
  CreateTicketV2BodyType,
  ListTicketV2QueryType,
  TicketBalanceResType,
  TicketV2ListResType,
  TicketV2Type,
} from "@/schemaValidatation/ticketV2";
import type { MessageResType } from "@/types/api";
import queryString from "query-string";

const TV2 = API_ENDPOINTS.TICKET_V2;

const ticketV2Service = {
  // ── Owner / Manager context ───────────────────────────────────────────────
  list: (query: ListTicketV2QueryType) =>
    api.get<TicketV2ListResType>(
      `${TV2.LIST}?${queryString.stringify({ ...query }, { skipNull: true, skipEmptyString: true })}`,
    ),

  detail: (id: string) => api.get<TicketV2Type>(TV2.DETAIL(id)),

  create: (body: CreateTicketV2BodyType) =>
    api.post<TicketV2Type, CreateTicketV2BodyType>(TV2.CREATE, body),

  cancel: (id: string, body: CancelTicketV2BodyType) =>
    api.post<MessageResType, CancelTicketV2BodyType>(TV2.CANCEL(id), body),

  getOwnerBalance: () => api.get<TicketBalanceResType>(TV2.OWNER_BALANCE),

  // ── Admin context ─────────────────────────────────────────────────────────
  adminList: (query: ListTicketV2QueryType) =>
    api.get<TicketV2ListResType>(
      `${TV2.ADMIN_LIST}?${queryString.stringify({ ...query }, { skipNull: true, skipEmptyString: true })}`,
    ),

  adminDetail: (id: string) => api.get<TicketV2Type>(TV2.ADMIN_DETAIL(id)),
};

export default ticketV2Service;
