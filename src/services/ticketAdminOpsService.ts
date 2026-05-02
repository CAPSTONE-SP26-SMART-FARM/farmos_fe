import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  DoctorCommissionReportQueryType,
  DoctorCommissionReportResType,
  TicketRevenueReportQueryType,
  TicketRevenueReportResType,
} from "@/schemaValidatation/ticketReports";
import type { MessageResType } from "@/types/api";
import queryString from "query-string";

const TV2 = API_ENDPOINTS.TICKET_V2;

const ticketAdminOpsService = {
  getTicketRevenueReport: (query: TicketRevenueReportQueryType) =>
    api.get<TicketRevenueReportResType>(
      `${TV2.ADMIN_REPORT_REVENUE}?${queryString.stringify({ ...query }, { skipNull: true, skipEmptyString: true })}`,
    ),

  getDoctorCommissionReport: (query: DoctorCommissionReportQueryType) =>
    api.get<DoctorCommissionReportResType>(
      `${TV2.ADMIN_REPORT_DOCTOR_COMMISSION}?${queryString.stringify({ ...query }, { skipNull: true, skipEmptyString: true })}`,
    ),

  clawback: (ticketId: string) =>
    api.post<MessageResType>(TV2.ADMIN_CLAWBACK(ticketId)),
};

export default ticketAdminOpsService;
