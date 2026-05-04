import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import { notificationService } from "@/services/notificationService";
import type { ListNotificationsQueryType } from "@/schemaValidatation/notification";

export const useListNotifications = (
  query: ListNotificationsQueryType,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.notifications.list(query as Record<string, unknown>),
    queryFn: () => notificationService.list(query).then((r) => r.data),
    enabled,
    staleTime: 30_000,
  });

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead: boolean }) =>
      notificationService.markRead(id, { isRead }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all });
    },
  });
};
