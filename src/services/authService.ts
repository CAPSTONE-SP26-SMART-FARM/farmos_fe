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
	UpdateProfileType,
	UpdateProfileResType,
} from "@/schemaValidatation/auth";
import type { UserResType } from "@/types/user";
import type { ApiResponseType } from "@/types/api";

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
		api.post<ApiResponseType, DisableTwoFactorBodyType>(
			`${AUTH.TWO_FACTOR_DISABLE}`,
			data,
		),
	sendOtp: (data: SendOTPBodyType) =>
		api.post<ApiResponseType, SendOTPBodyType>(`${AUTH.SEND_OTP}`, data),

	getCurrentUser: () => api.get<UserResType>(AUTH.ME),

	updateProfile: (data: UpdateProfileType) =>
		api.post<UpdateProfileResType, UpdateProfileType>(AUTH.UPDATE_PROFLIE, {
			...data,
		}),
};

export default authService;
