// MOCK — replace with `useOwnerDailyLogsByFarm(farmId, query)` from
// `@/queries/useDailyLog` when wiring real backend data.
//
// All entries are typed against the real `DailyLogResType` (mirrors BE
// `daily-log.model.ts` Zod schema) so swapping mock → live is a one-import
// change.
//
// 22 entries spanning the last 14 calendar days (UTC) — enough to demo:
//   • date range filter (fromDate / toDate)
//   • pagination (limit 10 → 3 pages)
//   • multiple farmers, zones, milestones, with/without notes

import type { DailyLogResType } from "@/schemaValidatation/dailyLog";

// ── Stable fake UUIDs ────────────────────────────────────────────────
//
// Using a fixed namespace keeps every render identical (no random),
// avoiding hydration drift and making snapshot debugging easier.

const NS = "11111111-1111-1111-1111-";
const uuid = (n: number): string => `${NS}${String(n).padStart(12, "0")}`;

// ── Reference entities ───────────────────────────────────────────────

const ZONES = {
  A: { id: uuid(101), name: "Khu A — Rau ăn lá" },
  B: { id: uuid(102), name: "Khu B — Cà chua" },
  C: { id: uuid(103), name: "Khu C — Dưa leo" },
  D: { id: uuid(104), name: "Khu D — Dâu tây" },
};

const MILESTONES = {
  M1: uuid(201),
  M2: uuid(202),
  M3: uuid(203),
  M4: uuid(204),
};

const FARMERS = [
  {
    id: uuid(301),
    fullName: "Phạm Quang Minh",
    email: "minh.pham@farmos.local",
    phone: "0901 234 567",
    avatarUrl: null,
  },
  {
    id: uuid(302),
    fullName: "Lê Đức Anh",
    email: "anh.le@farmos.local",
    phone: "0902 345 678",
    avatarUrl: null,
  },
  {
    id: uuid(303),
    fullName: "Nguyễn Văn Tài",
    email: "tai.nguyen@farmos.local",
    phone: "0903 456 789",
    avatarUrl: null,
  },
  {
    id: uuid(304),
    fullName: "Hoàng Thị Mai",
    email: "mai.hoang@farmos.local",
    phone: "0904 567 890",
    avatarUrl: null,
  },
  {
    id: uuid(305),
    fullName: "Trần Bích Ngọc",
    email: "ngoc.tran@farmos.local",
    phone: "0905 678 901",
    avatarUrl: null,
  },
] as const;

// ── Date helpers (UTC) ───────────────────────────────────────────────

