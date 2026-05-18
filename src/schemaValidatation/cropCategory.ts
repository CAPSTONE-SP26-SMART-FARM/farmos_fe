import { z } from "zod";
import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";

// ── Regex chuẩn của BE (giữ nguyên với crop-category.model.ts) ────────────────
export const CROP_CATEGORY_CODE_REGEX = /^[A-Z0-9_-]{2,64}$/;

/**
 * RHF `valueAsNumber: true` trả về `NaN` khi user để trống ô số. NaN là
 * `typeof "number"` nên `z.number()` chấp nhận, nhưng `.positive()` fail vì
 * `NaN > 0 === false` → optional field bị validate như bắt buộc.
 *
 * Helper này preprocess NaN/chuỗi rỗng → `undefined` trước khi áp Zod rule.
 */
const optionalNumber = (rule: z.ZodTypeAny) =>
  z.preprocess(
    (v) =>
      typeof v === "number" && Number.isNaN(v)
        ? undefined
        : v === ""
          ? undefined
          : v,
    rule,
  );

// ── Response schema — mirror BE CropCategorySchema ───────────────────────────
export const CropCategorySchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  scientificName: z.string().nullable(),
  description: z.string().nullable(),
  minPlantingDensity: z.number(),
  maxPlantingDensity: z.number(),
  recommendedDensity: z.number().nullable(),
  defaultCycleDays: z.number().int().nullable(),
  minAreaSqm: z.number().nullable(),
  isActive: z.boolean(),
  metadata: z.unknown().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CropCategoryType = z.infer<typeof CropCategorySchema>;

export const ListCropCategoriesResSchema =
  PagingResponseSchema(CropCategorySchema);
export type ListCropCategoriesResType = z.infer<
  typeof ListCropCategoriesResSchema
>;

export const ActiveCropCategoryListResSchema = z.object({
  data: z.array(CropCategorySchema),
});
export type ActiveCropCategoryListResType = z.infer<
  typeof ActiveCropCategoryListResSchema
>;

// ── Query ────────────────────────────────────────────────────────────────────
export const ListCropCategoriesQuerySchema = PagingRequestSchema.extend({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
});
export type ListCropCategoriesQueryType = z.infer<
  typeof ListCropCategoriesQuerySchema
>;

// ── Create body ──────────────────────────────────────────────────────────────
// Cross-field rules (BE):
//  - minPlantingDensity ≤ maxPlantingDensity        → Error.CropCategoryMinDensityExceedsMax (path: maxPlantingDensity)
//  - recommendedDensity ∈ [min, max] (nếu có)       → Error.CropCategoryRecommendedDensityOutOfRange (path: recommendedDensity)
// FE pre-check client-side để khỏi roundtrip; BE sẽ chốt lại.
export const CreateCropCategoryBodySchema = z
  .object({
    code: z
      .string()
      .trim()
      .regex(
        CROP_CATEGORY_CODE_REGEX,
        "Mã phải IN HOA, 2–64 ký tự (chỉ chứa A–Z, 0–9, _ hoặc -).",
      ),
    name: z
      .string()
      .trim()
      .min(1, "Tên loại cây không được để trống.")
      .max(255, "Tên loại cây tối đa 255 ký tự."),
    scientificName: z
      .string()
      .trim()
      .max(255, "Tên khoa học tối đa 255 ký tự.")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    description: z
      .string()
      .optional()
      .or(z.literal("").transform(() => undefined)),
    minPlantingDensity: z
      .number({ message: "Vui lòng nhập mật độ tối thiểu." })
      .positive("Mật độ tối thiểu phải lớn hơn 0."),
    maxPlantingDensity: z
      .number({ message: "Vui lòng nhập mật độ tối đa." })
      .positive("Mật độ tối đa phải lớn hơn 0."),
    recommendedDensity: optionalNumber(
      z.number().positive("Mật độ khuyến nghị phải lớn hơn 0.").optional(),
    ),
    defaultCycleDays: optionalNumber(
      z
        .number()
        .int("Chu kỳ phải là số nguyên.")
        .positive("Chu kỳ phải lớn hơn 0.")
        .optional(),
    ),
    minAreaSqm: optionalNumber(
      z
        .number()
        .positive("Diện tích tối thiểu phải lớn hơn 0.")
        .optional(),
    ),
  })
  .superRefine((v, ctx) => {
    const min = v.minPlantingDensity;
    const max = v.maxPlantingDensity;
    const rec = v.recommendedDensity;
    if (typeof min === "number" && typeof max === "number" && min > max) {
      ctx.addIssue({
        code: "custom",
        path: ["maxPlantingDensity"],
        message: "Mật độ tối đa phải ≥ mật độ tối thiểu.",
      });
    }
    if (
      typeof rec === "number" &&
      typeof min === "number" &&
      typeof max === "number" &&
      (rec < min || rec > max)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["recommendedDensity"],
        message: "Mật độ khuyến nghị phải nằm giữa min và max.",
      });
    }
  });

export type CreateCropCategoryBodyType = z.infer<
  typeof CreateCropCategoryBodySchema
>;

// ── Update body — không nhận `code` (BE strict reject) ───────────────────────
// Tất cả field optional; cross-field check chỉ chạy khi có đủ context.
export const UpdateCropCategoryBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Tên loại cây không được để trống.")
      .max(255, "Tên loại cây tối đa 255 ký tự.")
      .optional(),
    scientificName: z
      .string()
      .trim()
      .max(255, "Tên khoa học tối đa 255 ký tự.")
      .nullable()
      .optional(),
    description: z.string().nullable().optional(),
    minPlantingDensity: optionalNumber(
      z.number().positive("Mật độ tối thiểu phải lớn hơn 0.").optional(),
    ),
    maxPlantingDensity: optionalNumber(
      z.number().positive("Mật độ tối đa phải lớn hơn 0.").optional(),
    ),
    recommendedDensity: optionalNumber(
      z
        .number()
        .positive("Mật độ khuyến nghị phải lớn hơn 0.")
        .nullable()
        .optional(),
    ),
    defaultCycleDays: optionalNumber(
      z
        .number()
        .int("Chu kỳ phải là số nguyên.")
        .positive("Chu kỳ phải lớn hơn 0.")
        .nullable()
        .optional(),
    ),
    minAreaSqm: optionalNumber(
      z
        .number()
        .positive("Diện tích tối thiểu phải lớn hơn 0.")
        .nullable()
        .optional(),
    ),
  })
  .superRefine((v, ctx) => {
    const min = v.minPlantingDensity;
    const max = v.maxPlantingDensity;
    const rec = v.recommendedDensity;
    if (typeof min === "number" && typeof max === "number" && min > max) {
      ctx.addIssue({
        code: "custom",
        path: ["maxPlantingDensity"],
        message: "Mật độ tối đa phải ≥ mật độ tối thiểu.",
      });
    }
    if (
      typeof rec === "number" &&
      typeof min === "number" &&
      typeof max === "number" &&
      (rec < min || rec > max)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["recommendedDensity"],
        message: "Mật độ khuyến nghị phải nằm giữa min và max.",
      });
    }
  });

export type UpdateCropCategoryBodyType = z.infer<
  typeof UpdateCropCategoryBodySchema
>;

// ── Toggle body ──────────────────────────────────────────────────────────────
export const ToggleCropCategoryBodySchema = z.object({
  isActive: z.boolean(),
});
export type ToggleCropCategoryBodyType = z.infer<
  typeof ToggleCropCategoryBodySchema
>;
