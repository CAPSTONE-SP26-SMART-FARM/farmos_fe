import { QUERY_KEYS } from "@/constants";
import type {
  DoctorCommissionReportQueryType,
  TicketRevenueReportQueryType,
} from "@/schemaValidatation/ticketReports";
import ticketAdminOpsService from "@/services/ticketAdminOpsService";
import { useQuery } from "@tanstack/react-query";

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
