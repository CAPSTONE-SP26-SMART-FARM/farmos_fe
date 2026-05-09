import { z } from "zod";
import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";

// ── Enums ─────────────────────────────────────────────────────────────────────
export const CommissionScopeSchema = z.enum([
  "CATEGORY_DEFAULT",
  "DOCTOR_TIER",
  "DOCTOR",
]);

export const DoctorTierSchema = z.enum([
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
]);

// ── Response schema ───────────────────────────────────────────────────────────
// Khớp BE `DoctorCommissionRuleSchema` (xem
// `farm_os_be/src/modules/commission-rule/commission-rule.model.ts:9-25`).
// `isActive=false` = rule đã ngưng hiệu lực (soft-delete) — FE dùng để hiển
// thị badge trạng thái + ẩn action "Ngưng hiệu lực" khi đã ngưng rồi.
export const CommissionRuleSchema = z.object({
  id: z.string().uuid(),
  scope: CommissionScopeSchema,
  categoryId: z.string().uuid().nullable(),
  doctorTier: DoctorTierSchema.nullable(),
  doctorId: z.string().uuid().nullable(),
  commissionPercent: z.number(),
  effectiveFrom: z.string().nullable(),
  effectiveTo: z.string().nullable(),
  isActive: z.boolean(),
  note: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Optional expanded relations
  category: z
    .object({ id: z.string().uuid(), name: z.string(), code: z.string() })
    .nullable()
    .optional(),
  doctor: z
    .object({ id: z.string().uuid(), name: z.string() })
    .nullable()
    .optional(),
});

export const CommissionRuleListResSchema =
  PagingResponseSchema(CommissionRuleSchema);

// ── Create form schema ────────────────────────────────────────────────────────
export const CreateCommissionRuleBodySchema = z
  .object({
    scope: CommissionScopeSchema,
    categoryId: z.string().uuid().optional(),
    doctorTier: DoctorTierSchema.optional(),
    doctorId: z.string().uuid().optional(),
    commissionPercent: z
      .number()
      .min(0)
      .max(100, "Hoa hồng không vượt quá 100%."),
    effectiveFrom: z.string().optional(),
    effectiveTo: z.string().optional(),
    note: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.scope === "CATEGORY_DEFAULT" && !data.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng chọn danh mục ticket.",
        path: ["categoryId"],
      });
    }
    if (data.scope === "DOCTOR_TIER" && !data.doctorTier) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng chọn cấp bậc bác sĩ.",
        path: ["doctorTier"],
      });
    }
    if (data.scope === "DOCTOR" && !data.doctorId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng chọn bác sĩ.",
        path: ["doctorId"],
      });
    }
    if (
      data.effectiveFrom &&
      data.effectiveTo &&
      data.effectiveTo <= data.effectiveFrom
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ngày kết thúc phải sau ngày bắt đầu.",
        path: ["effectiveTo"],
      });
    }
  });

// ── Update form schema ────────────────────────────────────────────────────────
export const UpdateCommissionRuleBodySchema = z
  .object({
    commissionPercent: z
      .number()
      .min(0)
      .max(100, "Hoa hồng không vượt quá 100%."),
    effectiveFrom: z.string().optional(),
    effectiveTo: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.effectiveFrom &&
      data.effectiveTo &&
      data.effectiveTo <= data.effectiveFrom
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ngày kết thúc phải sau ngày bắt đầu.",
        path: ["effectiveTo"],
      });
    }
  });

// ── Query schema ──────────────────────────────────────────────────────────────
export const ListCommissionRulesQuerySchema = PagingRequestSchema.extend({
  scope: CommissionScopeSchema.optional(),
  categoryId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
});

// ── Inferred types ────────────────────────────────────────────────────────────
export type CommissionScopeType = z.infer<typeof CommissionScopeSchema>;
export type DoctorTierType = z.infer<typeof DoctorTierSchema>;
export type CommissionRuleType = z.infer<typeof CommissionRuleSchema>;
export type CommissionRuleListResType = z.infer<
  typeof CommissionRuleListResSchema
>;
export type CreateCommissionRuleBodyType = z.infer<
  typeof CreateCommissionRuleBodySchema
>;
export type UpdateCommissionRuleBodyType = z.infer<
  typeof UpdateCommissionRuleBodySchema
>;
export type ListCommissionRulesQueryType = z.infer<
  typeof ListCommissionRulesQuerySchema
>;
