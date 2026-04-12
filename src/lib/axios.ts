import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import type {
  ApiErrorResponse,
  ApiErrorUnprocessableEntityResponse,
  ApiResponseType,
} from "@/types/api";
import type { Path, UseFormSetError } from "react-hook-form";
import { translateBackendMessage } from "@/lib/error-message";

// Token refresh state to prevent multiple simultaneous refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

const localizeApiError = (error: AxiosError<ApiErrorResponse>) => {
  if (error.response?.data?.message) {
    error.response.data.message = translateBackendMessage(
      error.response.data.message,
    );
  }
  return error;
};

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh for auth endpoints to prevent infinite loops
      if (
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/refresh")
      ) {
        return Promise.reject(localizeApiError(error));
      }

      if (isRefreshing) {
        // Queue requests while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("Không tìm thấy thông tin phiên đăng nhập.");
        }

        // Call refresh token endpoint
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { refreshToken },
          { headers: { "Content-Type": "application/json" } },
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data;

        // Update tokens in localStorage
        localStorage.setItem("accessToken", newAccessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        // Process queued requests
        processQueue(null, newAccessToken);

        // Retry original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        const normalizedRefreshError =
          refreshError instanceof Error
            ? new Error(translateBackendMessage(refreshError.message))
            : new Error("Đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");

        processQueue(normalizedRefreshError, null);
        // Do not force logout/redirect; allow manual logout from UI.
        return Promise.reject(normalizedRefreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other errors
    return Promise.reject(localizeApiError(error));
  },
);

export default axiosInstance;

/**
 * Type-safe request helpers
 */
export const api = {
  get: <T>(url: string, config?: InternalAxiosRequestConfig) =>
    axiosInstance.get<ApiResponseType<T>>(url, config).then((res) => res.data),

  post: <T, D = unknown>(
    url: string,
    data?: D,
    config?: InternalAxiosRequestConfig,
  ) =>
    axiosInstance
      .post<ApiResponseType<T>>(url, data, config)
      .then((res) => res.data),

  put: <T, D = unknown>(
    url: string,
    data?: D,
    config?: InternalAxiosRequestConfig,
  ) =>
    axiosInstance
      .put<ApiResponseType<T>>(url, data, config)
      .then((res) => res.data),

  patch: <T, D = unknown>(
    url: string,
    data?: D,
    config?: InternalAxiosRequestConfig,
  ) =>
    axiosInstance
      .patch<ApiResponseType<T>>(url, data, config)
      .then((res) => res.data),

  delete: <T>(url: string, config?: InternalAxiosRequestConfig) =>
    axiosInstance
      .delete<ApiResponseType<T>>(url, config)
      .then((res) => res.data),
};

const API_ERROR_TRANSLATIONS: Record<string, string> = {
  "This MAC address is already registered.": "Địa chỉ MAC này đã được đăng ký.",
  "Batch must include board_module, lora_module, and wifi_module.":
    "Batch phải bao gồm board_module, lora_module và wifi_module.",
  "Batch must contain exactly one board_module (primary parent).":
    "Batch phải chứa đúng một board_module (thiết bị chính).",
};

export const handleApiErrorUnprocessentity =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <T extends Record<string, any> = Record<string, any>>(
    errors: ApiErrorUnprocessableEntityResponse<T>["errors"],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setError?: UseFormSetError<any>,
  ) => {
    if (errors && setError) {
      errors.forEach(({ field, message }) => {
        if (field && message) {
          const translatedMessage =
            API_ERROR_TRANSLATIONS[String(message)] ?? String(message);
          setError(field as Path<T>, { message: translatedMessage });
        }
      });
    }

    return Promise.reject(errors);
  };
