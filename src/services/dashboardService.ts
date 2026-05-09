import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/constants/endpoints";
import type {
  AdminDashboardPayload,
  DashboardPeriod,
  ManagerDashboardPayload,
  OwnerDashboardPayload,
  PayoutOverviewPayload,
  PayoutTimeseriesPayload,
  PayoutWithdrawalsPayload,
  PayoutWithdrawalsQuery,
  RevenueLineRange,
  RevenueOverviewPayload,
  RevenueRange,
  RevenueSource,
  RevenueTimeseriesPayload,
  RevenueTransactionsPayload,
  RevenueTransactionsQuery,
} from "@/types/dashboard";

const D = API_ENDPOINTS.DASHBOARD;

const dashboardService = {
  admin: (period: DashboardPeriod) =>
    api.get<AdminDashboardPayload>(`${D.ADMIN}?period=${period}`),
  owner: (period: DashboardPeriod) =>
    api.get<OwnerDashboardPayload>(`${D.OWNER}?period=${period}`),
  manager: (period: DashboardPeriod) =>
    api.get<ManagerDashboardPayload>(`${D.MANAGER}?period=${period}`),

  revenueOverview: (kpiRange: RevenueRange, chartRange: RevenueRange) =>
    api.get<RevenueOverviewPayload>(D.ADMIN_REVENUE_OVERVIEW, {
      params: { kpiRange, chartRange },
    }),
  revenueTimeseries: (source: RevenueSource, range: RevenueLineRange) =>
    api.get<RevenueTimeseriesPayload>(D.ADMIN_REVENUE_TIMESERIES, {
      params: { source, range },
    }),
  revenueTransactions: (query: RevenueTransactionsQuery) =>
    api.get<RevenueTransactionsPayload>(D.ADMIN_REVENUE_TRANSACTIONS, {
      params: query,
    }),

  payoutOverview: (kpiRange: RevenueRange) =>
    api.get<PayoutOverviewPayload>(D.ADMIN_PAYOUT_OVERVIEW, {
      params: { kpiRange },
    }),
  payoutTimeseries: (range: RevenueLineRange) =>
    api.get<PayoutTimeseriesPayload>(D.ADMIN_PAYOUT_TIMESERIES, {
      params: { range },
    }),
  payoutWithdrawals: (query: PayoutWithdrawalsQuery) =>
    api.get<PayoutWithdrawalsPayload>(D.ADMIN_PAYOUT_WITHDRAWALS, {
      params: query,
    }),
};

export default dashboardService;
