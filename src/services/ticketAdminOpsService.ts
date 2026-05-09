import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  DoctorCommissionReportQueryType,
  DoctorCommissionReportResType,
  TicketRevenueReportQueryType,
  TicketRevenueReportResType,
} from "@/schemaValidatation/ticketReports";
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

  // Clawback (POST /admin/tickets/:id/clawback) — KHÔNG integrate trên web FE
  // theo quyết định 2026-05-09 (xem docs/ticket-v2/ticket-v2.md). Endpoint vẫn
  // tồn tại ở BE để xử lý offline/manual nếu cần.
};

export default ticketAdminOpsService;
