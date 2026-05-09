import { z } from "zod";
import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";

// ── Enums ─────────────────────────────────────────────────────────────────────
export const TicketCategoryStatusSchema = z.enum(["active", "inactive"]);

// ── Metadata schema (BE walkthrough Setup 1 — JSONB metadata) ─────────────────
// Mọi field đều optional khi tạo/update; server merge với defaults khi trả về.
export const TicketCategoryMetadataSchema = z
  .object({
    creditCost: z.number().int().min(1).optional(),
    maxOpenTickets: z.number().int().min(1).optional(),
    requireAttachment: z.boolean().optional(),
    doctorSilenceMinutesOverride: z.number().int().min(1).nullable().optional(),
    allowedDoctorTypes: z
      .array(z.enum(["internal", "partner", "coordinator"]))
      .nullable()
      .optional(),
  })
  .partial();

export type TicketCategoryMetadataType = z.infer<
  typeof TicketCategoryMetadataSchema
>;

// ── Response schemas ──────────────────────────────────────────────────────────
// `legacyCategory` / `legacyTicketType` đã bị BE drop khỏi schema 2026-05-08
// nhưng response cũ có thể còn — giữ optional/nullable để không vỡ payload.
export const TicketCategorySchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  legacyCategory: z.string().nullable().optional(),
  legacyTicketType: z.string().nullable().optional(),
  currency: z.string(),
  unitPrice: z.number(),
  defaultCommissionPercent: z.number(),
  eligibleForSubscriptionGrant: z.boolean(),
  eligibleForPurchase: z.boolean(),
  featureCode: z.string().nullable(),
  // creditType giờ là derived field từ code — server tự tính
  // ("ticket_cat_" + code.toLowerCase()) và trả trong response.
  creditType: z.string().nullable(),
  metadata: TicketCategoryMetadataSchema.nullable().optional(),
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
// BE walkthrough Setup 1 (cập nhật 2026-05-08 + 2026-05-09):
//  - `legacyCategory` + `legacyTicketType` đã DROP khỏi schema.
//  - `creditType` đã DROP khỏi body — server tự derive từ `code`:
//    `creditType = "ticket_cat_" + code.toLowerCase()`.
//  - `code` regex: /^[A-Z][A-Z0-9_]{2,63}$/ — UPPERCASE, 3-64 ký tự.
//  - `metadata` là JSONB optional, hỗ trợ creditCost / maxOpenTickets /
//    requireAttachment / doctorSilenceMinutesOverride / allowedDoctorTypes.
export const CreateTicketCategoryBodySchema = z.object({
  code: z
    .string()
    .trim()
    .regex(
      /^[A-Z][A-Z0-9_]{2,63}$/,
      "Mã phải in hoa, bắt đầu bằng chữ cái, độ dài 3-64 ký tự (chỉ chứa A-Z, 0-9, _).",
    ),
  name: z.string().trim().min(1, "Tên danh mục không được để trống."),
  description: z.string().optional(),
  unitPrice: z.number().min(0, "Đơn giá không được âm."),
  defaultCommissionPercent: z
    .number()
    .min(0)
    .max(100, "Hoa hồng không vượt quá 100%."),
  eligibleForSubscriptionGrant: z.boolean(),
  eligibleForPurchase: z.boolean(),
  featureCode: z.string().trim().min(1, "Feature code là bắt buộc."),
  metadata: TicketCategoryMetadataSchema.optional(),
});

export const ToggleTicketCategoryBodySchema = z.object({
  isActive: z.boolean(),
});

// ── Update form schema (excludes create-only fields) ─────────────────────────
// BE: `creditType` là bất biến hoàn toàn — không có trong update body.
// `featureCode` chỉ sửa được khi chưa có ticket nào dùng category (BE check).
export const UpdateTicketCategoryBodySchema = z.object({
  name: z.string().trim().min(1, "Tên danh mục không được để trống."),
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
  metadata: TicketCategoryMetadataSchema.optional(),
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
