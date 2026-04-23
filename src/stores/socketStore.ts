import { create } from "zustand";

interface SocketState {
  connected: boolean;
  lastConnectedAt: Date | null;
  disconnectedSince: Date | null;
  reconnectCount: number;
}

interface SocketActions {
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

type SocketStore = SocketState & SocketActions;

const initialState: SocketState = {
  connected: false,
  lastConnectedAt: null,
  disconnectedSince: null,
  reconnectCount: 0,
};

export const useSocketStore = create<SocketStore>()((set, get) => ({
  ...initialState,
  setConnected: (connected) => {
    const state = get();
    if (connected) {
      // Reconnect lần >=2 (đã từng connect trước đó) → tăng reconnectCount
      // để consumer (useRealtimeEvents) có thể invalidate query sau reconnect.
      const isReconnect = state.lastConnectedAt !== null;
      set({
        connected: true,
        lastConnectedAt: new Date(),
        disconnectedSince: null,
        reconnectCount: isReconnect
          ? state.reconnectCount + 1
          : state.reconnectCount,
      });
      return;
    }
    set({
      connected: false,
      disconnectedSince: state.connected ? new Date() : state.disconnectedSince,
    });
  },
  reset: () => set(initialState),
}));
