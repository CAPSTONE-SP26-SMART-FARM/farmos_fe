import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  ClawbackTicketBodyType,
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

  // B16 — Admin clawback. BE body `{reason?: string}` (optional ở schema BE,
  // nhưng FE form bắt buộc nhập để phục vụ audit).
  clawback: (ticketId: string, body: ClawbackTicketBodyType) =>
    api.post<MessageResType, ClawbackTicketBodyType>(
      TV2.ADMIN_CLAWBACK(ticketId),
      body,
    ),
};

export default ticketAdminOpsService;
