import { RoleName } from "@/constants/role";
import { z } from "zod";

export const UserSchema = z.object({
  id: z.uuid(),
  email: z.email().max(255),
  passwordHash: z.string(),
  fullName: z.string().min(1).max(255),
  phone: z.string().max(20).nullable(),
  avatarUrl: z.string().nullable(),
  role: z.enum([
    RoleName.Owner,
    RoleName.Manager,
    RoleName.Farmer,
    RoleName.Doctor,
    RoleName.Admin,
  ]),
  isActive: z.boolean(),
  emailVerifiedAt: z.iso.datetime().nullable(),
  totpSecret: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  deletedAt: z.iso.datetime().nullable(),
});

/**
 * Áp dụng cho Response của api GET/PUT profile và GET/PUT users
 * Bỏ passwordHash khỏi response`
 */
export const UserResSchema = UserSchema.omit({
  passwordHash: true,
  totpSecret: true,
});

export type UserType = z.infer<typeof UserSchema>;
export type UserResType = z.infer<typeof UserResSchema>;
