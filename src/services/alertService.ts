import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import queryString from "query-string";
import type {
  ListAlertsQueryType,
  ListAlertsResType,
} from "@/schemaValidatation/alert";

export const alertService = {
  list: (query: ListAlertsQueryType) =>
    api.get<ListAlertsResType>(
      `${API_ENDPOINTS.ALERTS.LIST}?${queryString.stringify(query, { skipEmptyString: true, skipNull: true })}`,
    ),
};
