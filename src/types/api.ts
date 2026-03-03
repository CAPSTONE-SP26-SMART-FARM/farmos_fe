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
	T extends Record<string, string> = Record<string, string>,
> extends ApiErrorResponse {
	errors: Array<{ [K in keyof T]?: string }>;
}

// Auth specific types
