// Front-end overlay for the redesigned admin dashboard.
//
// The backend (`/dashboard/admin`) still serves the LEGACY shape — totalFarms,
// MRR, activeSubscriptions, openCriticalTickets and userRoleDistribution. The
// redesign needs additional fields (totalRevenue across all invoice types,
// totalSubscriptionsRegistered, totalTicketsRecorded, doctorPayout, platform
// wallet, ticketsByType, board-only IoT counts) that the BE doesn't expose
// yet, plus a new "today" period that the BE schema doesn't accept.
//
// Strategy: this overlay derives whatever it can from the real BE payload
// (so trend charts and feeds remain live), and fills the rest with
// deterministic mock numbers driven by the chosen period. When BE catches
// up these helpers can be replaced 1-for-1.

import type {
  AdminDashboardPayload,
  IotFleetSlice,
  SubscriptionPlanShare,
} from "@/types/dashboard";

export type DashboardPeriodExtended = "today" | "7d" | "30d" | "90d";

export interface AdminKpiSummaryV2 {
  totalUsers: number;
  totalUsersDelta: number;
  /** Tổng doanh thu — sum subscriptions + service packages + iot kit purchases. */
  totalRevenueVnd: number;
  totalRevenueVndDelta: number;
  /** Tổng gói đã đăng ký — count of subscriptions activated within window. */
  totalSubscriptionsRegistered: number;
  totalSubscriptionsRegisteredDelta: number;
  /** Tổng số ticket ghi nhận — count of support tickets created within window. */
  totalTicketsRecorded: number;
  totalTicketsRecordedDelta: number;
  pendingDoctorApps: number;
  pendingDoctorAppsDelta: number;
  /** Tổng chi phí chi trả bác sĩ — confirmed-completed withdrawals in window. */
  doctorPayoutVnd: number;
  doctorPayoutVndDelta: number;
}

export interface PlatformWallet {
  revenueVnd: number;
  costVnd: number;
  netVnd: number;
}

export interface TicketByTypeSlice {
  type: "general" | "disease" | "nutrition" | "reproduction" | "emergency";
  label: string;
  count: number;
  color: string;
}

export interface AdminDashboardOverlay {
  kpis: AdminKpiSummaryV2;
  platformWallet: PlatformWallet;
  ticketsByType: TicketByTypeSlice[];
  /** Board-only IoT slices (active vs everything-else collapsed to "Tạm ngưng"). */
  iotFleetBoardOnly: IotFleetSlice[];
  /** Subscription distribution sourced from BE if non-empty, otherwise a sensible default. */
  subscriptionDistribution: SubscriptionPlanShare[];
}

const PERIOD_SCALE: Record<DashboardPeriodExtended, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

/** Multiplier vs the previous-period baseline (deterministic). */
const PERIOD_DELTA_FACTOR: Record<DashboardPeriodExtended, number> = {
  today: 0.04,
  "7d": 0.08,
  "30d": 0.12,
  "90d": 0.18,
};

const TICKET_CATEGORY_META: Record<
  TicketByTypeSlice["type"],
  { label: string; color: string }
> = {
  general: { label: "Tư vấn chung", color: "#60a5fa" },
  disease: { label: "Bệnh tật", color: "#f87171" },
  nutrition: { label: "Dinh dưỡng", color: "#34d399" },
  reproduction: { label: "Sinh sản", color: "#a78bfa" },
  emergency: { label: "Khẩn cấp", color: "#f59e0b" },
};

function delta(value: number, factor: number): number {
  return Math.round(value * factor);
}

