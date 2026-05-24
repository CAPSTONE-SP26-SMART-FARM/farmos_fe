import type { LoginResType } from "@/schemaValidatation/auth";
import type { UserResType } from "@/types/user";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useFarmStore } from "./farmStore";
import { useNotificationStore } from "./notificationStore";

interface AuthState {
  user: UserResType | null;
  userToken: LoginResType;
  isAuth: boolean;
  isAuthenticated: boolean; // Alias for isAuth
}

interface AuthActions {
  logout: () => void;
  setTokens: (userToken: LoginResType) => void;
  setUser: (user: UserResType) => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  userToken: {
    refreshToken: "",
    accessToken: "",
  },
  isAuth: false,
  isAuthenticated: false,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,
      logout: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        useFarmStore.getState().clearFarm();
        useNotificationStore.getState().reset();
        set(initialState);
      },

      setTokens: (userToken: LoginResType) => {
        localStorage.setItem("accessToken", userToken.accessToken ?? "");
        localStorage.setItem("refreshToken", userToken.refreshToken ?? "");
        set({
          userToken,
          isAuth: true,
          isAuthenticated: true,
        });
      },

      setUser: (user) => {
        set({ user });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        userToken: state.userToken,
        isAuth: state.isAuth,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// Selectors for convenience
export const selectUser = () => useAuthStore.getState().user;
export const selectIsAuth = () => useAuthStore.getState().isAuth;
export const selectIsAuthenticated = () =>
  useAuthStore.getState().isAuthenticated;
export const selectUserToken = () => useAuthStore.getState().userToken;
