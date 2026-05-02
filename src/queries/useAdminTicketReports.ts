import { QUERY_KEYS } from "@/constants";
import type {
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
    mutationFn: (ticketId: string) => ticketAdminOpsService.clawback(ticketId),
    onSuccess: () => {
      // Invalidate both report caches and admin ticket list
      qc.invalidateQueries({ queryKey: QUERY_KEYS.adminTicketReports.root });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ticketV2.root });
    },
  });
};
