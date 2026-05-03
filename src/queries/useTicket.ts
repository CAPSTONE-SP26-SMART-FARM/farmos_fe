import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/endpoints";
import ticketService from "@/services/ticketService";
import { toast } from "sonner";
import { onMutationError } from "@/lib/axios";
import type {
  CreateIncidentTicketBodyType,
  ListIncidentTicketsQueryType,
} from "@/schemaValidatation/ticket";
import type { CreatePrescriptionBodyType } from "@/schemaValidatation/prescription";
import type { CreateTicketMessageBodyType } from "@/schemaValidatation/ticketMessage";
import type {
  InvalidateRatingBodyType,
  SubmitRatingBodyType,
} from "@/schemaValidatation/rating";
import type { AbandonTicketBodyType } from "@/schemaValidatation/abandonLog";
import type { CloseTicketBodyType } from "@/schemaValidatation/ticket";

// ── Owner ─────────────────────────────────────────────────────────────────

export const useOwnerTicketList = (
  farmId: string,
  query: ListIncidentTicketsQueryType,
) =>
  useQuery({
    queryKey: QUERY_KEYS.tickets.ownerList(farmId, query),
    queryFn: () => ticketService.ownerListByFarm(farmId, query),
    enabled: !!farmId,
  });

export const useOwnerTicketDetail = (ticketId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.tickets.ownerDetail(ticketId),
    queryFn: () => ticketService.ownerDetail(ticketId),
    enabled: !!ticketId,
  });

// ── Manager ───────────────────────────────────────────────────────────────

export const useManagerTicketList = (
  zoneId: string,
  query: ListIncidentTicketsQueryType,
) =>
  useQuery({
    queryKey: QUERY_KEYS.tickets.managerList(zoneId, query),
    queryFn: () => ticketService.managerListByZone(zoneId, query),
    enabled: !!zoneId,
  });

export const useManagerTicketDetail = (ticketId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.tickets.managerDetail(ticketId),
    queryFn: () => ticketService.managerDetail(ticketId),
    enabled: !!ticketId,
  });

// ── Doctor ────────────────────────────────────────────────────────────────

export const useDoctorTicketList = (query: ListIncidentTicketsQueryType) =>
  useQuery({
    queryKey: QUERY_KEYS.tickets.doctorList(query),
    queryFn: () => ticketService.doctorList(query),
  });

export const useDoctorTicketDetail = (ticketId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.tickets.doctorDetail(ticketId),
    queryFn: () => ticketService.doctorDetail(ticketId),
    enabled: !!ticketId,
  });

export const useDoctorAcceptTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string) => ticketService.doctorAccept(ticketId),
    onSuccess: (_res, ticketId) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.tickets.doctorDetail(ticketId),
      });
      queryClient.invalidateQueries({ queryKey: ["tickets", "doctor"] });
      toast.success("Đã tiếp nhận ticket thành công.");
    },
    onError: (error) =>
      onMutationError(error, "Không thể tiếp nhận ticket. Vui lòng thử lại."),
  });
};

// ── Shared Create / End ───────────────────────────────────────────────────

export const useCreateIncidentTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateIncidentTicketBodyType) =>
      ticketService.createIncident(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tickets.all });
      toast.success("Đã tạo ticket sự cố thành công.");
    },
    onError: (error) =>
      onMutationError(error, "Không thể tạo ticket sự cố. Vui lòng thử lại."),
  });
};

export const useEndIncidentTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string) => ticketService.endIncident(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tickets.all });
      toast.success("Đã kết thúc ticket sự cố.");
    },
    onError: (error) =>
      onMutationError(error, "Không thể kết thúc ticket. Vui lòng thử lại."),
  });
};

// ── Messages ──────────────────────────────────────────────────────────────

export const useTicketMessages = (
  ticketId: string,
  query: { page: number; limit: number },
) =>
  useQuery({
    queryKey: QUERY_KEYS.tickets.messages(ticketId, query),
    queryFn: () => ticketService.listMessages(ticketId, query),
    enabled: !!ticketId,
    refetchInterval: 10_000, // poll every 10 seconds for new messages
  });

export const useCreateTicketMessage = (ticketId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTicketMessageBodyType) =>
      ticketService.createMessage(ticketId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tickets", ticketId, "messages"],
      });
    },
    onError: (error) =>
      onMutationError(error, "Không thể gửi tin nhắn. Vui lòng thử lại."),
  });
};

// ── Prescriptions ─────────────────────────────────────────────────────────

export const useTicketPrescriptions = (
  ticketId: string,
  query: { page: number; limit: number },
) =>
  useQuery({
    queryKey: QUERY_KEYS.tickets.prescriptions(ticketId, query),
    queryFn: () => ticketService.listPrescriptions(ticketId, query),
    enabled: !!ticketId,
  });

export const useCreatePrescription = (ticketId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePrescriptionBodyType) =>
      ticketService.createPrescription(ticketId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tickets", ticketId, "prescriptions"],
      });
      toast.success("Đã tạo đơn thuốc thành công.");
    },
    onError: (error) =>
      onMutationError(error, "Không thể tạo đơn thuốc. Vui lòng thử lại."),
  });
};

// ── Module 3 — Ticket Quality hooks (B5/B6/B7/B8 + Admin B17) ─────────────
// Mọi mutation invalidate `tickets.all` (cũ) + `ticketsExt.full(id)` để cả
// list và full payload đều fresh sau khi action thành công.

export const useTicketFull = (ticketId: string, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEYS.ticketsExt.full(ticketId),
    queryFn: () => ticketService.getFull(ticketId),
    enabled: enabled && Boolean(ticketId),
  });

export const useAdminTicketFull = (ticketId: string, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEYS.ticketsExt.adminFull(ticketId),
    queryFn: () => ticketService.adminGetFull(ticketId),
    enabled: enabled && Boolean(ticketId),
  });

export const useCloseTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      body,
    }: {
      ticketId: string;
      body?: CloseTicketBodyType;
    }) => ticketService.closeByCreator(ticketId, body),
    onSuccess: (_res, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tickets.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ticketsExt.full(ticketId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ticketsExt.adminFull(ticketId),
      });
    },
    // Không gọi toast.success ở đây vì caller (CloseAndRateModal) sẽ chạy
    // `rateByCreator` ngay sau, hiển thị toast tổng hợp ở cuối flow.
  });
};

export const useRateTicket = (ticketId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SubmitRatingBodyType) =>
      ticketService.rateByCreator(ticketId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ticketsExt.full(ticketId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ticketsExt.adminFull(ticketId),
      });
    },
  });
};

export const useAbandonResolution = (ticketId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AbandonTicketBodyType) =>
      ticketService.abandonResolution(ticketId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tickets.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ticketsExt.full(ticketId),
      });
    },
  });
};

export const useAdminInvalidateRating = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      body,
    }: {
      ticketId: string;
      body: InvalidateRatingBodyType;
    }) => ticketService.adminInvalidateRating(ticketId, body),
    onSuccess: (_res, { ticketId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ticketsExt.adminFull(ticketId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ticketsExt.full(ticketId),
      });
      // DQS có thể đổi sau cron đêm; Admin DQS leaderboard cũng nên refresh.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dqs.root });
    },
  });
};
