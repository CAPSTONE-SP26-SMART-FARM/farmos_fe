import { QUERY_KEYS } from "@/constants";
import type {
  CancelTicketV2BodyType,
  ListTicketsV2QueryType,
} from "@/schemaValidatation/ticketV2";
import ticketV2Service from "@/services/ticketV2Service";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// GET /tickets — hierarchical scope, BE tự filter theo role caller.
// FE chỉ cần truyền filter mong muốn (milestoneId / zoneId / farmId / ...).
export const useTicketV2List = (query: ListTicketsV2QueryType) =>
  useQuery({
    queryKey: QUERY_KEYS.ticketsV2.list(query as Record<string, unknown>),
    queryFn: () => ticketV2Service.list(query),
    placeholderData: keepPreviousData,
  });

// POST /tickets/:id/cancel — Owner/Manager huỷ ticket khi status=OPEN.
// Sau khi cancel: list pages (legacy `useOwnerTicketList`/`useManagerTicketList`)
// và detail full payload (`useTicketFull`/`useAdminTicketFull`) cần refresh
// để render status=cancelled.
export const useCancelTicketV2 = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CancelTicketV2BodyType }) =>
      ticketV2Service.cancel(id, body),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.tickets.all });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ticketsExt.full(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ticketsExt.adminFull(id) });
    },
  });
};
