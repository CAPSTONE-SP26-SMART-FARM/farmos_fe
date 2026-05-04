import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import queryString from "query-string";
import type {
  ListNotificationsQueryType,
  ListNotificationsResType,
  MarkNotificationReadBodyType,
  NotificationResType,
} from "@/schemaValidatation/notification";

export const notificationService = {
  list: (query: ListNotificationsQueryType) =>
    api.get<ListNotificationsResType>(
      `${API_ENDPOINTS.NOTIFICATIONS.LIST}?${queryString.stringify(query, {
        skipEmptyString: true,
        skipNull: true,
      })}`,
    ),
  markRead: (id: string, body: MarkNotificationReadBodyType) =>
    api.patch<NotificationResType, MarkNotificationReadBodyType>(
      API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id),
      body,
    ),
};
