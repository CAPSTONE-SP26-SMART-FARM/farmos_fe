import { QUERY_KEYS } from "@/constants";
import type {
  ClawbackTicketBodyType,
  DoctorCommissionReportQueryType,
  TicketRevenueReportQueryType,
} from "@/schemaValidatation/ticketReports";
import ticketAdminOpsService from "@/services/ticketAdminOpsService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useTicketRevenueReport = (
  query: TicketRevenueReportQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.adminTicketReports.revenue(query),
    queryFn: () => ticketAdminOpsService.getTicketRevenueReport(query),
    enabled: enabled && Boolean(query.from) && Boolean(query.to),
  });
};

export const useDoctorCommissionReport = (
  query: DoctorCommissionReportQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.adminTicketReports.doctorCommission(query),
    queryFn: () => ticketAdminOpsService.getDoctorCommissionReport(query),
    enabled: enabled && Boolean(query.from) && Boolean(query.to),
  });
};

export const useClawback = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      body,
    }: {
      ticketId: string;
      body: ClawbackTicketBodyType;
    }) => ticketAdminOpsService.clawback(ticketId, body),
    onSuccess: (_res, { ticketId }) => {
      // Invalidate report caches + ticket list (legacy) + detail full payload
      // để payout tab refresh state (PENALTY transaction vừa được tạo).
      qc.invalidateQueries({ queryKey: QUERY_KEYS.adminTicketReports.root });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.tickets.all });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.ticketsExt.adminFull(ticketId),
      });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.ticketsExt.full(ticketId),
      });
    },
  });
};
