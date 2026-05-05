import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/constants/endpoints";
import type {
  AdminDashboardPayload,
  DashboardPeriod,
  ManagerDashboardPayload,
  OwnerDashboardPayload,
} from "@/types/dashboard";

const D = API_ENDPOINTS.DASHBOARD;

const dashboardService = {
  admin: (period: DashboardPeriod) =>
    api.get<AdminDashboardPayload>(`${D.ADMIN}?period=${period}`),
  owner: (period: DashboardPeriod) =>
    api.get<OwnerDashboardPayload>(`${D.OWNER}?period=${period}`),
  manager: (period: DashboardPeriod) =>
    api.get<ManagerDashboardPayload>(`${D.MANAGER}?period=${period}`),
};

export default dashboardService;
