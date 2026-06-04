// MOCK — replace with React Query hooks (useManagerListAssignedZones,
// useDailyLogTasksToday, useManagerDailyLogsByZones, useListAlerts,
// useManagerListProductionMilestones, useManagerTickets, etc.) when wiring
// real backend data for the manager dashboard.
//
// Manager scope (per BE): zones assigned via zone-member-management;
// per-zone tasks/logs/sensors/devices/tickets visible. Manager does NOT
// see subscription / invoice / doctor data — those belong to the owner.
//
// All numbers deterministic: reload renders identical data.

import type { DailyLogResType } from "@/schemaValidatation/dailyLog";

// ── Section 1: Zones at a glance ─────────────────────────────────────

export interface ManagerZonesGlance {
  assignedZones: number;
  totalAreaSqm: number;
  activeCropSeasons: number;
  /** Số nông dân được phân công vào các tasks trong khu vực mình quản lý */
  farmersReporting: number;
}

export const mockZonesGlance: ManagerZonesGlance = {
  assignedZones: 4,
  totalAreaSqm: 9_800,
  activeCropSeasons: 3,
  farmersReporting: 6,
};

// ── Section 2: Operations today ──────────────────────────────────────

export interface ManagerOperationsToday {
  tasksOpen: number;
  logsSubmitted: number;
  milestonesInProgress: number;
  /** % = logsSubmitted / tasksOpen */
  compliancePct: number;
}

export const mockOperationsToday: ManagerOperationsToday = {
  tasksOpen: 12,
  logsSubmitted: 9,
  milestonesInProgress: 4,
  compliancePct: 75,
};

// ── Section 3a: Health alerts ────────────────────────────────────────

export type HealthSeverity = "critical" | "warning" | "info";

export interface ManagerHealthItem {
  id: string;
  type: "sensor-anomaly" | "ticket" | "device-offline";
  severity: HealthSeverity;
  zoneName: string;
  title: string;
  subtitle: string;
  href: string;
  ageHours: number;
}

export interface ManagerHealthSummary {
  criticalAlerts: number;
  openTickets: number;
  devicesOffline: number;
  items: ManagerHealthItem[];
}

export const mockManagerHealth: ManagerHealthSummary = {
  criticalAlerts: 2,
  openTickets: 2,
  devicesOffline: 1,
  items: [
    {
      id: "alert-1",
      type: "sensor-anomaly",
      severity: "critical",
      zoneName: "Khu A",
      title: "Độ ẩm đất Khu A quá thấp",
      subtitle: "Sensor #SM-014 · 28% (ngưỡng 40-70%)",
      href: "/dashboard/manager/sensor-dashboard",
      ageHours: 1,
    },
    {
      id: "alert-2",
      type: "sensor-anomaly",
      severity: "critical",
      zoneName: "Khu B",
      title: "Nhiệt độ Khu B vượt ngưỡng",
      subtitle: "Sensor #AT-007 · 38°C (ngưỡng 22-32°C)",
      href: "/dashboard/manager/sensor-dashboard",
      ageHours: 4,
    },
    {
      id: "tk-301",
      type: "ticket",
      severity: "warning",
      zoneName: "Khu C",
      title: "TK-301 · Lá chuyển vàng",
      subtitle: "Đang chờ bác sĩ tiếp nhận",
      href: "/dashboard/manager/tickets",
      ageHours: 6,
    },
    {
      id: "tk-298",
      type: "ticket",
      severity: "warning",
      zoneName: "Khu A",
      title: "TK-298 · Sâu rệp cục bộ",
      subtitle: "Bác sĩ đã tiếp nhận, chờ phản hồi",
      href: "/dashboard/manager/tickets",
      ageHours: 22,
    },
    {
      id: "dev-1",
      type: "device-offline",
      severity: "warning",
      zoneName: "Khu D",
      title: "Thiết bị #IOT-022 mất kết nối",
      subtitle: "Offline 3 giờ qua",
      href: "/dashboard/manager/iot-config",
      ageHours: 3,
    },
  ],
};

// ── Section 3b: Crew presence today (per zone) ───────────────────────

export interface ZoneCrewPresence {
  zoneId: string;
  zoneName: string;
  loggedToday: number;
  assignedToday: number;
}

export const mockCrewPresence: ZoneCrewPresence[] = [
  { zoneId: "zone-a", zoneName: "Khu A — Rau ăn lá", loggedToday: 3, assignedToday: 4 },
  { zoneId: "zone-b", zoneName: "Khu B — Cà chua", loggedToday: 2, assignedToday: 3 },
  { zoneId: "zone-c", zoneName: "Khu C — Dưa leo", loggedToday: 2, assignedToday: 2 },
  { zoneId: "zone-d", zoneName: "Khu D — Dâu tây", loggedToday: 2, assignedToday: 3 },
];

// ── Section 4: Zones overview ────────────────────────────────────────

export type ZoneStatus = "healthy" | "warning" | "critical";

export interface ManagerZoneOverview {
  zoneId: string;
  zoneName: string;
  areaSqm: number;
  activeCropSeason: string | null;
  cropStage: string | null; // germination/seedling/growth/harvest
  tasksOpen: number;
  status: ZoneStatus;
  href: string;
}

