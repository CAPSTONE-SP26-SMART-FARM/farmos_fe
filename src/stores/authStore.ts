import type { LoginResType } from "@/schemaValidatation/auth";
import type { UserResType } from "@/types/user";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
	user: UserResType | null;
	userToken: LoginResType;
	isAuth: boolean;
	isAuthenticated: boolean; // Alias for isAuth
}

interface AuthActions {
	login: (user: UserResType | null, userToken: LoginResType) => void;
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
