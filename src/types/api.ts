/**
 * API Response Types
 * Standardized types for API communication
 */

// Re-export User from authStore for convenience
export type { User } from "@/stores/authStore";

// Generic API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
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
  success: false;
  message: string;
  errors?: FieldError[];
}

export interface FieldError {
  field: string;
  message: string;
}

// Auth specific types
export interface LoginRequest {
  username: string;
  password: string;
  // mock dummy login
  expiresInMins?: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role?: string;
}

export interface AuthResponse {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  image: string;
  accessToken: string;
  refreshToken: string;
  // User object for role-based navigation
  user?: {
    id: string;
    email: string;
    role: string;
    fullName?: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
  // mock dummy login
  expiresInMins?: number;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// User profile
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  image: string;
}
