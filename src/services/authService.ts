import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/constants/endpoints";
import type {
	AuthResponseType,
	LoginBodyType,
	RegisterBodyType,
	RefreshTokenBodyType,
	RefreshTokenResponseType,
} from "@/types/auth";
import type { User } from "@/stores/authStore";

const AUTH = API_ENDPOINTS.AUTH;

export const authService = {
	login: (credentials: LoginBodyType) =>
		api.post<AuthResponseType, LoginBodyType>(AUTH.LOGIN, {
			...credentials,
			expiresInMins: 60,
		}),

	register: (data: RegisterBodyType) =>
		api.post<AuthResponseType, RegisterBodyType>(AUTH.REGISTER, data),

	refreshToken: (data: RefreshTokenBodyType) =>
		api.post<RefreshTokenResponseType, RefreshTokenBodyType>(AUTH.REFRESH, {
			...data,
			expiresInMins: 60,
		}),

	logout: async () => {
		try {
			await api.post(AUTH.LOGOUT);
		} catch {
			// Ignore - clear local state anyway
		}
	},

	forgotPassword: (data: { email: string }) =>
		api.post(`${AUTH.FORGOT_PASSWORD}`, data),

	getCurrentUser: () => api.get<User>(AUTH.ME),
};

export default authService;
