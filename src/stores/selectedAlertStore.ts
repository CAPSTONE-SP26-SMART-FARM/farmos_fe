import { create } from "zustand";

interface SelectedAlertState {
  alertId: string | null;
}

interface SelectedAlertActions {
  open: (alertId: string) => void;
  close: () => void;
}

export const useSelectedAlertStore = create<
  SelectedAlertState & SelectedAlertActions
>((set) => ({
  alertId: null,
  open: (alertId) => set({ alertId }),
  close: () => set({ alertId: null }),
}));