export const mockZonesOverview: ManagerZoneOverview[] = [
  {
    zoneId: "zone-a",
    zoneName: "Khu A — Rau ăn lá",
    areaSqm: 2_400,
    activeCropSeason: "Xà lách vụ Xuân",
    cropStage: "growth",
    tasksOpen: 4,
    status: "critical",
    href: "/dashboard/manager/crop-seasons?zoneId=zone-a",
  },
  {
    zoneId: "zone-b",
    zoneName: "Khu B — Cà chua",
    areaSqm: 3_100,
    activeCropSeason: "Cà chua vụ 2",
    cropStage: "growth",
    tasksOpen: 3,
    status: "critical",
    href: "/dashboard/manager/crop-seasons?zoneId=zone-b",
  },
  {
    zoneId: "zone-c",
    zoneName: "Khu C — Dưa leo",
    areaSqm: 2_000,
    activeCropSeason: "Dưa leo vụ 1",
    cropStage: "seedling",
    tasksOpen: 2,
    status: "warning",
    href: "/dashboard/manager/crop-seasons?zoneId=zone-c",
  },
  {
    zoneId: "zone-d",
    zoneName: "Khu D — Dâu tây",
    areaSqm: 2_300,
    activeCropSeason: null,
    cropStage: null,
    tasksOpen: 0,
    status: "healthy",
    href: "/dashboard/manager/crop-seasons?zoneId=zone-d",
  },
];

// ── Section 5: Activity feed (recent logs across all my zones) ───────
// Reuses real `DailyLogResType` shape so DailyLogActivityFeed renders it.

const NS = "22222222-2222-2222-2222-";
const uuid = (n: number): string => `${NS}${String(n).padStart(12, "0")}`;

const FARMER_BASE = { email: "farmer@farmos.local", phone: null, avatarUrl: null };

function todayYmd(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export const mockManagerRecentLogs: DailyLogResType[] = [
  {
    id: uuid(1),
    zoneId: "zone-a",
    zone: { id: uuid(101), name: "Khu A — Rau ăn lá" },
    milestoneId: uuid(201),
    employeeTaskId: uuid(301),
    task: { id: uuid(301), title: "Tưới nước sáng", milestoneId: uuid(201) },
    logDate: todayYmd(),
    activities: "Đã tưới đều luống 1-4. Sensor đo ẩm 62%.",
    notes: null,
    loggedBy: uuid(401),
    farmer: { id: uuid(401), fullName: "Phạm Quang Minh", ...FARMER_BASE },
    attachments: [],
    createdAt: isoMinutesAgo(20),
  },
  {
    id: uuid(2),
    zoneId: "zone-b",
    zone: { id: uuid(102), name: "Khu B — Cà chua" },
    milestoneId: uuid(202),
    employeeTaskId: uuid(302),
    task: { id: uuid(302), title: "Phun thuốc trừ sâu", milestoneId: uuid(202) },
    logDate: todayYmd(),
    activities: "Phun đợt định kỳ. Sector 3 và 5 đã hoàn tất.",
    notes: "Phát hiện rệp ở mép sector 5, đã xử lý.",
    loggedBy: uuid(402),
    farmer: { id: uuid(402), fullName: "Lê Đức Anh", ...FARMER_BASE },
    attachments: [],
    createdAt: isoMinutesAgo(70),
  },
  {
    id: uuid(3),
    zoneId: "zone-c",
    zone: { id: uuid(103), name: "Khu C — Dưa leo" },
    milestoneId: uuid(203),
    employeeTaskId: uuid(303),
    task: { id: uuid(303), title: "Bón phân hữu cơ", milestoneId: uuid(203) },
    logDate: todayYmd(),
    activities: "Bón đều theo định lượng 1.8 kg/m². Tổng 180kg.",
    notes: null,
    loggedBy: uuid(403),
    farmer: { id: uuid(403), fullName: "Nguyễn Văn Tài", ...FARMER_BASE },
    attachments: [],
    createdAt: isoMinutesAgo(140),
  },
  {
    id: uuid(4),
    zoneId: "zone-a",
    zone: { id: uuid(101), name: "Khu A — Rau ăn lá" },
    milestoneId: uuid(201),
    employeeTaskId: uuid(304),
    task: { id: uuid(304), title: "Kiểm tra hệ thống tưới", milestoneId: uuid(201) },
    logDate: todayYmd(),
    activities: "Hệ thống vận hành tốt. Áp suất ổn định 1.8 bar.",
    notes: null,
    loggedBy: uuid(404),
    farmer: { id: uuid(404), fullName: "Hoàng Thị Mai", ...FARMER_BASE },
    attachments: [],
    createdAt: isoMinutesAgo(220),
  },
  {
    id: uuid(5),
    zoneId: "zone-b",
    zone: { id: uuid(102), name: "Khu B — Cà chua" },
    milestoneId: uuid(202),
    employeeTaskId: uuid(305),
    task: { id: uuid(305), title: "Cắm cọc đỡ cây", milestoneId: uuid(202) },
    logDate: todayYmd(),
    activities: "Cắm bổ sung 60 cọc cho luống 5-7.",
    notes: "Cần thêm thùng cọc tre tuần sau.",
    loggedBy: uuid(401),
    farmer: { id: uuid(401), fullName: "Phạm Quang Minh", ...FARMER_BASE },
    attachments: [],
    createdAt: isoMinutesAgo(310),
  },
];
