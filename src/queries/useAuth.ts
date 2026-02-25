/**
 * Authentication Hooks
 * Custom React Query hooks for auth operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { useAuthStore, type User } from "@/stores/authStore";
import { QUERY_KEYS } from "@/constants/endpoints";
import type { LoginBodyType, RegisterBodyType } from "@/types/auth";

/**
 * Hook for user login
 */
export const useLogin = () => {
	const navigate = useNavigate();
	const { login } = useAuthStore();

	return useMutation({
		mutationFn: (credentials: LoginBodyType) => authService.login(credentials),
		onSuccess: (data) => {
			// Store user data (construct from response if no user object)
			const user: User = data.user ?? {
				id: String(data.id),
				email: data.email,
				role: "Owner", // Default role, will be updated from API
				fullName: `${data.firstName} ${data.lastName}`,
			};

			// Use login action to set both user and tokens atomically
			login(user, {
				accessToken: data.accessToken,
				refreshToken: data.refreshToken,
			});

			toast.success("Login successful!");

			// Navigate to role-based dashboard
			const role = user.role?.toLowerCase() ?? "owner";

			navigate(`/dashboard/${role}`, { replace: true });
			console.log("go");
			console.log(`/dashboard/${role}`);
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
			toast.success("Registration successful! Please log in.");
			navigate("/login");
		},
		onError: () => {
			// Error toast is handled globally by queryClient
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
		mutationFn: () => authService.logout(),
		onSettled: () => {
			// Always clear local state, even if server logout fails
			clearAuthState();

			// Clear all cached queries
			queryClient.clear();

			toast.success("Logged out successfully");
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
			const user = await authService.getCurrentUser();
			setUser(user);
			return user;
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
				accessToken: data.accessToken,
				refreshToken: data.refreshToken,
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
export type { User };
