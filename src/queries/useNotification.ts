import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import { notificationService } from "@/services/notificationService";
import { useNotificationStore } from "@/stores/notificationStore";
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

export const useUnreadCount = () =>
  useQuery({
    queryKey: QUERY_KEYS.notifications.unreadCount,
    queryFn: () =>
      notificationService.getUnreadCount().then((r) => r.data.unreadCount),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead: boolean }) =>
      notificationService.markRead(id, { isRead }),
    onMutate: ({ id }) => {
      const prev = useNotificationStore.getState().items.find((i) => i.id === id);
      useNotificationStore.getState().markRead(id);
      return { prevRead: prev?.read };
    },
    onError: (_err, { id }, ctx) => {
      if (ctx?.prevRead === false) {
        useNotificationStore.setState((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, read: false } : i)),
        }));
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all });
    },
  });
};

export const useMarkAllRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onMutate: () => {
      const prev = useNotificationStore.getState().items;
      useNotificationStore.getState().markAllRead();
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        useNotificationStore.setState({ items: ctx.prev });
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all });
    },
  });
};
