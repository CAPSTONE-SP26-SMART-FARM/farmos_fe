import { z } from "zod";

// Module 3 — DoctorQualitySnapshot. Schema 1-1 với BE
// `farm_os_be/src/modules/dqs/dqs.model.ts`. BE strict — field name lệch
// hay thừa = 422.
//
// QUAN TRỌNG (audit Wave 4):
//  - Sub-score là `frequencyScore` (không `workloadScore`).
//  - Tất cả sub-score + totalScore là `number` (không nullable).
//  - Có field `windowDays` (mặc định 30 ngày).
//  - Có field `computedAt` (datetime), KHÔNG có `createdAt`.
//  - KHÔNG có join `doctor` object — leaderboard có `doctorName` denormalized.
//  - Detail endpoint trả `{doctorId, latest: snapshot|null}` lồng.
//  - History + Leaderboard endpoint KHÔNG pagination — chỉ flat `{data:[]}`.

export const TierSchema = z.enum(["BRONZE", "SILVER", "GOLD", "PLATINUM"]);

// Snapshot row (response từ B14 latest + B15 history).
export const DqsSnapshotResSchema = z.object({
  id: z.string().uuid(),
  doctorId: z.string().uuid(),
  snapshotDate: z.string(), // YYYY-MM-DD
  windowDays: z.number().int(),
  ratingScore: z.number(),
  frequencyScore: z.number(),
  slaScore: z.number(),
  acceptanceScore: z.number(),
  onlineScore: z.number(),
  totalScore: z.number(),
  tier: TierSchema,
  computedAt: z.string().datetime(),
});

// B14 — `{doctorId, latest}`. `latest` null nếu doctor chưa có snapshot
// (cron chưa chạy hoặc doctor mới <30 ngày).
export const DoctorDqsDetailResSchema = z.object({
  doctorId: z.string().uuid(),
  latest: DqsSnapshotResSchema.nullable(),
});

// B15 — KHÔNG pagination, chỉ from/to filter.
export const DqsHistoryQuerySchema = z.object({
  from: z.string().optional(), // YYYY-MM-DD
  to: z.string().optional(), // YYYY-MM-DD
});

export const DqsHistoryResSchema = z.object({
  data: z.array(DqsSnapshotResSchema),
});

// B16 — KHÔNG pagination, chỉ date+tier filter. Row có doctorName denormalized.
export const DqsLeaderboardQuerySchema = z.object({
  date: z.string().optional(), // YYYY-MM-DD; default = latest
  tier: TierSchema.optional(),
});

export const LeaderboardRowSchema = z.object({
  doctorId: z.string().uuid(),
  doctorName: z.string().nullable(),
  snapshotDate: z.string(),
  tier: TierSchema,
  totalScore: z.number(),
  ratingScore: z.number(),
  frequencyScore: z.number(),
  slaScore: z.number(),
  acceptanceScore: z.number(),
  onlineScore: z.number(),
});

export const DqsLeaderboardResSchema = z.object({
  data: z.array(LeaderboardRowSchema),
});

export type TierType = z.infer<typeof TierSchema>;
export type DqsSnapshotResType = z.infer<typeof DqsSnapshotResSchema>;
export type DoctorDqsDetailResType = z.infer<typeof DoctorDqsDetailResSchema>;
export type DqsHistoryQueryType = z.infer<typeof DqsHistoryQuerySchema>;
export type DqsHistoryResType = z.infer<typeof DqsHistoryResSchema>;
export type DqsLeaderboardQueryType = z.infer<typeof DqsLeaderboardQuerySchema>;
export type LeaderboardRowType = z.infer<typeof LeaderboardRowSchema>;
export type DqsLeaderboardResType = z.infer<typeof DqsLeaderboardResSchema>;
