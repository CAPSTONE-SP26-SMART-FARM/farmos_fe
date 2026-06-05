import { z } from "zod";

// BE: GET /zones/:id/iot-coverage?kitId=...
// Trạng thái phủ:
//  - "sufficient":   currentActiveCoverage >= zoneAreaSqm
//  - "under_covered": currentActiveCoverage < zoneAreaSqm
//  - "unknown":      zone chưa khai báo diện tích (zoneAreaSqm = null)
export const IotCoverageStatusEnum = z.enum([
  "sufficient",
  "under_covered",
  "unknown",
]);
export type IotCoverageStatus = z.infer<typeof IotCoverageStatusEnum>;

export const IotCoverageResSchema = z.object({
  zoneId: z.string().uuid(),
  // null khi zone chưa cấu hình diện tích.
  zoneAreaSqm: z.number().nullable(),
  // null khi caller không truyền kitId.
  kitId: z.string().uuid().nullable(),
  // null khi không truyền kitId hoặc kit chưa cấu hình coverageSqm.
  kitCoverageSqm: z.number().nullable(),
  // null khi thiếu zoneArea hoặc kitCoverage.
  requiredKitCount: z.number().int().nullable(),
  // Σ coverageSqmSnapshot của các assignment active.
  currentActiveCoverage: z.number(),
  // Số assignment active trên zone.
  activeDeviceCount: z.number().int(),
  // max(0, zoneArea - currentCoverage). BE trả 0 khi zoneArea null.
  gapSqm: z.number(),
  status: IotCoverageStatusEnum,
});
export type IotCoverageResType = z.infer<typeof IotCoverageResSchema>;

// BE: GET /crop-seasons/:id/iot-coverage?kitId=...
// Denominator là `cropSeason.totalAreaSqm` (diện tích vùng trồng), không phải
// `zone.areaSqm`. activeDeviceCount là số device distinct (đã dedupe).
export const CropSeasonIotCoverageResSchema = z.object({
  cropSeasonId: z.string().uuid(),
  zoneId: z.string().uuid(),
  // null khi crop season chưa cấu hình totalAreaSqm.
  cropSeasonAreaSqm: z.number().nullable(),
  kitId: z.string().uuid().nullable(),
  kitCoverageSqm: z.number().nullable(),
  requiredKitCount: z.number().int().nullable(),
  currentActiveCoverage: z.number(),
  activeDeviceCount: z.number().int(),
  // null khi cropSeasonAreaSqm null.
  gapSqm: z.number().nullable(),
  status: IotCoverageStatusEnum,
});
export type CropSeasonIotCoverageResType = z.infer<
  typeof CropSeasonIotCoverageResSchema
>;

// BE: GET /production-milestones/:id/iot-coverage?kitId=...
// Mẫu số là `cropSeason.totalAreaSqm` của mốc; tử số CHỈ tính assignment active
// của riêng mốc này (đã dedupe per device) → mỗi mốc có độ phủ riêng.
export const MilestoneIotCoverageResSchema = z.object({
  milestoneId: z.string().uuid(),
  // null cho mốc legacy chưa gắn mùa vụ.
  cropSeasonId: z.string().uuid().nullable(),
  // null khi mốc chưa gắn mùa vụ.
  zoneId: z.string().uuid().nullable(),
  // null khi mùa vụ chưa cấu hình totalAreaSqm.
  cropSeasonAreaSqm: z.number().nullable(),
  kitId: z.string().uuid().nullable(),
  kitCoverageSqm: z.number().nullable(),
  requiredKitCount: z.number().int().nullable(),
  currentActiveCoverage: z.number(),
  activeDeviceCount: z.number().int(),
  gapSqm: z.number().nullable(),
  status: IotCoverageStatusEnum,
});
export type MilestoneIotCoverageResType = z.infer<
  typeof MilestoneIotCoverageResSchema
>;

// BE: GET /crop-seasons/:id/milestones-iot-coverage?kitId=...
// Breakdown độ phủ của TỪNG mốc trong 1 mùa vụ + summary cả mùa vụ (các field
// top-level giống crop-season scope). Mỗi mốc so độ phủ riêng với cùng mẫu số
// là cropSeason.totalAreaSqm. Dùng làm GỢI Ý lúc gửi duyệt / duyệt mùa vụ —
// không chặn flow.
export const MilestoneCoverageBreakdownItemSchema = z.object({
  milestoneId: z.string().uuid(),
  stageName: z.string(),
  milestoneOrder: z.number().int(),
  currentActiveCoverage: z.number(),
  activeDeviceCount: z.number().int(),
  // null khi cropSeasonAreaSqm null.
  gapSqm: z.number().nullable(),
  status: IotCoverageStatusEnum,
});
export type MilestoneCoverageBreakdownItem = z.infer<
  typeof MilestoneCoverageBreakdownItemSchema
>;

export const CropSeasonMilestonesIotCoverageResSchema =
  CropSeasonIotCoverageResSchema.extend({
    milestones: z.array(MilestoneCoverageBreakdownItemSchema),
  });
export type CropSeasonMilestonesIotCoverageResType = z.infer<
  typeof CropSeasonMilestonesIotCoverageResSchema
>;
