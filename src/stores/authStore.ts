import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  role: string;
  fullName?: string;
  avatar?: string;
  avatarUrl?: string;
  [key: string]: unknown;
}

export interface UserToken {
  refreshToken: string | null;
  accessToken: string | null;
}

interface AuthState {
  user: User | null;
  userToken: UserToken;
  isAuth: boolean;
  isAuthenticated: boolean; // Alias for isAuth
}

interface AuthActions {
  login: (user: User, userToken: UserToken) => void;
  logout: () => void;
  setTokens: (userToken: UserToken) => void;
  setUser: (user: User) => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  userToken: {
    refreshToken: null,
    accessToken: null,
  },
  isAuth: false,
  isAuthenticated: false,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      login: (user, userToken) => {
        localStorage.setItem("accessToken", userToken.accessToken ?? "");
        localStorage.setItem("refreshToken", userToken.refreshToken ?? "");
        set({
          user,
          userToken,
          isAuth: true,
          isAuthenticated: true,
        });
      },

      logout: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        set(initialState);
      },

      setTokens: (userToken) => {
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
