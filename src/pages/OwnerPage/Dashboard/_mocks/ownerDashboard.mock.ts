// MOCK — replace with React Query hooks (useOwnerGetMyFarm, useOwnerListZones,
// useOwnerListCropSeasons, useOwnerListFarmMembers, useOwnerMySubscription,
// useOwnerCredits, useOwnerInvoices, useOwnerGetListDoctor, useDailyLogTasksToday,
// useOwnerDailyLogsByFarm, useListAlerts, useOwnerTickets, useOwnerListIotDevices)
// when the owner dashboard is wired to real backend.
//
// All numbers deterministic so reload renders identical data (no random per render).

import type { DailyLogResType } from "@/schemaValidatation/dailyLog";

// ── Section 1: Farm at a glance ──────────────────────────────────────

export interface FarmGlance {
  farmName: string;
  totalAreaSqm: number;
  zonesCount: number;
  activeCropSeasons: number;
  managers: number;
  farmers: number;
  /** Tỉ lệ phủ vùng = sum(zone area) / farm area */
  zoneCoveragePct: number;
}

export const mockFarmGlance: FarmGlance = {
  farmName: "Nông Trại Tâm An",
  totalAreaSqm: 18_500,
  zonesCount: 6,
  activeCropSeasons: 3,
  managers: 2,
  farmers: 8,
  zoneCoveragePct: 72,
};

// ── Section 2: Operations today ──────────────────────────────────────

export interface OperationsToday {
  tasksOpen: number;
  logsSubmitted: number;
  milestonesInProgress: number;
  /** % = logsSubmitted / tasksOpen (capped at 100) */
  compliancePct: number;
}

export const mockOperationsToday: OperationsToday = {
  tasksOpen: 18,
  logsSubmitted: 14,
  milestonesInProgress: 5,
  compliancePct: 78,
};

// ── Section 3: Health & alerts ───────────────────────────────────────

export type HealthSeverity = "critical" | "warning" | "info";

export interface HealthItem {
  id: string;
  type: "sensor-anomaly" | "ticket" | "device-offline";
  severity: HealthSeverity;
  title: string;
  subtitle: string;
  href: string;
  ageHours: number;
}

export interface HealthSummary {
  criticalAlerts: number;
  openTickets: number;
  devicesOffline: number;
  items: HealthItem[];
}

export const mockHealth: HealthSummary = {
  criticalAlerts: 2,
  openTickets: 3,
  devicesOffline: 1,
  items: [
    {
      id: "alert-1",
      type: "sensor-anomaly",
      severity: "critical",
      title: "Độ ẩm đất Khu A vượt ngưỡng",
      subtitle: "Sensor #SM-014 · 32% (ngưỡng 40-70%)",
      href: "/dashboard/owner/sensor-dashboard",
      ageHours: 2,
    },
    {
      id: "alert-2",
      type: "sensor-anomaly",
      severity: "critical",
      title: "Nhiệt độ Khu B quá cao",
      subtitle: "Sensor #AT-007 · 38°C (ngưỡng 22-32°C)",
      href: "/dashboard/owner/sensor-dashboard",
      ageHours: 5,
    },
    {
      id: "tk-201",
      type: "ticket",
      severity: "warning",
      title: "TK-201 · Lá vàng bất thường",
      subtitle: "Khu C · Đang chờ bác sĩ",
      href: "/dashboard/owner/tickets",
      ageHours: 8,
    },
    {
      id: "tk-198",
      type: "ticket",
      severity: "warning",
      title: "TK-198 · Sâu bệnh cục bộ",
      subtitle: "Khu A · Đã được bác sĩ tiếp nhận",
      href: "/dashboard/owner/tickets",
      ageHours: 26,
    },
    {
      id: "tk-195",
      type: "ticket",
      severity: "info",
      title: "TK-195 · Tư vấn dinh dưỡng",
      subtitle: "Khu D · Đang tiếp nhận",
      href: "/dashboard/owner/tickets",
      ageHours: 50,
    },
    {
      id: "dev-1",
      type: "device-offline",
      severity: "warning",
      title: "Thiết bị #IOT-012 mất kết nối",
      subtitle: "Khu B · Offline 4 giờ qua",
      href: "/dashboard/owner/iot-devices",
      ageHours: 4,
    },
  ],
};

// ── Section 4: Money — subscription, credits, latest invoice ─────────

export interface SubscriptionStatusMock {
  planName: string;
  status: "active" | "expiring" | "expired";
  daysRemaining: number;
  autoRenew: boolean;
  currentPeriodEnd: string; // ISO
  monthlyPriceVnd: number;
}

export interface CreditBalanceMock {
  doctorCredits: number;
  ticketCredits: number;
}

export interface LatestInvoiceMock {
  invoiceCode: string;
  amountVnd: number;
  status: "paid" | "open" | "overdue";
  issuedAt: string; // ISO
}

export const mockSubscription: SubscriptionStatusMock = {
  planName: "Pro",
  status: "active",
  daysRemaining: 18,
  autoRenew: true,
  currentPeriodEnd: new Date(
    Date.now() + 18 * 24 * 60 * 60 * 1000,
  ).toISOString(),
  monthlyPriceVnd: 1_500_000,
};

export const mockCredits: CreditBalanceMock = {
  doctorCredits: 12,
  ticketCredits: 25,
};

export const mockLatestInvoice: LatestInvoiceMock = {
  invoiceCode: "INV-1024",
  amountVnd: 1_500_000,
  status: "paid",
  issuedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
};

// ── Section 5: Charts — monthly spend, role distribution ─────────────

