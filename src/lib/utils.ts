import type {
	ApiErrorResponse,
	ApiErrorUnprocessableEntityResponse,
} from "@/types/api";
import type { TokenPayload } from "@/types/auth";
import { clsx, type ClassValue } from "clsx";
import { jwtDecode } from "jwt-decode";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
	return (
		typeof error === "object" &&
		error !== null &&
		"statusCode" in error &&
		"message" in error &&
		typeof error.message === "string" &&
		typeof error.statusCode === "number"
	);
}

export function isApiErrorUnprocessableEntityResponse(
	error: unknown,
): error is ApiErrorUnprocessableEntityResponse {
	return (
		isApiErrorResponse(error) &&
		"errors" in error &&
		Array.isArray(error.errors) &&
		error.statusCode === 422
	);
}

export function decodeAccessToken(token: string): TokenPayload | null {
	return jwtDecode(token);
}
