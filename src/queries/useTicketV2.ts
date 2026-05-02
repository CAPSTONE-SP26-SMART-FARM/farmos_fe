import { QUERY_KEYS } from "@/constants";
import type {
  CancelTicketV2BodyType,
  CreateTicketV2BodyType,
  ListTicketV2QueryType,
} from "@/schemaValidatation/ticketV2";
import ticketV2Service from "@/services/ticketV2Service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ── List queries ──────────────────────────────────────────────────────────────
export const useTicketV2List = (
  query: ListTicketV2QueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.ticketV2.list(query),
    queryFn: () => ticketV2Service.list(query),
    enabled,
  });
};

export const useAdminTicketV2List = (
  query: ListTicketV2QueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.ticketV2.adminList(query),
    queryFn: () => ticketV2Service.adminList(query),
    enabled,
  });
};

// ── Detail query ──────────────────────────────────────────────────────────────
export const useTicketV2Detail = (id: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.ticketV2.detail(id),
    queryFn: () => ticketV2Service.detail(id),
    enabled: enabled && Boolean(id),
  });
};

export const useAdminTicketV2Detail = (id: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.ticketV2.adminDetail(id),
    queryFn: () => ticketV2Service.adminDetail(id),
    enabled: enabled && Boolean(id),
  });
};

// ── Owner ticket balance ──────────────────────────────────────────────────────
export const useOwnerTicketBalance = (enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.ticketBalance.owner(),
    queryFn: () => ticketV2Service.getOwnerBalance(),
    enabled,
  });
};

// ── Mutations ─────────────────────────────────────────────────────────────────
export const useCreateTicketV2 = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTicketV2BodyType) => ticketV2Service.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ticketV2.root });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ticketBalance.root });
    },
  });
};

export const useCancelTicketV2 = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CancelTicketV2BodyType }) =>
      ticketV2Service.cancel(id, body),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ticketV2.root });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ticketV2.detail(id) });
      // NOTE: Do NOT optimistically update ticket balance — backend cancel
      // refund credits to `createdBy` which may differ from the current user.
      // Always re-fetch from server.
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ticketBalance.root });
    },
  });
};
