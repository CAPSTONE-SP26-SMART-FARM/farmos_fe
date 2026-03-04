/**
 * API Response Types
 * Standardized types for API communication
 */

// Re-export User from authStore for convenience

// Generic API response wrapper
export interface ApiResponse<T = unknown> {
	statusCode: number;
	message: string;
	data: T;
}

// Paginated response
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
	meta: PaginationMeta;
}

export interface PaginationMeta {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

// Error response from API
export interface ApiErrorResponse {
	statusCode: number;
	message: string;
}

export interface ApiErrorUnprocessableEntityResponse<
	//disable eslint
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends Record<string, any> = Record<string, any>,
> extends ApiErrorResponse {
	errors: Array<{ field: keyof T; message: string; code: string }>;
}

// Auth specific types
