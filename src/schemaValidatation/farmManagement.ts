import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";
import { UserResSchema } from "@/types/user";
import { z } from "zod";

// ============================================================
// Farm — maps to table farms
// ============================================================
export const FarmSchema = z.object({
  id: z.uuid(),
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  description: z.string().nullable(),
  farmType: z.enum(["cultivation", "livestock", "mixed"]),
  address: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  areaHectares: z.number().nullable(),
  areaSqm: z.number().nullable(),
  ownerId: z.uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  deletedAt: z.iso.datetime().nullable(),
});

// ============================================================
// Request Body Schemas
// ============================================================

/** 5.1 — Create Farm (Owner) */
export const CreateFarmBodySchema = z
  .object({
    code: z.string().min(1).max(50),
    name: z.string().min(1).max(255),
    farmType: z.enum(["cultivation", "livestock", "mixed"]),
    description: z.string().optional(),
    address: z.string().optional(),
    areaHectares: z.number().positive().optional(),
    areaSqm: z.number().positive().optional(),
  })
  .strict();

/** 5.2 — Update Farm (Owner) */
export const UpdateFarmBodySchema = z
  .object({
    code: z.string().min(1).max(50).optional(),
    name: z.string().min(1).max(255).optional(),
    farmType: z.enum(["cultivation", "livestock", "mixed"]).optional(),
    description: z.string().optional(),
    address: z.string().optional(),
    areaHectares: z.number().positive().optional(),
    areaSqm: z.number().positive().optional(),
  })
  .strict();

// ============================================================
// Query Schemas
// ============================================================

/** 5.4 — List Farms (Admin, paginated) */
export const ListFarmsQuerySchema = PagingRequestSchema.extend({
  areaHectaresMin: z.coerce.number().positive().optional(),
  areaHectaresMax: z.coerce.number().positive().optional(),
}).strict();

// ============================================================
// Response Schemas
// ============================================================

/** Farm response (omit deletedAt) */
export const FarmResSchema = FarmSchema.omit({ deletedAt: true });

/** Farm with owner info (admin detail + admin list) */
export const FarmWithOwnerResSchema = FarmResSchema.extend({
  owner: UserResSchema,
});

/** Paginated farm response (admin list) */
export const ListFarmsResSchema = PagingResponseSchema(FarmWithOwnerResSchema);

// ============================================================
// Type Exports
// ============================================================
export type FarmType = z.infer<typeof FarmSchema>;
export type CreateFarmBodyType = z.infer<typeof CreateFarmBodySchema>;
export type UpdateFarmBodyType = z.infer<typeof UpdateFarmBodySchema>;
export type ListFarmsQueryType = z.infer<typeof ListFarmsQuerySchema>;

export type FarmResType = z.infer<typeof FarmResSchema>;
export type FarmWithOwnerResType = z.infer<typeof FarmWithOwnerResSchema>;
export type ListFarmsResType = z.infer<typeof ListFarmsResSchema>;