function ymdUtc(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function isoUtc(daysAgo: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

// ── Compact builder ──────────────────────────────────────────────────

interface MockLogInput {
  seq: number; // unique sequence for stable id
  daysAgo: number;
  hour: number;
  minute?: number;
  zone: keyof typeof ZONES;
  milestone: keyof typeof MILESTONES;
  taskTitle: string;
  taskSeq: number; // unique per task; stable id
  farmerIdx: number; // 0..4 in FARMERS
  activities: string;
  notes?: string | null;
}

function buildLog(input: MockLogInput): DailyLogResType {
  const farmer = FARMERS[input.farmerIdx];
  const zone = ZONES[input.zone];
  const milestoneId = MILESTONES[input.milestone];
  const taskId = uuid(400 + input.taskSeq);
  return {
    id: uuid(500 + input.seq),
    zoneId: zone.id,
    zone: { id: zone.id, name: zone.name },
    milestoneId,
    employeeTaskId: taskId,
    task: { id: taskId, title: input.taskTitle, milestoneId },
    logDate: ymdUtc(input.daysAgo),
    activities: input.activities,
    notes: input.notes ?? null,
    loggedBy: farmer.id,
    farmer: {
      id: farmer.id,
      fullName: farmer.fullName,
      email: farmer.email,
      phone: farmer.phone,
      avatarUrl: farmer.avatarUrl,
    },
    createdAt: isoUtc(input.daysAgo, input.hour, input.minute ?? 0),
  };
}

// ── 22 logs over last 14 days, sorted newest first by createdAt ──────

const RAW: MockLogInput[] = [
  // Today (4 logs)
  {
    seq: 1,
    daysAgo: 0,
    hour: 7,
    minute: 30,
    zone: "A",
    milestone: "M1",
    taskTitle: "Tưới nước sáng",
    taskSeq: 1,
    farmerIdx: 0,
    activities: "Đã tưới đều khắp luống 1-4. Đất ẩm tốt.",
  },
  {
    seq: 2,
    daysAgo: 0,
    hour: 8,
    minute: 15,
    zone: "B",
    milestone: "M2",
    taskTitle: "Phun thuốc trừ sâu",
    taskSeq: 2,
    farmerIdx: 1,
    activities: "Phun đều theo liều khuyến nghị, sector 3 và 5.",
    notes: "Phát hiện rệp ở mép sector 5, đã xử lý cục bộ.",
  },
  {
    seq: 3,
    daysAgo: 0,
    hour: 10,
    minute: 0,
    zone: "C",
    milestone: "M3",
    taskTitle: "Bón phân hữu cơ",
    taskSeq: 3,
    farmerIdx: 3,
    activities: "Đã bón đều theo định lượng 2kg/m². Tổng 240kg.",
  },
  {
    seq: 4,
    daysAgo: 0,
    hour: 14,
    minute: 20,
    zone: "D",
    milestone: "M4",
    taskTitle: "Thu hoạch lứa 1",
    taskSeq: 4,
    farmerIdx: 4,
    activities: "Thu được 78kg dâu tây. Phân loại và đóng gói xong.",
    notes: "Sản lượng vượt kỳ vọng ~10%.",
  },
  // 1 day ago (2 logs)
  {
    seq: 5,
    daysAgo: 1,
    hour: 7,
    minute: 45,
    zone: "A",
    milestone: "M1",
    taskTitle: "Tưới nước sáng",
    taskSeq: 1,
    farmerIdx: 2,
    activities: "Tưới sector 1-4. Sensor đo ẩm 65%.",
  },
  {
    seq: 6,
    daysAgo: 1,
    hour: 16,
    minute: 0,
    zone: "B",
    milestone: "M2",
    taskTitle: "Kiểm tra hệ thống tưới",
    taskSeq: 5,
    farmerIdx: 0,
    activities: "Hệ thống nhỏ giọt vận hành bình thường ở áp 1.8 bar.",
    notes: "Van số 7 hơi rỉ — đặt kế hoạch thay tuần sau.",
  },
  // 2 days ago (2 logs)
  {
    seq: 7,
    daysAgo: 2,
    hour: 8,
    minute: 0,
    zone: "C",
    milestone: "M3",
    taskTitle: "Làm cỏ luống",
    taskSeq: 6,
    farmerIdx: 3,
    activities: "Làm sạch cỏ dại luống 1 đến luống 6.",
  },
  {
    seq: 8,
    daysAgo: 2,
    hour: 11,
    minute: 30,
    zone: "D",
    milestone: "M4",
    taskTitle: "Cắt tỉa lá già",
    taskSeq: 7,
    farmerIdx: 4,
    activities: "Cắt bỏ lá vàng và lá già toàn bộ luống dâu.",
  },
  // 3 days ago (2 logs)
  {
    seq: 9,
    daysAgo: 3,
    hour: 7,
    minute: 50,
    zone: "A",
    milestone: "M1",
    taskTitle: "Tưới nước sáng",
    taskSeq: 1,
    farmerIdx: 0,
    activities: "Tưới luống 1-4 trong 25 phút.",
  },
  {
    seq: 10,
    daysAgo: 3,
    hour: 15,
    minute: 0,
    zone: "B",
    milestone: "M2",
    taskTitle: "Cắm cọc đỡ cây",
    taskSeq: 8,
    farmerIdx: 1,
    activities: "Cắm bổ sung cọc và buộc dây cho 60 cây cà chua.",
    notes: "Cần thêm 1 thùng cọc tre cho tuần sau.",
  },
  // 4 days ago (2 logs)
  {
    seq: 11,
    daysAgo: 4,
    hour: 9,
    minute: 0,
    zone: "C",
    milestone: "M3",
    taskTitle: "Phun phân lá",
    taskSeq: 9,
    farmerIdx: 2,
    activities: "Phun phân lá NPK 20-20-20 toàn khu C.",
  },
  {
    seq: 12,
    daysAgo: 4,
    hour: 13,
    minute: 30,
    zone: "D",
    milestone: "M4",
    taskTitle: "Kiểm tra sâu bệnh",
    taskSeq: 10,
    farmerIdx: 4,
    activities: "Kiểm tra toàn luống dâu, không phát hiện bất thường.",
  },
  // 5 days ago (2 logs)
  {
    seq: 13,
    daysAgo: 5,
    hour: 7,
    minute: 30,
    zone: "A",
    milestone: "M1",
    taskTitle: "Tưới nước sáng",
    taskSeq: 1,
    farmerIdx: 0,
    activities: "Tưới luống 1-4. Đất hơi khô do trời nắng to.",
    notes: "Tăng tần suất tưới lên 2 lần/ngày tuần này.",
  },
  {
    seq: 14,
    daysAgo: 5,
    hour: 14,
    minute: 0,
    zone: "B",
    milestone: "M2",
    taskTitle: "Phun thuốc trừ sâu",
    taskSeq: 2,
    farmerIdx: 1,
    activities: "Phun đợt 2 theo định kỳ 7 ngày.",
  },
  // 6 days ago (1 log)
  {
    seq: 15,
    daysAgo: 6,
    hour: 10,
    minute: 0,
    zone: "C",
    milestone: "M3",
    taskTitle: "Làm cỏ luống",
    taskSeq: 6,
    farmerIdx: 3,
    activities: "Làm cỏ luống 7-12.",
  },
  // 7 days ago (2 logs)
  {
    seq: 16,
    daysAgo: 7,
    hour: 8,
    minute: 0,
    zone: "A",
    milestone: "M1",
    taskTitle: "Bón phân hữu cơ",
    taskSeq: 3,
    farmerIdx: 2,
    activities: "Bón phân chuồng hoai 1.5kg/m² toàn khu A.",
  },
  {
    seq: 17,
    daysAgo: 7,
    hour: 11,
    minute: 30,
    zone: "D",
    milestone: "M4",
    taskTitle: "Thu hoạch tỉa thưa",
    taskSeq: 11,
    farmerIdx: 4,
    activities: "Thu tỉa thưa quả nhỏ và quả hỏng. ~12kg loại bỏ.",
  },
  // 9 days ago (1 log)
  {
    seq: 18,
    daysAgo: 9,
    hour: 9,
    minute: 0,
    zone: "B",
    milestone: "M2",
    taskTitle: "Cắt tỉa cành phụ",
    taskSeq: 12,
    farmerIdx: 1,
    activities: "Tỉa cành phụ và lá ngọn cho luống cà chua.",
  },
  // 10 days ago (2 logs)
  {
    seq: 19,
    daysAgo: 10,
    hour: 7,
    minute: 30,
    zone: "A",
    milestone: "M1",
    taskTitle: "Tưới nước sáng",
    taskSeq: 1,
    farmerIdx: 0,
    activities: "Tưới luống 1-4. Hoàn tất trong 30 phút.",
  },
  {
    seq: 20,
    daysAgo: 10,
    hour: 13,
    minute: 0,
    zone: "C",
    milestone: "M3",
    taskTitle: "Phun phân lá",
    taskSeq: 9,
    farmerIdx: 3,
    activities: "Phun phân lá theo lịch định kỳ.",
  },
  // 12 days ago (1 log)
  {
    seq: 21,
    daysAgo: 12,
    hour: 8,
    minute: 30,
    zone: "D",
    milestone: "M4",
    taskTitle: "Kiểm tra hệ thống tưới",
    taskSeq: 5,
    farmerIdx: 4,
    activities: "Kiểm tra đầu nhỏ giọt và áp lực ổ dưới.",
    notes: "2 đầu nhỏ giọt bị tắc, đã thay mới.",
  },
  // 13 days ago (1 log)
  {
    seq: 22,
    daysAgo: 13,
    hour: 9,
    minute: 0,
    zone: "B",
    milestone: "M2",
    taskTitle: "Bón phân hữu cơ",
    taskSeq: 3,
    farmerIdx: 1,
    activities: "Bón phân chuồng hoai vào gốc cây cà chua.",
  },
];

export const mockOwnerDailyLogs: DailyLogResType[] = RAW.map(buildLog).sort(
  (a, b) =>
    a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
);

// ── Convenience: filter helper used by the page (mirrors BE filtering) ─

export function filterMockLogsByDateRange(
  logs: DailyLogResType[],
  fromDate?: string,
  toDate?: string,
): DailyLogResType[] {
  if (!fromDate && !toDate) return logs;
  return logs.filter((log) => {
    if (fromDate && log.logDate < fromDate) return false;
    if (toDate && log.logDate > toDate) return false;
    return true;
  });
}
