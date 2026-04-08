import type { FarmResType } from "@/schemaValidatation/farmManagement";
import { create } from "zustand";

interface FarmState {
  farm: FarmResType | null;
}

interface FarmActions {
  setFarm: (farm: FarmResType) => void;
  clearFarm: () => void;
}

type FarmStore = FarmState & FarmActions;

export const useFarmStore = create<FarmStore>()((set) => ({
  farm: null,
  setFarm: (farm) => set({ farm }),
  clearFarm: () => set({ farm: null }),
}));
