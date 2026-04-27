// MOCK — replace with React Query hooks when admin analytics endpoints
// are ready. All numbers are deterministic so the dashboard renders the
// same data on every reload (no random per render → no hydration drift).

import { RoleName, type RoleNameType } from "@/constants/role";

// ── KPI strip ─────────────────────────────────────────────────────────

export interface AdminKpiSummary {
  totalUsers: number;
  totalUsersDelta: number; // delta vs previous period
  totalFarms: number;
  totalFarmsDelta: number;
  activeSubscriptions: number;
  activeSubscriptionsDelta: number;
  mrrVnd: number;
  mrrVndDelta: number;
  pendingDoctorApps: number;
  openCriticalTickets: number;
}

export const mockKpis: AdminKpiSummary = {
  totalUsers: 1248,
  totalUsersDelta: 86,
  totalFarms: 312,
  totalFarmsDelta: 18,
  activeSubscriptions: 184,
  activeSubscriptionsDelta: 9,
  mrrVnd: 142_500,
  mrrVndDelta: 8_400_000,
  pendingDoctorApps: 7,
  openCriticalTickets: 4,
};

// ── Trends (30-day series) ────────────────────────────────────────────

export interface DailyPoint {
  date: string; // yyyy-MM-dd UTC
  value: number;
}

function buildSeries(
  days: number,
  base: number,
  amplitude: number,
  trend: number,
): DailyPoint[] {
  const today = new Date();
  const out: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const ymd = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    // Deterministic noise via sin of day-of-year
    const dayOfYear =
      Math.floor(
        (d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 0)) /
          (1000 * 60 * 60 * 24),
      ) % 365;
    const noise = Math.sin(dayOfYear * 0.65) * amplitude;
    const value = Math.max(0, Math.round(base + trend * (days - i) + noise));
    out.push({ date: ymd, value });
  }
  return out;
}

export const mockRevenueTrend: DailyPoint[] = buildSeries(
  30,
  4_500_000,
  900_000,
  35_000,
);

export const mockNewUsersTrend: DailyPoint[] = buildSeries(30, 14, 6, 0.4);

// ── Distribution snapshots ────────────────────────────────────────────

export interface SubscriptionPlanShare {
  planName: string;
  count: number;
  color: string; // tailwind hex (chart needs hex, not class)
}

export const mockSubscriptionDistribution: SubscriptionPlanShare[] = [
  { planName: "Starter", count: 86, color: "#60a5fa" },
  { planName: "Pro", count: 64, color: "#34d399" },
  { planName: "Enterprise", count: 24, color: "#a78bfa" },
  { planName: "Trial", count: 10, color: "#fbbf24" },
];

export interface UserRoleShare {
  role: RoleNameType;
  label: string;
  count: number;
}

export const mockUserRoleDistribution: UserRoleShare[] = [
  { role: RoleName.Owner, label: "Chủ vườn", count: 312 },
  { role: RoleName.Manager, label: "Quản lý", count: 148 },
  { role: RoleName.Farmer, label: "Nông dân", count: 712 },
  { role: RoleName.Doctor, label: "Bác sĩ", count: 64 },
  { role: RoleName.Admin, label: "Quản trị", count: 12 },
];

export type DeviceFleetStatus =
  | "active"
  | "inactive"
  | "maintenance"
  | "decommissioned";

export interface IotFleetSlice {
  status: DeviceFleetStatus;
  label: string;
  count: number;
  color: string;
}

export const mockIotFleet: IotFleetSlice[] = [
  { status: "active", label: "Đang hoạt động", count: 412, color: "#10b981" },
  { status: "inactive", label: "Tạm ngưng", count: 38, color: "#94a3b8" },
  { status: "maintenance", label: "Bảo trì", count: 21, color: "#f59e0b" },
  {
    status: "decommissioned",
    label: "Ngừng sử dụng",
    count: 14,
    color: "#ef4444",
  },
];

// ── Action queue ──────────────────────────────────────────────────────

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

