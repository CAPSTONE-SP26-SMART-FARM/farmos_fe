export type TicketStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed"
  | "cancelled";

export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type TicketCategory =
  | "general"
  | "disease"
  | "nutrition"
  | "reproduction"
  | "emergency";

export interface TicketKpi {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  aiResolvedTickets: number;
  avgResolutionHours: number;
  avgSatisfaction: number;
  satisfactionResponses: number;
  resolutionRate: number;
  totalDelta: number;
  resolvedDelta: number;
  avgResolutionDelta: number;
}

export interface StatusDistribution {
  status: TicketStatus;
  label: string;
  count: number;
  color: string;
}

export interface SeverityBreakdown {
  severity: IncidentSeverity;
  label: string;
  count: number;
  color: string;
}

export interface CategoryShare {
  category: TicketCategory;
  label: string;
  count: number;
  color: string;
}

export interface TicketDailyPoint {
  date: string;
  created: number;
  resolved: number;
}

export interface DoctorPerformanceRow {
  doctorId: string;
  doctor: string;
  processing: number;
  resolved: number;
  escalated: number;
  aiFallback: number;
  avgResolutionHours: number;
  satisfaction: number;
}

export interface CriticalTicketRow {
  id: string;
  ticketNumber: string;
  title: string;
  severity: IncidentSeverity;
  status: TicketStatus;
  createdAt: string;
  assignee: string | null;
  farmName: string;
}

export const TICKET_KPI_MOCK: TicketKpi = {
  totalTickets: 312,
  openTickets: 18,
  inProgressTickets: 26,
  resolvedTickets: 245,
  aiResolvedTickets: 41,
  avgResolutionHours: 24.6,
  avgSatisfaction: 4.3,
  satisfactionResponses: 198,
  resolutionRate: 78.5,
  totalDelta: 12.4,
  resolvedDelta: 8.7,
  avgResolutionDelta: -3.1,
};

export const STATUS_DISTRIBUTION_MOCK: StatusDistribution[] = [
  { status: "open", label: "Mở mới", count: 18, color: "#0ea5e9" },
  { status: "assigned", label: "Đã phân công", count: 14, color: "#a855f7" },
  { status: "in_progress", label: "Đang xử lý", count: 26, color: "#f59e0b" },
  { status: "resolved", label: "Đã xử lý", count: 245, color: "#10b981" },
  { status: "closed", label: "Đã đóng", count: 7, color: "#6b7280" },
  { status: "cancelled", label: "Đã huỷ", count: 2, color: "#ef4444" },
];

export const SEVERITY_BREAKDOWN_MOCK: SeverityBreakdown[] = [
  { severity: "low", label: "Thấp", count: 102, color: "#10b981" },
  { severity: "medium", label: "Trung bình", count: 138, color: "#f59e0b" },
  { severity: "high", label: "Cao", count: 56, color: "#f97316" },
  { severity: "critical", label: "Nghiêm trọng", count: 16, color: "#ef4444" },
];

export const CATEGORY_SHARE_MOCK: CategoryShare[] = [
  { category: "disease", label: "Bệnh hại", count: 124, color: "#ef4444" },
  { category: "nutrition", label: "Dinh dưỡng", count: 78, color: "#10b981" },
  { category: "reproduction", label: "Sinh sản", count: 42, color: "#a855f7" },
  { category: "emergency", label: "Khẩn cấp", count: 33, color: "#f59e0b" },
  { category: "general", label: "Chung", count: 35, color: "#6b7280" },
];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function buildDailySeries(): TicketDailyPoint[] {
  const points: TicketDailyPoint[] = [];
  const base = new Date(2026, 2, 1); // 1 March 2026
  const createdPattern = [
    8, 12, 9, 15, 11, 6, 4, 13, 17, 10, 14, 9, 7, 11, 16, 12, 8, 5, 9, 14, 18,
    11, 7, 10, 13, 15, 9, 8, 12, 6,
  ];
  const resolvedPattern = [
    6, 9, 11, 12, 14, 7, 5, 10, 13, 12, 11, 10, 8, 9, 13, 15, 10, 6, 8, 12, 16,
    13, 9, 11, 12, 14, 11, 10, 13, 8,
  ];
  for (let i = 0; i < 30; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    points.push({
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      created: createdPattern[i],
      resolved: resolvedPattern[i],
    });
  }
  return points;
}

