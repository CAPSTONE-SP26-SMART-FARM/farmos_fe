import { QUERY_KEYS } from "@/constants/endpoints";
import dashboardService from "@/services/dashboardService";
import type {
  DashboardPeriod,
  PayoutWithdrawalsQuery,
  RevenueLineRange,
  RevenueRange,
  RevenueSource,
  RevenueTransactionsQuery,
} from "@/types/dashboard";
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

// ── Admin Revenue ───────────────────────────────────────────────────────
export const useRevenueOverview = (
  kpiRange: RevenueRange,
  chartRange: RevenueRange,
) =>
  useQuery({
    queryKey: QUERY_KEYS.dashboard.revenueOverview(kpiRange, chartRange),
    queryFn: () => dashboardService.revenueOverview(kpiRange, chartRange),
    staleTime: 60_000,
  });

export const useRevenueTimeseries = (
  source: RevenueSource,
  range: RevenueLineRange,
) =>
  useQuery({
    queryKey: QUERY_KEYS.dashboard.revenueTimeseries(source, range),
    queryFn: () => dashboardService.revenueTimeseries(source, range),
    staleTime: 60_000,
  });

export const useRevenueTransactions = (query: RevenueTransactionsQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.dashboard.revenueTransactions(
      query as Record<string, unknown>,
    ),
    queryFn: () => dashboardService.revenueTransactions(query),
    staleTime: 30_000,
  });

// ── Admin Doctor Payouts ────────────────────────────────────────────────
export const usePayoutOverview = (kpiRange: RevenueRange) =>
  useQuery({
    queryKey: QUERY_KEYS.dashboard.payoutOverview(kpiRange),
    queryFn: () => dashboardService.payoutOverview(kpiRange),
    staleTime: 60_000,
  });

export const usePayoutTimeseries = (range: RevenueLineRange) =>
  useQuery({
    queryKey: QUERY_KEYS.dashboard.payoutTimeseries(range),
    queryFn: () => dashboardService.payoutTimeseries(range),
    staleTime: 60_000,
  });

export const usePayoutWithdrawals = (query: PayoutWithdrawalsQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.dashboard.payoutWithdrawals(
      query as Record<string, unknown>,
    ),
    queryFn: () => dashboardService.payoutWithdrawals(query),
    staleTime: 30_000,
  });
