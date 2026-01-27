import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/constants/endpoints";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from "@/types/api";
import type { User } from "@/stores/authStore";

const AUTH = API_ENDPOINTS.AUTH;

export const authService = {
  login: (credentials: LoginRequest) =>
    api.post<AuthResponse, LoginRequest>(AUTH.LOGIN, {
      ...credentials,
      expiresInMins: 1,
    }),

  register: (data: RegisterRequest) =>
    api.post<AuthResponse, RegisterRequest>(AUTH.REGISTER, data),

  refreshToken: (data: RefreshTokenRequest) =>
    api.post<RefreshTokenResponse, RefreshTokenRequest>(AUTH.REFRESH, {
      ...data,
      expiresInMins: 1,
    }),

  logout: async () => {
    try {
      await api.post(AUTH.LOGOUT);
    } catch {
      // Ignore - clear local state anyway
    }
  },

  getCurrentUser: () => api.get<User>(AUTH.ME),
};

export default authService;
