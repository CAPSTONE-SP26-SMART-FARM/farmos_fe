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

// GET /tickets/:id — Detail v2 (multi-role: admin/owner/manager/farmer/doctor).
// BE tự enforce ACL theo role caller. Trả về full incident schema + category
// snapshot + attachments[]. Dùng làm nguồn metadata cho detail panel; kết hợp
// với `useTicketFull` để có lifecycle (solution/prescription/rating/...).
export const useTicketV2Detail = (id: string) =>
  useQuery({
    queryKey: QUERY_KEYS.ticketsV2.detail(id),
    queryFn: () => ticketV2Service.detail(id),
    enabled: !!id,
  });

// GET /me/ticket-balance — per-category balance (subscription + purchased).
// Manager: BE auto-resolves owner via active zone-manager assignment.
export const useMyTicketBalance = (enabled = true) =>
  useQuery({
    queryKey: QUERY_KEYS.ticketsV2.myBalance,
    queryFn: () => ticketV2Service.myBalance(),
    enabled,
  });

// POST /tickets/:id/cancel — Owner/Manager huỷ ticket khi status=OPEN.
// Sau khi cancel: list (`useTicketV2List`) + detail v2 + full payload (B8)
// đều cần refresh để render status=cancelled.
export const useCancelTicketV2 = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CancelTicketV2BodyType }) =>
      ticketV2Service.cancel(id, body),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ticketsV2.root });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ticketsV2.detail(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ticketsExt.full(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ticketsExt.adminFull(id) });
    },
  });
};