export const TICKETS_OVER_TIME_MOCK: TicketDailyPoint[] = buildDailySeries();

export const DOCTOR_PERFORMANCE_MOCK: DoctorPerformanceRow[] = [
  {
    doctorId: "d-001",
    doctor: "BS. Trần Văn A",
    processing: 7,
    resolved: 58,
    escalated: 1,
    aiFallback: 4,
    avgResolutionHours: 21,
    satisfaction: 4.6,
  },
  {
    doctorId: "d-002",
    doctor: "BS. Hoàng Thị B",
    processing: 9,
    resolved: 47,
    escalated: 3,
    aiFallback: 6,
    avgResolutionHours: 27,
    satisfaction: 4.2,
  },
  {
    doctorId: "d-003",
    doctor: "BS. Nguyễn Văn C",
    processing: 6,
    resolved: 39,
    escalated: 2,
    aiFallback: 3,
    avgResolutionHours: 24,
    satisfaction: 4.4,
  },
  {
    doctorId: "d-004",
    doctor: "BS. Lê Thị D",
    processing: 4,
    resolved: 33,
    escalated: 1,
    aiFallback: 2,
    avgResolutionHours: 29,
    satisfaction: 4.1,
  },
  {
    doctorId: "d-005",
    doctor: "BS. Phạm Quang E",
    processing: 5,
    resolved: 28,
    escalated: 0,
    aiFallback: 5,
    avgResolutionHours: 22,
    satisfaction: 4.5,
  },
  {
    doctorId: "d-006",
    doctor: "BS. Vũ Thị F",
    processing: 3,
    resolved: 19,
    escalated: 1,
    aiFallback: 1,
    avgResolutionHours: 26,
    satisfaction: 4.0,
  },
];

export const CRITICAL_TICKETS_MOCK: CriticalTicketRow[] = [
  {
    id: "t-9281",
    ticketNumber: "INC-2026-0428",
    title: "Đàn gà đẻ giảm ăn đồng loạt, có dấu hiệu sốt cao",
    severity: "critical",
    status: "in_progress",
    createdAt: "2026-04-26T08:14:00Z",
    assignee: "BS. Trần Văn A",
    farmName: "Trang trại Long An #2",
  },
  {
    id: "t-9275",
    ticketNumber: "INC-2026-0427",
    title: "Cá tra chết rải rác ở ao số 3",
    severity: "critical",
    status: "assigned",
    createdAt: "2026-04-25T22:03:00Z",
    assignee: "BS. Hoàng Thị B",
    farmName: "Trang trại An Giang",
  },
  {
    id: "t-9268",
    ticketNumber: "INC-2026-0426",
    title: "Sầu riêng vàng lá hàng loạt, nghi tuyến trùng",
    severity: "high",
    status: "in_progress",
    createdAt: "2026-04-25T14:41:00Z",
    assignee: "BS. Nguyễn Văn C",
    farmName: "Vườn sầu riêng Đắk Lắk",
  },
  {
    id: "t-9262",
    ticketNumber: "INC-2026-0425",
    title: "Hệ thống tưới hỏng đồng loạt khu B",
    severity: "high",
    status: "open",
    createdAt: "2026-04-25T09:28:00Z",
    assignee: null,
    farmName: "Trang trại rau Lâm Đồng",
  },
  {
    id: "t-9255",
    ticketNumber: "INC-2026-0424",
    title: "Bò sữa giảm sản lượng, nghi viêm vú",
    severity: "high",
    status: "resolved",
    createdAt: "2026-04-24T17:55:00Z",
    assignee: "BS. Lê Thị D",
    farmName: "Trại bò sữa Mộc Châu",
  },
];
