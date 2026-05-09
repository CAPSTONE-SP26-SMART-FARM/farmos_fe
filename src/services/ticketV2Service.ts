import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type { CancelTicketV2BodyType } from "@/schemaValidatation/ticketV2";
import type { MessageResType } from "@/types/api";

const TV2 = API_ENDPOINTS.TICKET_V2;

const ticketV2Service = {
  cancel: (id: string, body: CancelTicketV2BodyType) =>
    api.post<MessageResType, CancelTicketV2BodyType>(TV2.CANCEL(id), body),
};

export default ticketV2Service;
