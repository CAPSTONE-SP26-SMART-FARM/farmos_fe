import { create } from "zustand";

interface SocketState {
  connected: boolean;
  lastConnectedAt: Date | null;
}

interface SocketActions {
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

type SocketStore = SocketState & SocketActions;

const initialState: SocketState = {
  connected: false,
  lastConnectedAt: null,
};

export const useSocketStore = create<SocketStore>()((set) => ({
  ...initialState,
  setConnected: (connected) =>
    set({
      connected,
      ...(connected ? { lastConnectedAt: new Date() } : {}),
    }),
  reset: () => set(initialState),
}));
