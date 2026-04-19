import type {
  ApiErrorResponse,
  ApiErrorUnprocessableEntityResponse,
} from "@/types/api";
import type { TokenPayload } from "@/types/auth";
import type { AxiosError } from "axios";
import axios from "axios";
import { clsx, type ClassValue } from "clsx";
import { jwtDecode } from "jwt-decode";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isAxiosError(error: unknown): error is AxiosError {
  return axios.isAxiosError(error);
}

export function isApiErrorResponse(
  error: unknown,
): error is AxiosError<ApiErrorResponse> {
  return (
    isAxiosError(error) &&
    typeof error.response?.data === "object" &&
    error.response?.data !== null &&
    "statusCode" in error.response.data &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string" &&
    typeof error.response.data.statusCode === "number"
  );
}

export function isApiErrorUnprocessableEntityResponse<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends Record<string, any> = Record<string, any>,
>(error: unknown): error is AxiosError<ApiErrorUnprocessableEntityResponse<T>> {
  return (
    isApiErrorResponse(error) &&
    error.response?.status === 422 &&
    typeof error.response?.data === "object" &&
    error.response?.data !== null &&
    "errors" in error.response.data &&
    Array.isArray(
      (error.response.data as ApiErrorUnprocessableEntityResponse<T>).errors,
    )
  );
}

export function decodeAccessToken(token: string): TokenPayload | null {
  return jwtDecode(token);
}
