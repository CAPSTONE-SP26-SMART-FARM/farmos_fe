import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import { alertService } from "@/services/alertService";
import type { ListAlertsQueryType } from "@/schemaValidatation/alert";

export const useListAlerts = (query: ListAlertsQueryType, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEYS.alerts.list(query as Record<string, unknown>),
    queryFn: () => alertService.list(query).then((r) => r.data),
    enabled,
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
