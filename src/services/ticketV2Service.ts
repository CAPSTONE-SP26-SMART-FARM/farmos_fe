import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import queryString from "query-string";
import type {
  CancelTicketV2BodyType,
  ListTicketsV2QueryType,
  ListTicketsV2ResType,
  TicketBalanceResType,
  TicketV2ResType,
} from "@/schemaValidatation/ticketV2";
import type { MessageResType } from "@/types/api";

const TV2 = API_ENDPOINTS.TICKET_V2;

const ticketV2Service = {
  list: (query: ListTicketsV2QueryType) =>
    api.get<ListTicketsV2ResType>(
      `${TV2.LIST}?${queryString.stringify(query, {
        skipEmptyString: true,
        skipNull: true,
      })}`,
    ),
  detail: (id: string) => api.get<TicketV2ResType>(TV2.DETAIL(id)),
  cancel: (id: string, body: CancelTicketV2BodyType) =>
    api.post<MessageResType, CancelTicketV2BodyType>(TV2.CANCEL(id), body),
  myBalance: () => api.get<TicketBalanceResType>(TV2.ME_BALANCE),
};

export default ticketV2Service;
