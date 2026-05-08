import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";
import { z } from "zod";

// ============================================================
// Base schemas
// ============================================================

export const PlanStatusEnum = z.enum(["ACTIVE", "ARCHIVED"]);

export const SubscriptionPlanSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1).max(64),
  name: z.string().min(1),
  description: z.string().nullable(),
  durationMonths: z.number().int().positive(),
  listPrice: z.number().min(0),
  status: PlanStatusEnum,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PlanVersionFeatureSchema = z.object({
  id: z.string().uuid(),
  planVersionId: z.string().uuid(),
  featureCode: z.string().min(1).max(64),
  featureName: z.string().optional(),
  featureDescription: z.string().nullable().optional(),
  featureUnit: z.string().nullable().optional(),
  featureValueType: z.string().optional(),
  value: z.string(),
  note: z.string().nullable(),
});

export const PlanVersionSchema = z.object({
  id: z.string().uuid(),
  planId: z.string().uuid(),
  versionNo: z.number().int().positive(),
  changelog: z.string().nullable(),
  effectiveFrom: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export const PlanVersionWithFeaturesResSchema = PlanVersionSchema.extend({
  features: z.array(PlanVersionFeatureSchema),
});

// ============================================================
// Request body schemas
// ============================================================

export const CreatePlanBodySchema = z
  .object({
    code: z.string().trim().min(1, "Mã gói là bắt buộc").max(64),
    name: z.string().trim().min(1, "Tên gói là bắt buộc").max(255),
    description: z.string().trim().max(1000).optional(),
    durationMonths: z
      .number({ error: "Thời hạn phải là số" })
      .int("Thời hạn phải là số nguyên")
      .positive("Thời hạn phải lớn hơn 0"),
    listPrice: z
      .number({ error: "Giá niêm yết phải là số" })
      .min(0, "Giá niêm yết không được âm"),
  })
  .strict();

export const UpdatePlanBodySchema = z
  .object({
    name: z.string().trim().min(1, "Tên gói là bắt buộc").max(255).optional(),
    description: z.string().trim().max(1000).optional(),
    durationMonths: z
      .number({ error: "Thời hạn phải là số" })
      .int("Thời hạn phải là số nguyên")
      .positive("Thời hạn phải lớn hơn 0")
      .optional(),
    listPrice: z
      .number({ error: "Giá niêm yết phải là số" })
      .min(0, "Giá niêm yết không được âm")
      .optional(),
  })
  .strict();

export const CreatePlanVersionFeatureBodySchema = z.object({
  featureCode: z
    .string()
    .trim()
    .min(1, "Mã tính năng là bắt buộc")
    .max(64, "Mã tính năng tối đa 64 ký tự"),
  value: z.string().trim().min(1, "Giá trị là bắt buộc"),
  note: z.string().trim().max(500).optional(),
});

export const CreatePlanVersionBodySchema = z
  .object({
    changelog: z.string().trim().max(2000).optional(),
    features: z
      .array(CreatePlanVersionFeatureBodySchema)
      .min(1, "Cần ít nhất một tính năng"),
  })
  .strict()
  .refine(
    (data) =>
      new Set(data.features.map((f) => f.featureCode)).size ===
      data.features.length,
    {
      message: "Mỗi mã tính năng chỉ được khai báo một lần",
      path: ["features"],
    },
  );

// ============================================================
// Query schemas
// ============================================================

export const ListPlansQuerySchema = PagingRequestSchema.extend({
  status: PlanStatusEnum.optional(),
}).strict();

export const ListPlanVersionsQuerySchema = PagingRequestSchema.extend({
  search: z.string().optional(),
}).strict();

// ============================================================
// Response schemas
// ============================================================

export const PlanResSchema = SubscriptionPlanSchema.extend({
  inStock: z.boolean(),
});

export const ListPlansResSchema = PagingResponseSchema(PlanResSchema);

export const ListPlanVersionsResSchema = PagingResponseSchema(
  PlanVersionWithFeaturesResSchema,
);

// ============================================================
// Type exports
// ============================================================

export type PlanStatusType = z.infer<typeof PlanStatusEnum>;

export type SubscriptionPlanType = z.infer<typeof SubscriptionPlanSchema>;
export type PlanVersionFeatureType = z.infer<typeof PlanVersionFeatureSchema>;
export type PlanVersionType = z.infer<typeof PlanVersionSchema>;
export type PlanVersionWithFeaturesResType = z.infer<
  typeof PlanVersionWithFeaturesResSchema
>;

export type CreatePlanBodyType = z.infer<typeof CreatePlanBodySchema>;
export type UpdatePlanBodyType = z.infer<typeof UpdatePlanBodySchema>;
export type CreatePlanVersionFeatureBodyType = z.infer<
  typeof CreatePlanVersionFeatureBodySchema
>;
export type CreatePlanVersionBodyType = z.infer<
  typeof CreatePlanVersionBodySchema
>;

export type ListPlansQueryType = z.infer<typeof ListPlansQuerySchema>;
export type ListPlanVersionsQueryType = z.infer<
  typeof ListPlanVersionsQuerySchema
>;

export type PlanResType = z.infer<typeof PlanResSchema>;
export type ListPlansResType = z.infer<typeof ListPlansResSchema>;
export type ListPlanVersionsResType = z.infer<typeof ListPlanVersionsResSchema>;
