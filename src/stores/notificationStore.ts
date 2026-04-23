import { create } from "zustand";
import {
  NOTIFICATION_MAX_ITEMS,
  type NotificationKindType,
  type RealtimeEventName,
} from "@/constants/realtime";

export type NotificationSeverity = "info" | "success" | "warning" | "error";

export interface NotificationItem {
  id: string;
  kind: NotificationKindType;
  event: RealtimeEventName;
  title: string;
  description?: string;
  href?: string;
  severity: NotificationSeverity;
  createdAt: number;
  read: boolean;
  payload: unknown;
}

interface NotificationState {
  items: NotificationItem[];
}

interface NotificationActions {
  add: (item: NotificationItem) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
  reset: () => void;
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>()((set) => ({
  items: [],
  add: (item) =>
    set((state) => {
      const existingIndex = state.items.findIndex((i) => i.id === item.id);
      if (existingIndex !== -1) {
        // Dedup: update timestamp + payload nhưng giữ nguyên vị trí / read state.
        const next = state.items.slice();
        const prev = next[existingIndex];
        next[existingIndex] = {
          ...prev,
          createdAt: item.createdAt,
          payload: item.payload,
          title: item.title,
          description: item.description,
          href: item.href,
          severity: item.severity,
        };
        return { items: next };
      }
      return {
        items: [item, ...state.items].slice(0, NOTIFICATION_MAX_ITEMS),
      };
    }),
  markRead: (id) =>
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, read: true } : i)),
    })),
  markAllRead: () =>
    set((state) => ({
      items: state.items.map((i) => (i.read ? i : { ...i, read: true })),
    })),
  clear: () => set({ items: [] }),
  reset: () => set({ items: [] }),
}));

export const selectUnreadCount = (state: NotificationState): number =>
  state.items.reduce((acc, i) => (i.read ? acc : acc + 1), 0);
