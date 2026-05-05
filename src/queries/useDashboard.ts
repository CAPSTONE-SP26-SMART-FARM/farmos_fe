import { QUERY_KEYS } from "@/constants/endpoints";
import dashboardService from "@/services/dashboardService";
import type { DashboardPeriod } from "@/types/dashboard";
import { useQuery } from "@tanstack/react-query";

export const useAdminDashboard = (period: DashboardPeriod = "30d") =>
  useQuery({
    queryKey: QUERY_KEYS.dashboard.admin(period),
    queryFn: () => dashboardService.admin(period),
    staleTime: 60_000,
  });

export const useOwnerDashboard = (period: DashboardPeriod = "30d") =>
  useQuery({
    queryKey: QUERY_KEYS.dashboard.owner(period),
    queryFn: () => dashboardService.owner(period),
    staleTime: 60_000,
  });

export const useManagerDashboard = (period: DashboardPeriod = "30d") =>
  useQuery({
    queryKey: QUERY_KEYS.dashboard.manager(period),
    queryFn: () => dashboardService.manager(period),
    staleTime: 60_000,
  });
