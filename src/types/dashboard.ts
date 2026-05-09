// Dashboard API response types — mirrors BE `dashboard.model.ts` Zod schemas.
// Components import from here; we never re-derive the contract elsewhere.

import type { DailyLogResType } from "@/schemaValidatation/dailyLog";

// ── Shared ────────────────────────────────────────────────────────────────

export type DashboardPeriod = "1d" | "7d" | "30d" | "90d";

export interface DailyPoint {
  date: string; // yyyy-MM-dd UTC
  value: number;
}

// ── Admin ─────────────────────────────────────────────────────────────────

/**
 * KPI strip rendered on the admin overview. Currency values are VND
 * (no decimals). `*Delta` is the period-over-period absolute difference,
 * i.e. `value(period) − value(previous period of equal length)`.
 */
export interface AdminKpiSummary {
  totalUsers: number;
  totalUsersDelta: number;
  totalRevenueVnd: number;
  totalRevenueVndDelta: number;
  totalSubscriptionsRegistered: number;
  totalSubscriptionsRegisteredDelta: number;
  totalTicketsRecorded: number;
  totalTicketsRecordedDelta: number;
  pendingDoctorApps: number;
  pendingDoctorAppsDelta: number;
  doctorPayoutVnd: number;
  doctorPayoutVndDelta: number;
}

/** Lifetime money flow surfaced in the "Ví tiền nền tảng" donut. */
export interface PlatformWallet {
  revenueVnd: number;
  costVnd: number;
  netVnd: number;
}

export interface SubscriptionPlanShare {
  planName: string;
  count: number;
  color: string;
}

export type IotFleetStatus =
  | "active"
  | "inactive"
  | "maintenance"
  | "error"
  | "damaged"
  | "retired";

export interface IotFleetSlice {
  status: IotFleetStatus;
  label: string;
  count: number;
  color: string;
}

export interface AdminDashboardPayload {
  period: DashboardPeriod;
  kpis: AdminKpiSummary;
  platformWallet: PlatformWallet;
  revenueTrend: DailyPoint[];
  newUsersTrend: DailyPoint[];
  subscriptionDistribution: SubscriptionPlanShare[];
  iotFleetBoards: IotFleetSlice[];
}

// ── Owner ─────────────────────────────────────────────────────────────────

export interface OwnerFarmGlance {
  farmId: string | null;
  farmName: string | null;
  totalAreaSqm: number;
  zonesCount: number;
  activeCropSeasons: number;
  managers: number;
  farmers: number;
  zoneCoveragePct: number;
}

export interface OwnerOperationsToday {
  tasksOpen: number;
  logsSubmitted: number;
  milestonesInProgress: number;
  compliancePct: number;
}

export type HealthSeverity = "critical" | "warning" | "info";

export interface OwnerHealthItem {
  id: string;
  type: "sensor-anomaly" | "ticket" | "device-offline";
  severity: HealthSeverity;
  title: string;
  subtitle: string;
  href: string;
  ageHours: number;
}

export interface OwnerHealthSummary {
  criticalAlerts: number;
  openTickets: number;
  devicesOffline: number;
  items: OwnerHealthItem[];
}

export interface OwnerSubscriptionStatus {
  subscriptionId: string;
  planName: string;
  status: "active" | "expiring" | "expired";
  daysRemaining: number;
  autoRenew: boolean;
  currentPeriodEnd: string | null;
  monthlyPriceVnd: number;
}

export interface OwnerCreditBalance {
  doctorCredits: number;
  ticketCredits: number;
}

export interface OwnerLatestInvoice {
  invoiceId: string;
  invoiceCode: string;
  amountVnd: number;
  status: "paid" | "open" | "overdue";
  issuedAt: string;
}

export interface OwnerRoleShare {
  role: "manager" | "farmer";
  label: string;
  count: number;
  color: string;
}

export interface OwnerDoctor {
  id: string;
  fullName: string;
  specialty: string | null;
  avatarUrl: string | null;
  status: "active" | "busy";
}

export interface OwnerDashboardPayload {
  period: DashboardPeriod;
  farmGlance: OwnerFarmGlance;
  operationsToday: OwnerOperationsToday;
  health: OwnerHealthSummary;
  subscription: OwnerSubscriptionStatus | null;
  credits: OwnerCreditBalance;
  latestInvoice: OwnerLatestInvoice | null;
  monthlySpend?: DailyPoint[];
  roleDistribution?: OwnerRoleShare[];
  doctors: OwnerDoctor[];
  recentLogs: DailyLogResType[];
}

