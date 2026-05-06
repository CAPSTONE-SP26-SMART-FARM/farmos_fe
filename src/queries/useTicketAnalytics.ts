import { QUERY_KEYS } from "@/constants";
import ticketAnalyticsService, {
  type TicketAnalyticsQuery,
} from "@/services/ticketAnalyticsService";
import { useQuery } from "@tanstack/react-query";

export const useTicketAnalytics = (query: TicketAnalyticsQuery, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.adminTicketReports.analytics(
      query as unknown as Record<string, unknown>,
    ),
    queryFn: () => ticketAnalyticsService.get(query),
    staleTime: 60_000,
    enabled,
  });
};
