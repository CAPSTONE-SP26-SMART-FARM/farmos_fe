import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";
import { z } from "zod";

// ============================================================
// Base Schema — maps to zone_managers table
// ============================================================
export const ZoneManagerSchema = z.object({
  id: z.string().uuid(),
  zoneId: z.string().uuid(),
  managerId: z.string().uuid(),
  assignedAt: z.string(),
  assignedBy: z.string().uuid(),
  isPrimary: z.boolean(),
  notes: z.string().nullable(),
});

// ============================================================
// Nested user info returned by list endpoint
// ============================================================
export const ZoneManagerUserSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  status: z.string(),
  role: z.string(),
});

// ============================================================
// Request Body Schemas
// ============================================================

/** Assign single manager to zone */
export const AssignManagerBodySchema = z
  .object({
    managerId: z.string().uuid(),
    isPrimary: z.boolean().default(false),
  })
  .strict();

/** Assign multiple managers to zone (bulk) */
export const AssignBulkManagerBodySchema = z
  .object({
    managerIds: z.array(z.string().uuid()).min(1),
  })
  .strict();

/** Update primary manager flag */
export const UpdatePrimaryManagerBodySchema = z
  .object({
    isPrimary: z.boolean(),
  })
  .strict();

/** Remove multiple managers (bulk) */
export const RemoveBulkManagerBodySchema = z
  .object({
    managerIds: z.array(z.string().uuid()).min(1),
  })
  .strict();

// ============================================================
// Query Schemas
// ============================================================
export const ListZoneManagersQuerySchema = PagingRequestSchema.extend({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
}).strict();

// ============================================================
// Response Schemas
// ============================================================

/** Single zone manager response (base fields) */
export const ZoneManagerResSchema = ZoneManagerSchema;

/** Zone manager with nested user info (from list endpoint) */
export const ZoneManagerWithUserResSchema = ZoneManagerSchema.extend({
  user: ZoneManagerUserSchema,
});

/** Paginated list of zone managers */
export const ListZoneManagersResSchema = PagingResponseSchema(
  ZoneManagerWithUserResSchema,
);

// ============================================================
// Type Exports
// ============================================================
export type ZoneManagerType = z.infer<typeof ZoneManagerSchema>;
export type ZoneManagerUserType = z.infer<typeof ZoneManagerUserSchema>;
export type AssignManagerBodyType = z.infer<typeof AssignManagerBodySchema>;
export type AssignBulkManagerBodyType = z.infer<
  typeof AssignBulkManagerBodySchema
>;
export type UpdatePrimaryManagerBodyType = z.infer<
  typeof UpdatePrimaryManagerBodySchema
>;
export type RemoveBulkManagerBodyType = z.infer<
  typeof RemoveBulkManagerBodySchema
>;
export type ListZoneManagersQueryType = z.infer<
  typeof ListZoneManagersQuerySchema
>;
export type ZoneManagerResType = z.infer<typeof ZoneManagerResSchema>;
export type ZoneManagerWithUserResType = z.infer<
  typeof ZoneManagerWithUserResSchema
>;
export type ListZoneManagersResType = z.infer<typeof ListZoneManagersResSchema>;