export interface DailyPoint {
  date: string; // yyyy-MM-dd
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
    const dayOfYear =
      Math.floor(
        (d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 0)) /
          (1000 * 60 * 60 * 24),
      ) % 365;
    const noise = Math.sin(dayOfYear * 0.7) * amplitude;
    const value = Math.max(0, Math.round(base + trend * (days - i) + noise));
    out.push({ date: ymd, value });
  }
  return out;
}

/** Chi tiêu 30 ngày của owner — tổng cộng các invoices đã trả. */
export const mockMonthlySpend: DailyPoint[] = buildSeries(
  30,
  120_000,
  60_000,
  2_500,
);

export interface RoleShare {
  role: "manager" | "farmer";
  label: string;
  count: number;
  color: string;
}

export const mockRoleDistribution: RoleShare[] = [
  { role: "manager", label: "Quản lý", count: 2, color: "#60a5fa" },
  { role: "farmer", label: "Nông dân", count: 8, color: "#34d399" },
];

// ── Section 6: People — doctors + recent activity ────────────────────

export interface DoctorMock {
  id: string;
  fullName: string;
  specialty: string;
  avatarUrl: string | null;
  status: "active" | "busy";
}

export const mockDoctors: DoctorMock[] = [
  {
    id: "doc-1",
    fullName: "Bs. Nguyễn Thị Lan",
    specialty: "Bảo vệ thực vật",
    avatarUrl: null,
    status: "active",
  },
  {
    id: "doc-2",
    fullName: "Bs. Trần Văn Hùng",
    specialty: "Trồng trọt",
    avatarUrl: null,
    status: "busy",
  },
  {
    id: "doc-3",
    fullName: "Bs. Lê Thu Hà",
    specialty: "Dinh dưỡng cây trồng",
    avatarUrl: null,
    status: "active",
  },
];

// Recent activity feed — typed against DailyLogResType for trivial swap later.

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function todayYmd(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

const MOCK_FARMER_BASE = {
  email: "farmer@farmos.local",
  phone: null,
  avatarUrl: null,
};

export const mockRecentLogs: DailyLogResType[] = [
  {
    id: "log-1",
    zoneId: "zone-a",
    zone: { id: "zone-a", name: "Khu A" },
    milestoneId: "ms-1",
    employeeTaskId: "task-1",
    task: { id: "task-1", title: "Tưới nước sáng", milestoneId: "ms-1" },
    logDate: todayYmd(),
    activities: "Đã tưới đều khắp luống 1-4. Đất ẩm tốt.",
    notes: null,
    loggedBy: "farmer-1",
    farmer: {
      id: "farmer-1",
      fullName: "Phạm Quang Minh",
      ...MOCK_FARMER_BASE,
    },
    createdAt: isoMinutesAgo(15),
  },
  {
    id: "log-2",
    zoneId: "zone-b",
    zone: { id: "zone-b", name: "Khu B" },
    milestoneId: "ms-2",
    employeeTaskId: "task-2",
    task: { id: "task-2", title: "Phun thuốc trừ sâu", milestoneId: "ms-2" },
    logDate: todayYmd(),
    activities: "Phun đều theo liều khuyến nghị, sector 3 và 5.",
    notes: "Phát hiện rệp ở mép sector 5, đã xử lý.",
    loggedBy: "farmer-2",
    farmer: {
      id: "farmer-2",
      fullName: "Lê Đức Anh",
      ...MOCK_FARMER_BASE,
    },
    createdAt: isoMinutesAgo(85),
  },
  {
    id: "log-3",
    zoneId: "zone-a",
    zone: { id: "zone-a", name: "Khu A" },
    milestoneId: "ms-1",
    employeeTaskId: "task-3",
    task: { id: "task-3", title: "Kiểm tra hệ thống tưới", milestoneId: "ms-1" },
    logDate: todayYmd(),
    activities: "Hệ thống vận hành tốt. Áp suất ổn định.",
    notes: null,
    loggedBy: "farmer-3",
    farmer: {
      id: "farmer-3",
      fullName: "Nguyễn Văn Tài",
      ...MOCK_FARMER_BASE,
    },
    createdAt: isoMinutesAgo(180),
  },
  {
    id: "log-4",
    zoneId: "zone-c",
    zone: { id: "zone-c", name: "Khu C" },
    milestoneId: "ms-3",
    employeeTaskId: "task-4",
    task: { id: "task-4", title: "Bón phân hữu cơ", milestoneId: "ms-3" },
    logDate: todayYmd(),
    activities: "Đã bón đều theo định lượng 2kg/m². Tổng 240kg.",
    notes: null,
    loggedBy: "farmer-4",
    farmer: {
      id: "farmer-4",
      fullName: "Hoàng Thị Mai",
      ...MOCK_FARMER_BASE,
    },
    createdAt: isoMinutesAgo(260),
  },
  {
    id: "log-5",
    zoneId: "zone-d",
    zone: { id: "zone-d", name: "Khu D" },
    milestoneId: "ms-4",
    employeeTaskId: "task-5",
    task: { id: "task-5", title: "Thu hoạch lứa 1", milestoneId: "ms-4" },
    logDate: todayYmd(),
    activities: "Thu được 78kg rau sạch. Phân loại và đóng gói xong.",
    notes: "Sản lượng vượt kỳ vọng ~10%.",
    loggedBy: "farmer-1",
    farmer: {
      id: "farmer-1",
      fullName: "Phạm Quang Minh",
      ...MOCK_FARMER_BASE,
    },
    createdAt: isoMinutesAgo(340),
  },
];
