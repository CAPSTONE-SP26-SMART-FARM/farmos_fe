import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";
import { UserResSchema, UserStatusEnum } from "@/types/user";
import { RoleName } from "@/constants/role";
import { z } from "zod";

// ============================================================
// Query Schemas
// ============================================================

export const ListUsersQuerySchema = PagingRequestSchema.extend({
  role: z
    .enum([
      RoleName.Admin,
      RoleName.Owner,
      RoleName.Manager,
      RoleName.Farmer,
      RoleName.Rancher,
      RoleName.Doctor,
    ])
    .optional(),
  status: UserStatusEnum.optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z
    .enum(["name", "email", "id", "phone", "createdAt", "updatedAt"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
}).strict();

// ============================================================
// Response Schemas
// ============================================================

export const ListUsersResSchema = PagingResponseSchema(UserResSchema);

// ============================================================
// Types
// ============================================================

export type ListUsersQueryType = z.infer<typeof ListUsersQuerySchema>;
export type ListUsersResType = z.infer<typeof ListUsersResSchema>;
