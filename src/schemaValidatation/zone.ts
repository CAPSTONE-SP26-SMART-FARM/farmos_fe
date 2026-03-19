import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";
import { z } from "zod";

// ============================================================
// Zone — maps to table zones
// ============================================================
export const ZoneSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  name: z.string(),
  zoneType: z.enum(["cultivation", "livestock"]),
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
    zoneType: z.enum(["cultivation", "livestock"]),
    description: z.string().optional(),
    areaSqm: z.number().positive().optional(),
  })
  .strict();

/** 5.4 — Update Zone (Owner) */
export const UpdateZoneBodySchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    zoneType: z.enum(["cultivation", "livestock"]).optional(),
    description: z.string().optional(),
    areaSqm: z.number().positive().optional(),
  })
  .strict();

// ============================================================
// Query Schemas
// ============================================================

/** 5.2 — List Zones (Owner, paginated) */
export const ListZonesQuerySchema = PagingRequestSchema.extend({
  zoneType: z.enum(["cultivation", "livestock"]).optional(),
}).strict();

// ============================================================
// Response Schemas
// ============================================================

/** Zone response */
export const ZoneResSchema = ZoneSchema;

/** Paginated zone response */
export const ListZonesResSchema = PagingResponseSchema(ZoneResSchema);

// ============================================================
// Type Exports
// ============================================================
export type ZoneType = z.infer<typeof ZoneSchema>;
export type CreateZoneBodyType = z.infer<typeof CreateZoneBodySchema>;
export type UpdateZoneBodyType = z.infer<typeof UpdateZoneBodySchema>;
export type ListZonesQueryType = z.infer<typeof ListZonesQuerySchema>;
export type ZoneResType = z.infer<typeof ZoneResSchema>;
export type ListZonesResType = z.infer<typeof ListZonesResSchema>;
