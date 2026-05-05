import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import queryString from "query-string";

export type TicketAnalyticsPeriod = "7d" | "30d" | "90d";

export interface TicketAnalyticsQuery {
  period?: TicketAnalyticsPeriod;
  from?: string;
  to?: string;
}

export interface TicketAnalyticsKpi {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  cancelledTickets: number;
  aiResolvedTickets: number;
  resolutionRate: number;
  avgResolutionHours: number | null;
  avgSatisfaction: number | null;
  satisfactionResponses: number;
  totalDelta: number | null;
  resolvedDelta: number | null;
  avgResolutionDelta: number | null;
}

export interface TicketStatusCount {
  status: string;
  count: number;
}

export interface TicketSeverityCount {
  severity: string;
  count: number;
}

export interface TicketCategoryCount {
  category: string;
  count: number;
}

export interface TicketDailyPoint {
  date: string;
  created: number;
  resolved: number;
}

export interface TicketAnalyticsDoctorRow {
  doctorId: string;
  doctorName: string | null;
  processing: number;
  resolved: number;
  escalated: number;
  aiFallback: number;
  avgResolutionHours: number | null;
  avgSatisfaction: number | null;
}

export interface TicketAnalyticsCriticalRow {
  id: string;
  ticketNumber: string;
  title: string;
  severity: string;
  status: string;
  assigneeName: string | null;
  farmName: string | null;
  createdAt: string;
}

export interface TicketAnalyticsPayload {
  period: { from: string; to: string };
  kpi: TicketAnalyticsKpi;
  statusDistribution: TicketStatusCount[];
  severityBreakdown: TicketSeverityCount[];
  categoryBreakdown: TicketCategoryCount[];
  ticketsOverTime: TicketDailyPoint[];
  doctorPerformance: TicketAnalyticsDoctorRow[];
  criticalTickets: TicketAnalyticsCriticalRow[];
}

const ticketAnalyticsService = {
  get: (query: TicketAnalyticsQuery) =>
    api.get<TicketAnalyticsPayload>(
      `${API_ENDPOINTS.TICKET_V2.ADMIN_ANALYTICS}?${queryString.stringify(
        { ...query },
        { skipNull: true, skipEmptyString: true },
      )}`,
    ),
};

export default ticketAnalyticsService;