// ── Manager ───────────────────────────────────────────────────────────────

export interface ManagerZonesGlance {
  assignedZones: number;
  totalAreaSqm: number;
  activeCropSeasons: number;
  farmersReporting: number;
}

export type ManagerOperationsToday = OwnerOperationsToday;

export interface ManagerHealthItem extends OwnerHealthItem {
  zoneName: string;
}

export interface ManagerHealthSummary {
  criticalAlerts: number;
  openTickets: number;
  devicesOffline: number;
  items: ManagerHealthItem[];
}

export interface ZoneCrewPresence {
  zoneId: string;
  zoneName: string;
  loggedToday: number;
  assignedToday: number;
}

export type ZoneStatus = "healthy" | "warning" | "critical";

export interface ManagerZoneOverview {
  zoneId: string;
  zoneName: string;
  areaSqm: number;
  activeCropSeason: string | null;
  cropStage: string | null;
  tasksOpen: number;
  status: ZoneStatus;
  href: string;
}

export interface ManagerDashboardPayload {
  period: DashboardPeriod;
  zonesGlance: ManagerZonesGlance;
  operationsToday: ManagerOperationsToday;
  health: ManagerHealthSummary;
  crewPresence: ZoneCrewPresence[];
  zonesOverview: ManagerZoneOverview[];
  recentLogs: DailyLogResType[];
}

// ── Admin Revenue ─────────────────────────────────────────────────────────
export type RevenueRange = "1d" | "7d" | "30d" | "90d";
export type RevenueLineRange = "30d" | "12m";
export type RevenueSource = "total" | "subscription" | "iot" | "ticket";
export type RevenueTxCategory = "SUBSCRIPTION" | "IOT" | "TICKET";
export type RevenueTxStatus = "PAID" | "OPEN" | "VOID";

export interface RevenueKpis {
  range: RevenueRange;
  total: number;
  subscription: number;
  iot: number;
  ticket: number;
}

export interface RevenueProductSlice {
  name: string;
  value: number;
}

export interface RevenueProductBreakdown {
  range: RevenueRange;
  subscriptionPlans: RevenueProductSlice[];
  iotKits: RevenueProductSlice[];
  ticketPackages: RevenueProductSlice[];
}

export interface RevenueOverviewPayload {
  kpis: RevenueKpis;
  productBreakdown: RevenueProductBreakdown;
}

export interface RevenueTimeseriesPoint {
  label: string;
  value: number;
}

export interface RevenueTimeseriesPayload {
  source: RevenueSource;
  range: RevenueLineRange;
  data: RevenueTimeseriesPoint[];
}

export interface RevenueTransaction {
  id: string;
  invoiceNumber: string;
  category: RevenueTxCategory;
  customer: string;
  amount: number;
  status: RevenueTxStatus;
  paidAt: string | null;
}

export interface PagingMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface RevenueTransactionsPayload {
  data: RevenueTransaction[];
  meta: PagingMeta;
}

export interface RevenueTransactionsQuery {
  range?: RevenueRange;
  category?: RevenueTxCategory;
  search?: string;
  page?: number;
  limit?: number;
}

// ── Admin Doctor Payouts ──────────────────────────────────────────────────
export type PayoutMethod = "BANK" | "EWALLET";
export type PayoutStatus = "PENDING" | "APPROVED" | "PAID" | "REJECTED";

export interface PayoutKpis {
  range: RevenueRange;
  projected: number;
  paid: number;
  requests: number;
  requestsResolved: number;
}

export interface PayoutOverviewPayload {
  kpis: PayoutKpis;
}

export interface PayoutTimeseriesPayload {
  range: RevenueLineRange;
  data: RevenueTimeseriesPoint[];
}

export interface PayoutWithdrawal {
  id: string;
  refNumber: string;
  doctor: string;
  category: PayoutMethod;
  amount: number;
  status: PayoutStatus;
  requestedAt: string;
}

export interface PayoutWithdrawalsPayload {
  data: PayoutWithdrawal[];
  meta: PagingMeta;
}

export interface PayoutWithdrawalsQuery {
  range?: RevenueRange;
  category?: PayoutMethod;
  status?: PayoutStatus;
  search?: string;
  page?: number;
  limit?: number;
}
