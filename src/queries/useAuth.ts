/**
 * Authentication Hooks
 * Custom React Query hooks for auth operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";
import { QUERY_KEYS } from "@/constants/endpoints";
import type {
	ForgotPasswordBodyType,
	LoginBodyType,
	RegisterBodyType,
	SendOTPBodyType,
	UpdateProfileType,
} from "@/schemaValidatation/auth";

/**
 * Hook for user login
 */
export const useLogin = () => {
	const { setTokens } = useAuthStore();

	return useMutation({
		mutationFn: (credentials: LoginBodyType) => authService.login(credentials),
		onSuccess: (data) => {
			// Use login action to set both user and tokens atomically
			setTokens(data.data);

			toast.success("Đăng nhập thành công!");
		},
	});
};

/**
 * Hook for user registration
 */
export const useRegister = () => {
	const navigate = useNavigate();

	return useMutation({
		mutationFn: (data: RegisterBodyType) => authService.register(data),
		onSuccess: () => {
			toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
			navigate("/login");
		},
	});
};

/**
 * Hook for user logout
 */
export const useLogout = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { logout: clearAuthState } = useAuthStore();

	return useMutation({
		mutationFn: () =>
			authService.logout({
				refreshToken: localStorage.getItem("refreshToken")!,
			}),
		onSettled: () => {
			// Always clear local state, even if server logout fails
			console.log(1);
			clearAuthState();

			// Clear all cached queries
			queryClient.clear();

			toast.success("Đã đăng xuất thành công.");
			navigate("/login");
		},
	});
};

/**
 * Hook for getting current user
 * Fetches user data on app init if authenticated
 */
export const useCurrentUser = () => {
	const { isAuthenticated, setUser } = useAuthStore();

	return useQuery({
		queryKey: QUERY_KEYS.auth.user(),
		queryFn: async () => {
			const result = await authService.getCurrentUser();
			setUser(result.data);
			return result.data;
		},
		enabled: isAuthenticated,
		staleTime: 1000 * 60 * 10, // 10 minutes
		retry: false,
	});
};

/**
 * Hook for refreshing tokens
 */
export const useRefreshToken = () => {
	const { setTokens, logout } = useAuthStore();

	return useMutation({
		mutationFn: (refreshToken: string) =>
			authService.refreshToken({ refreshToken }),
		onSuccess: (data) => {
			setTokens({
				accessToken: data.data.accessToken,
				refreshToken: data.data.refreshToken,
			});
		},
		onError: () => {
			logout();
		},
	});
};

/**
 * Get auth state from store (non-hook version for use outside components)
 */
export const getAuthState = () => useAuthStore.getState();

/**
 * Type for user with role
 */

export const useForgotPassword = () => {
	return useMutation({
		mutationFn: (data: ForgotPasswordBodyType) =>
			authService.forgotPassword(data),
		onSuccess: () => {
			toast.success("Đã gửi link đặt lại mật khẩu về email của bạn!");
		},
		onError: () => {
			toast.error("Gửi link đặt lại mật khẩu thất bại. Vui lòng thử lại.");
		},
	});
};

export const useSendOtp = () => {
	return useMutation({
		mutationFn: (data: SendOTPBodyType) => authService.sendOtp(data),
		onSuccess: () => {},
		onError: () => {},
	});
};

export const useTwoFactorSetup = () => {
	return useMutation({
		mutationFn: (data: object) => authService.twoFactorSetup(data),
		onSuccess: () => {},
		onError: () => {},
	});
};

export const useTwoFactorDisable = () => {
	return useMutation({
		mutationFn: (data: object) => authService.twoFactorDisable(data),
		onSuccess: () => {},
		onError: () => {},
	});
};

export const useUpdateProfile = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (data: UpdateProfileType) => authService.updateProfile(data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEYS.auth.user() });
		},
	});
};
