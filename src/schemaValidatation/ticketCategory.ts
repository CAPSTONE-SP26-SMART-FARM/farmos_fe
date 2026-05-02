import { z } from "zod";
import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";

// ── Enums ─────────────────────────────────────────────────────────────────────
export const TicketCategoryStatusSchema = z.enum(["active", "inactive"]);

// ── Response schemas ──────────────────────────────────────────────────────────
export const TicketCategorySchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  legacyCategory: z.string().nullable(),
  legacyTicketType: z.string().nullable(),
  currency: z.string(),
  unitPrice: z.number(),
  defaultCommissionPercent: z.number(),
  eligibleForSubscriptionGrant: z.boolean(),
  eligibleForPurchase: z.boolean(),
  featureCode: z.string().nullable(),
  creditType: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const TicketCategoryListResSchema =
  PagingResponseSchema(TicketCategorySchema);

export const ActiveTicketCategorySchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  unitPrice: z.number(),
  creditType: z.string().nullable(),
  eligibleForSubscriptionGrant: z.boolean(),
  eligibleForPurchase: z.boolean(),
});

export const ActiveTicketCategoryListResSchema = z.object({
  data: z.array(ActiveTicketCategorySchema),
});

// ── Create form schema ────────────────────────────────────────────────────────
export const CreateTicketCategoryBodySchema = z.object({
  code: z.string().min(1, "Mã danh mục không được để trống."),
  name: z.string().min(1, "Tên danh mục không được để trống."),
  description: z.string().optional(),
  legacyCategory: z.enum([
    "general",
    "disease",
    "nutrition",
    "reproduction",
    "emergency",
  ]),
  legacyTicketType: z.enum(["general_support", "incident"]),
  unitPrice: z.number().min(0, "Đơn giá không được âm."),
  defaultCommissionPercent: z
    .number()
    .min(0)
    .max(100, "Hoa hồng không vượt quá 100%."),
  eligibleForSubscriptionGrant: z.boolean(),
  eligibleForPurchase: z.boolean(),
  featureCode: z.string().trim().min(1, "Feature code là bắt buộc."),
  creditType: z.string().trim().min(1, "Credit type là bắt buộc."),
});

export const ToggleTicketCategoryBodySchema = z.object({
  isActive: z.boolean(),
});

// ── Update form schema (excludes create-only fields) ─────────────────────────
export const UpdateTicketCategoryBodySchema = z.object({
  name: z.string().min(1, "Tên danh mục không được để trống."),
  description: z.string().optional(),
  unitPrice: z.number().min(0, "Đơn giá không được âm."),
  defaultCommissionPercent: z
    .number()
    .min(0)
    .max(100, "Hoa hồng không vượt quá 100%."),
  eligibleForSubscriptionGrant: z.boolean(),
  eligibleForPurchase: z.boolean(),
  featureCode: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().min(1).optional(),
  ),
  creditType: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().min(1).optional(),
  ),
});

// ── Query schema ──────────────────────────────────────────────────────────────
export const ListTicketCategoriesQuerySchema = PagingRequestSchema.extend({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ── Inferred types ────────────────────────────────────────────────────────────
export type TicketCategoryType = z.infer<typeof TicketCategorySchema>;
export type TicketCategoryListResType = z.infer<
  typeof TicketCategoryListResSchema
>;
export type ActiveTicketCategoryType = z.infer<
  typeof ActiveTicketCategorySchema
>;
export type ActiveTicketCategoryListResType = z.infer<
  typeof ActiveTicketCategoryListResSchema
>;
export type CreateTicketCategoryBodyType = z.infer<
  typeof CreateTicketCategoryBodySchema
>;
export type ToggleTicketCategoryBodyType = z.infer<
  typeof ToggleTicketCategoryBodySchema
>;
export type UpdateTicketCategoryBodyType = z.infer<
  typeof UpdateTicketCategoryBodySchema
>;
export type ListTicketCategoriesQueryType = z.infer<
  typeof ListTicketCategoriesQuerySchema
>;
