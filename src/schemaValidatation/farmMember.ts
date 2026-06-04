import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";
import { UserResSchema } from "@/types/user";
import { z } from "zod";

// ============================================================
// Base Schema — maps to farm_members table
// ============================================================
export const FarmMemberSchema = z.object({
  id: z.uuid(),
  farmId: z.uuid(),
  userId: z.uuid(),
  role: z.enum(["farmer", "manager"]),
  assignedAt: z.iso.datetime(),
  assignedBy: z.uuid().nullable(),
});

// ============================================================
// Nested farm info in response
// ============================================================
export const FarmMemberFarmSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
});

// ============================================================
// Request Body Schemas
// ============================================================
export const CreateFarmMemberBodySchema = z
  .object({
    fullName: z.string().min(1, "Mời nhập họ tên").max(255),
    email: z.email().max(255),
    phone: z.string().max(20),
    role: z.enum(["farmer", "manager"]),
    farmCode: z.string().min(1).max(50),
  })
  .strict();

export const UpdateFarmMemberBodySchema = z
  .object({
    fullName: z.string().min(1, "Mời nhập họ tên").max(255).optional(),
    email: z.email().max(255).optional(),
    phone: z.string().max(20).optional(),
    role: z.enum(["farmer", "manager"]).optional(),
    farmCode: z.string().min(1).max(50).optional(),
  })
  .strict();

// ============================================================
// Query Schemas
// ============================================================
export const ListFarmMembersQuerySchema = PagingRequestSchema.extend({
  role: z.enum(["farmer", "manager"]).optional(),
  farmId: z.uuid().optional(),
}).strict();

// ============================================================
// Response Schemas
// ============================================================
export const FarmMemberResSchema = FarmMemberSchema.extend({
  user: UserResSchema,
  farm: FarmMemberFarmSchema,
});

export const CreateFarmMemberResSchema = FarmMemberResSchema.extend({
  generatedPassword: z.string(),
});

export const ListFarmMembersResSchema =
  PagingResponseSchema(FarmMemberResSchema);

// ============================================================
// Type Exports
// ============================================================
export type FarmMemberType = z.infer<typeof FarmMemberSchema>;
export type CreateFarmMemberBodyType = z.infer<
  typeof CreateFarmMemberBodySchema
>;
export type UpdateFarmMemberBodyType = z.infer<
  typeof UpdateFarmMemberBodySchema
>;
export type ListFarmMembersQueryType = z.infer<
  typeof ListFarmMembersQuerySchema
>;
export type FarmMemberResType = z.infer<typeof FarmMemberResSchema>;
export type CreateFarmMemberResType = z.infer<typeof CreateFarmMemberResSchema>;
export type ListFarmMembersResType = z.infer<typeof ListFarmMembersResSchema>;
