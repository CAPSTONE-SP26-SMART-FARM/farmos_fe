import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/constants/endpoints";
import type {
	LoginBodyType,
	RegisterBodyType,
	RefreshTokenBodyType,
	ForgotPasswordBodyType,
	LoginResType,
	RegisterResType,
	RefreshTokenResType,
	TwoFactorSetupResType,
	DisableTwoFactorBodyType,
	LogoutBodyType,
	SendOTPBodyType,
} from "@/schemaValidatation/auth";
import type { UserResType } from "@/types/user";
import type { ApiResponse } from "@/types/api";

const AUTH = API_ENDPOINTS.AUTH;

export const authService = {
	login: (credentials: LoginBodyType) =>
		api.post<LoginResType, LoginBodyType>(AUTH.LOGIN, {
			...credentials,
		}),

	register: (data: RegisterBodyType) =>
		api.post<RegisterResType, RegisterBodyType>(AUTH.REGISTER, data),

	refreshToken: (data: RefreshTokenBodyType) =>
		api.post<RefreshTokenResType, RefreshTokenBodyType>(AUTH.REFRESH, {
			...data,
		}),

	logout: async (data: LogoutBodyType) => {
		try {
			await api.post<LogoutBodyType>(AUTH.LOGOUT, data);
		} catch {
			// Ignore - clear local state anyway
		}
	},

	forgotPassword: (data: ForgotPasswordBodyType) =>
		api.post(`${AUTH.FORGOT_PASSWORD}`, data),

	twoFactorSetup: (data: object) =>
		api.post<TwoFactorSetupResType>(`${AUTH.TWO_FACTOR_SETUP}`, data),

	twoFactorDisable: (data: DisableTwoFactorBodyType) =>
		api.post<ApiResponse, DisableTwoFactorBodyType>(
			`${AUTH.TWO_FACTOR_DISABLE}`,
			data,
		),
	sendOtp: (data: SendOTPBodyType) =>
		api.post<ApiResponse, SendOTPBodyType>(`${AUTH.SEND_OTP}`, data),

	getCurrentUser: () => api.get<UserResType>(AUTH.ME),
};

export default authService;
