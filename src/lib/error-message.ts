import type { AxiosError } from "axios";

const VIETNAMESE_CHAR_PATTERN =
  /[a-zA-Z]*[\u00C0-\u024F\u1E00-\u1EFF][a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]*/;

const ENGLISH_ALPHA_PATTERN = /[A-Za-z]/;

const BACKEND_ERROR_MAP: Record<string, string> = {
  unauthorized: "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.",
  forbidden: "Bạn không có quyền thực hiện thao tác này.",
  "forbidden resource": "Bạn không có quyền truy cập tài nguyên này.",
  "access denied": "Bạn không có quyền truy cập.",
  "invalid credentials": "Email hoặc mật khẩu không chính xác.",
  "invalid token": "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
  "token expired": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  "refresh token expired":
    "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  "no refresh token available":
    "Không tìm thấy thông tin phiên đăng nhập. Vui lòng đăng nhập lại.",
  "network error": "Không thể kết nối tới máy chủ. Vui lòng thử lại.",
  "request timeout": "Yêu cầu bị quá thời gian. Vui lòng thử lại.",
  "internal server error":
    "Máy chủ đang gặp sự cố. Vui lòng thử lại sau.",
  "too many requests": "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
};

const normalizeMessage = (message: string) =>
  message.trim().replace(/\s+/g, " ").toLowerCase();

const looksVietnamese = (message: string) => VIETNAMESE_CHAR_PATTERN.test(message);

export const translateBackendMessage = (message: string) => {
  const normalized = normalizeMessage(message);

  if (!normalized) {
    return "Đã xảy ra lỗi. Vui lòng thử lại.";
  }

  if (looksVietnamese(message)) {
    return message;
  }

  if (BACKEND_ERROR_MAP[normalized]) {
    return BACKEND_ERROR_MAP[normalized];
  }

  if (/not found|does not exist|no such/i.test(message)) {
    return "Không tìm thấy dữ liệu yêu cầu.";
  }

  if (/already exists|duplicate|unique constraint|must be unique/i.test(message)) {
    return "Dữ liệu đã tồn tại.";
  }

  if (/required|must not be empty|should not be empty/i.test(message)) {
    return "Vui lòng nhập đầy đủ các trường bắt buộc.";
  }

  if (/invalid|validation|unprocessable|format|malformed|must be/i.test(message)) {
    return "Dữ liệu không hợp lệ. Vui lòng kiểm tra và thử lại.";
  }

  if (/timeout|timed out|econnaborted/i.test(message)) {
    return "Kết nối quá thời gian. Vui lòng thử lại.";
  }

  if (/internal server error|server error/i.test(message)) {
    return "Máy chủ đang gặp sự cố. Vui lòng thử lại sau.";
  }

  if (/too many requests|rate limit/i.test(message)) {
    return "Bạn thao tác quá nhanh. Vui lòng thử lại sau.";
  }

  if (/network error|failed to fetch|connection refused/i.test(message)) {
    return "Không thể kết nối tới máy chủ. Vui lòng thử lại.";
  }

  if (ENGLISH_ALPHA_PATTERN.test(message)) {
    return "Đã xảy ra lỗi từ hệ thống. Vui lòng thử lại.";
  }

  return message;
};

export const getApiErrorMessageVi = (
  error: unknown,
  fallbackMessage = "Đã xảy ra lỗi. Vui lòng thử lại.",
) => {
  const axiosError = error as AxiosError<{
    message?: string | string[];
  }>;

  const rawMessage = axiosError?.response?.data?.message;

  if (Array.isArray(rawMessage)) {
    const joined = rawMessage.join(". ");
    return translateBackendMessage(joined || fallbackMessage);
  }

  if (typeof rawMessage === "string" && rawMessage.trim()) {
    return translateBackendMessage(rawMessage);
  }

  if (error instanceof Error && error.message) {
    return translateBackendMessage(error.message);
  }

  return fallbackMessage;
};