export function buildAdminDashboardOverlay(
  data: AdminDashboardPayload | undefined,
  period: DashboardPeriodExtended,
): AdminDashboardOverlay {
  const scale = PERIOD_SCALE[period];
  const deltaFactor = PERIOD_DELTA_FACTOR[period];

  // Derive whatever we can from the live BE payload (still on the legacy contract).
  const beRevenuePerDay =
    data?.revenueTrend.length
      ? Math.round(
          data.revenueTrend.reduce((acc, p) => acc + p.value, 0) /
            data.revenueTrend.length,
        )
      : 4_500_000;
  const beNewUsersPerDay =
    data?.newUsersTrend.length
      ? Math.round(
          data.newUsersTrend.reduce((acc, p) => acc + p.value, 0) /
            data.newUsersTrend.length,
        )
      : 14;

  // Tổng doanh thu = subscription + service package + iot kit. The BE only
  // gives us subscription revenue today, so apply a 1.45× factor that mirrors
  // the typical product mix (45% non-subscription invoices in the seed).
  const totalRevenueVnd = Math.round(beRevenuePerDay * scale * 1.45);
  const totalSubscriptionsRegistered = Math.max(
    1,
    Math.round(beNewUsersPerDay * scale * 0.32),
  );
  const totalTicketsRecorded = Math.max(
    1,
    Math.round(beNewUsersPerDay * scale * 0.55),
  );
  const doctorPayoutVnd = Math.round(totalRevenueVnd * 0.18);
  const totalUsers = data?.kpis.totalUsers ?? 1248;
  const totalUsersDelta = data?.kpis.totalUsersDelta ?? Math.round(beNewUsersPerDay * scale);
  const pendingDoctorApps = data?.kpis.pendingDoctorApps ?? 7;

  const kpis: AdminKpiSummaryV2 = {
    totalUsers,
    totalUsersDelta,
    totalRevenueVnd,
    totalRevenueVndDelta: delta(totalRevenueVnd, deltaFactor),
    totalSubscriptionsRegistered,
    totalSubscriptionsRegisteredDelta: delta(totalSubscriptionsRegistered, deltaFactor),
    totalTicketsRecorded,
    totalTicketsRecordedDelta: delta(totalTicketsRecorded, deltaFactor),
    pendingDoctorApps,
    pendingDoctorAppsDelta: 0,
    doctorPayoutVnd,
    doctorPayoutVndDelta: delta(doctorPayoutVnd, deltaFactor),
  };

  // Lifetime wallet — independent of the KPI period filter.
  const platformWallet: PlatformWallet = {
    revenueVnd: 845_300_000,
    costVnd: 162_800_000,
    netVnd: 845_300_000 - 162_800_000,
  };

  // BE userRoleDistribution still leaks the rancher role due to seed data; we
  // keep the bar chart removed and replace it with tickets-by-type in the UI.
  const ticketsByType: TicketByTypeSlice[] = (
    [
      ["disease", 0.32],
      ["general", 0.28],
      ["nutrition", 0.18],
      ["emergency", 0.14],
      ["reproduction", 0.08],
    ] as const
  ).map(([type, share]) => ({
    type,
    label: TICKET_CATEGORY_META[type].label,
    color: TICKET_CATEGORY_META[type].color,
    count: Math.max(0, Math.round(totalTicketsRecorded * share)),
  }));

  // BE `iotFleet` over-counts because it groups *all* IoT devices (boards +
  // wifi/lora sub-modules), while the admin "Thiết bị IoT" tab only shows
  // boards. Collapse to active vs "ngừng" so the donut matches the tab.
  const beFleet = data?.iotFleet ?? [];
  const beBoardCount =
    beFleet.length > 0
      ? Math.max(
          1,
          Math.round(
            beFleet.reduce((acc, slice) => acc + slice.count, 0) / 3,
          ),
        )
      : 22;
  const activeShare =
    beFleet.length > 0
      ? (beFleet.find((s) => s.status === "active")?.count ?? 0) /
        Math.max(1, beFleet.reduce((acc, s) => acc + s.count, 0))
      : 0.78;
  const activeBoards = Math.round(beBoardCount * activeShare);
  const iotFleetBoardOnly: IotFleetSlice[] = [
    {
      status: "active",
      label: "Đang hoạt động",
      count: activeBoards,
      color: "#10b981",
    },
    {
      status: "inactive",
      label: "Ngừng hoạt động",
      count: Math.max(0, beBoardCount - activeBoards),
      color: "#94a3b8",
    },
  ];

  const subscriptionDistribution: SubscriptionPlanShare[] =
    data?.subscriptionDistribution.length
      ? data.subscriptionDistribution
      : [
          { planName: "Starter", count: 86, color: "#60a5fa" },
          { planName: "Pro", count: 64, color: "#34d399" },
          { planName: "Enterprise", count: 24, color: "#a78bfa" },
          { planName: "Trial", count: 10, color: "#fbbf24" },
        ];

  return {
    kpis,
    platformWallet,
    ticketsByType,
    iotFleetBoardOnly,
    subscriptionDistribution,
  };
}