export const mockActionQueue: {
  pendingDoctorApps: ActionQueueItem[];
  overdueInvoices: ActionQueueItem[];
  criticalTickets: ActionQueueItem[];
} = {
  pendingDoctorApps: [
    {
      id: "doc-app-1",
      type: "doctor-application",
      title: "Bs. Nguyễn Thị Lan",
      subtitle: "Bác sĩ thú y · 8 năm kinh nghiệm",
      href: "/dashboard/admin/doctor-applications",
      ageHours: 5,
    },
    {
      id: "doc-app-2",
      type: "doctor-application",
      title: "Bs. Trần Văn Hùng",
      subtitle: "Trồng trọt · 12 năm kinh nghiệm",
      href: "/dashboard/admin/doctor-applications",
      ageHours: 22,
    },
    {
      id: "doc-app-3",
      type: "doctor-application",
      title: "Bs. Lê Thu Hà",
      subtitle: "Bảo vệ thực vật · 6 năm kinh nghiệm",
      href: "/dashboard/admin/doctor-applications",
      ageHours: 38,
    },
  ],
  overdueInvoices: [
    {
      id: "inv-1024",
      type: "overdue-invoice",
      title: "Hoá đơn #INV-1024",
      subtitle: "Pro Plan · 1.500.000 ₫ · Quá hạn 4 ngày",
      href: "/dashboard/admin/invoices",
      ageHours: 96,
    },
    {
      id: "inv-1019",
      type: "overdue-invoice",
      title: "Hoá đơn #INV-1019",
      subtitle: "Starter Plan · 480.000 ₫ · Quá hạn 7 ngày",
      href: "/dashboard/admin/invoices",
      ageHours: 168,
    },
  ],
  criticalTickets: [
    {
      id: "tk-501",
      type: "critical-ticket",
      title: "TK-501 · Sâu bệnh diện rộng",
      subtitle: "Trang trại Tâm An · Khu A · Mức nghiêm trọng",
      href: "/dashboard/admin/ticket-analytics",
      ageHours: 3,
    },
    {
      id: "tk-498",
      type: "critical-ticket",
      title: "TK-498 · Cảm biến mất kết nối",
      subtitle: "Trang trại Hoa Mai · 12 thiết bị offline",
      href: "/dashboard/admin/ticket-analytics",
      ageHours: 9,
    },
  ],
};

// ── Activity feed ─────────────────────────────────────────────────────

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
  /** ISO datetime — relative time computed at render */
  createdAt: string;
}

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export const mockActivityFeed: AdminActivityItem[] = [
  {
    id: "act-1",
    type: "payment-received",
    title: "Thanh toán 1.500.000 ₫",
    subtitle: "Pro Plan · Trang trại Hoa Mai",
    createdAt: isoMinutesAgo(8),
  },
  {
    id: "act-2",
    type: "user-signup",
    title: "Người dùng mới",
    subtitle: "Phạm Quang Minh · vai trò Chủ vườn",
    createdAt: isoMinutesAgo(22),
  },
  {
    id: "act-3",
    type: "doctor-approved",
    title: "Duyệt bác sĩ",
    subtitle: "Bs. Vũ Hồng Quân được kích hoạt",
    createdAt: isoMinutesAgo(45),
  },
  {
    id: "act-4",
    type: "farm-created",
    title: "Trang trại mới",
    subtitle: "Tâm An Farm · 12.500 m²",
    createdAt: isoMinutesAgo(120),
  },
  {
    id: "act-5",
    type: "payment-received",
    title: "Thanh toán 480.000 ₫",
    subtitle: "Starter Plan · Trang trại Bình An",
    createdAt: isoMinutesAgo(180),
  },
  {
    id: "act-6",
    type: "subscription-cancelled",
    title: "Huỷ đăng ký",
    subtitle: "Trial Plan · Trang trại Thanh Lan",
    createdAt: isoMinutesAgo(245),
  },
  {
    id: "act-7",
    type: "user-signup",
    title: "Người dùng mới",
    subtitle: "Lê Đức Anh · vai trò Quản lý",
    createdAt: isoMinutesAgo(310),
  },
  {
    id: "act-8",
    type: "farm-created",
    title: "Trang trại mới",
    subtitle: "Vườn Sen · 4.200 m²",
    createdAt: isoMinutesAgo(420),
  },
];
