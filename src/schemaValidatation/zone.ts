import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";
import { ProductionStatusName } from "@/types/cropSeason";
import { z } from "zod";

// ============================================================
// CurrentCropSeason — tóm tắt mùa vụ đang diễn ra của zone
// (mirror BE CurrentCropSeasonSummarySchema)
// ============================================================
export const CurrentCropSeasonSummarySchema = z.object({
  id: z.string().uuid(),
  cropName: z.string(),
  variety: z.string().nullable(),
  expectedHarvestDate: z.string(),
  actualHarvestDate: z.string().nullable(),
  totalAreaSqm: z.number().nullable(),
  status: z.enum([
    ProductionStatusName.Planning,
    ProductionStatusName.Sent,
    ProductionStatusName.Approved,
    ProductionStatusName.Rejected,
    ProductionStatusName.Active,
    ProductionStatusName.Completed,
    ProductionStatusName.Cancelled,
  ]),
});

// Tập status mà BE chấp nhận lọc — khớp ActiveCropSeasonStatusValues bên BE.
// Terminal status (rejected/completed/cancelled) bị loại vì currentCropSeason
// luôn = null khi mùa vụ đã kết thúc.
export const ActiveCropSeasonStatusValues = [
  ProductionStatusName.Planning,
  ProductionStatusName.Sent,
  ProductionStatusName.Approved,
  ProductionStatusName.Active,
] as const;

// ============================================================
// Zone — maps to table zones
// ============================================================
export const ZoneSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  name: z.string(),
  zoneType: z.enum(["cultivation"]),
  description: z.string().nullable(),
  areaSqm: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ============================================================
// Request Body Schemas
// ============================================================

/** 5.1 — Create Zone (Owner) */
export const CreateZoneBodySchema = z
  .object({
    farmCode: z.string().min(1).max(50),
    name: z.string().min(1).max(255),
    zoneType: z.enum(["cultivation"]),
    description: z.string().optional(),
    areaSqm: z.number().positive().optional(),
  })
  .strict();

/** 5.4 — Update Zone (Owner) */
export const UpdateZoneBodySchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    zoneType: z.enum(["cultivation"]).optional(),
    description: z.string().optional(),
    areaSqm: z.number().positive().optional(),
  })
  .strict();

// ============================================================
// Query Schemas
// ============================================================

/** 5.2 — List Zones (Owner, paginated) */
export const ListZonesQuerySchema = PagingRequestSchema.extend({
  zoneType: z.enum(["cultivation"]).optional(),
  currentCropSeasonStatus: z.enum(ActiveCropSeasonStatusValues).optional(),
}).strict();

// ============================================================
// Response Schemas
// ============================================================

/** Zone response — kèm crop season đang diễn ra (null nếu chưa có hoặc đã kết thúc). */
export const ZoneResSchema = ZoneSchema.extend({
  currentCropSeason: CurrentCropSeasonSummarySchema.nullable(),
});

/** Paginated zone response */
export const ListZonesResSchema = PagingResponseSchema(ZoneResSchema);

// ============================================================
// Type Exports
// ============================================================
export type ZoneType = z.infer<typeof ZoneResSchema>;
export type CurrentCropSeasonSummaryType = z.infer<typeof CurrentCropSeasonSummarySchema>;
export type ActiveCropSeasonStatusType = (typeof ActiveCropSeasonStatusValues)[number];
export type CreateZoneBodyType = z.infer<typeof CreateZoneBodySchema>;
export type UpdateZoneBodyType = z.infer<typeof UpdateZoneBodySchema>;
export type ListZonesQueryType = z.infer<typeof ListZonesQuerySchema>;
export type ZoneResType = z.infer<typeof ZoneResSchema>;
export type ListZonesResType = z.infer<typeof ListZonesResSchema>;
