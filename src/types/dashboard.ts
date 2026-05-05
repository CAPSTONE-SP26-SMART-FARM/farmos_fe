// Dashboard API response types — mirrors BE dashboard.model.ts Zod schemas.
// Components import from here instead of the _mocks files.

import type { DailyLogResType } from "@/schemaValidatation/dailyLog";

// ── Shared ────────────────────────────────────────────────────────────────

export type DashboardPeriod = "7d" | "30d" | "90d";

export interface DailyPoint {
  date: string; // yyyy-MM-dd UTC
  value: number;
}

// ── Admin ─────────────────────────────────────────────────────────────────

export interface AdminKpiSummary {
  totalUsers: number;
  totalUsersDelta: number;
  totalFarms: number;
  totalFarmsDelta: number;
  activeSubscriptions: number;
  activeSubscriptionsDelta: number;
  mrrVnd: number;
  mrrVndDelta: number;
  pendingDoctorApps: number;
  openCriticalTickets: number;
}

export type ActionQueueItemType =
  | "doctor-application"
  | "overdue-invoice"
  | "critical-ticket";

export interface ActionQueueItem {
  id: string;
  type: ActionQueueItemType;
  title: string;
  subtitle: string;
  href: string;
  ageHours: number;
}

export type ActivityType =
  | "user-signup"
  | "farm-created"
  | "payment-received"
  | "doctor-approved"
  | "subscription-cancelled";

export interface AdminActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  createdAt: string;
}

export interface SubscriptionPlanShare {
  planName: string;
  count: number;
  color: string;
}

export interface UserRoleShare {
  role: "admin" | "owner" | "manager" | "farmer" | "rancher" | "doctor";
  label: string;
  count: number;
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
  actionQueue: {
    pendingDoctorApps: ActionQueueItem[];
    overdueInvoices: ActionQueueItem[];
    criticalTickets: ActionQueueItem[];
  };
  activityFeed: AdminActivityItem[];
  revenueTrend: DailyPoint[];
  newUsersTrend: DailyPoint[];
  subscriptionDistribution: SubscriptionPlanShare[];
  userRoleDistribution: UserRoleShare[];
  iotFleet: IotFleetSlice[];
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
  monthlySpend: DailyPoint[];
  roleDistribution: OwnerRoleShare[];
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
