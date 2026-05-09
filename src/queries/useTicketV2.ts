import { QUERY_KEYS } from "@/constants";
import type { CancelTicketV2BodyType } from "@/schemaValidatation/ticketV2";
import ticketV2Service from "@/services/ticketV2Service";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
