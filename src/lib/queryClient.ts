/**
 * React Query Client Configuration
 * Centralized query client with default options
 */

import { QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import type { ApiErrorResponse } from "@/types/api";
import {
	isApiErrorResponse,
	isApiErrorUnprocessableEntityResponse,
} from "./utils";

/**
 * Extract error message from various error types
 */
export const getErrorMessage = (error: unknown): string => {
	if (isApiErrorResponse(error)) {
		const apiError = error.response?.data as ApiErrorResponse;

		// Check for field-level errors

		if (isApiErrorUnprocessableEntityResponse(error.response?.data)) {
			return error.response.data.message;
		}

		// Check for message
		if (apiError?.message) {
			return apiError.message;
		}

		// Check for network error
		if (error.code === "ERR_NETWORK") {
			return "Network error. Please check your connection.";
		}

		// Check for timeout
		if (error.code === "ECONNABORTED") {
			return "Request timeout. Please try again.";
		}
	}

	if (error instanceof Error) {
		return error.message;
	}

	return "An unexpected error occurred";
};

/**
 * Create configured QueryClient
 */
export const createQueryClient = () =>
	new QueryClient({
		// queryCache: new QueryCache({
		// 	onError: (error, query) => {
		// 		// Only show error toast for queries that have already been successful before
		// 		// This prevents showing errors on initial load failures
		// 		if (query.state.data !== undefined) {
		// 			toast.error(getErrorMessage(error));
		// 		}
		// 	},
		// }),
		// mutationCache: new MutationCache({
		// 	onError: (error) => {
		// 		toast.error(getErrorMessage(error));
		// 		if (
		// 			error instanceof AxiosError &&
		// 			isApiErrorUnprocessableEntityResponse(error.response?.data)
		// 		) {
		// 			console.log("Field errors:", error.response?.data);
		// 			return error;
		// 		}
		// 		return error;
		// 	},
		// }),
		defaultOptions: {
			queries: {
				staleTime: 1000 * 60 * 5, // 5 minutes
				gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
				retry: (failureCount, error) => {
					// Don't retry on 4xx errors
					if (error instanceof AxiosError) {
						const status = error.response?.status;
						if (status && status >= 400 && status < 500) {
							return false;
						}
					}
					return failureCount < 2;
				},
				refetchOnWindowFocus: false,
			},
			mutations: {
				retry: false,
			},
		},
	});

// Export singleton instance for use in main.tsx
export const queryClient = createQueryClient();
