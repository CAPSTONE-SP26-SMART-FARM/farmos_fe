import { z } from "zod";
import { PagingResponseSchema } from "@/types/api";

// Module 3 — Medicine catalog. Schema 1-1 với BE
// `farm_os_be/src/modules/medicine/medicine.model.ts`. KHÔNG được lệch field
// vì BE Zod `.strict()` → field thừa = 422 UNRECOGNIZED.

// MedicineForm enum mirror prisma `MedicineForm`. Các dạng phù hợp với thuốc
// BVTV / nông nghiệp (WP, EC, SC, GR, ...) thay cho dạng thuốc động vật / người.
export const MedicineFormSchema = z.enum([
  "POWDER",
  "WETTABLE_POWDER",
  "LIQUID",
  "EMULSIFIABLE_CONCENTRATE",
  "SUSPENSION_CONCENTRATE",
  "GRANULE",
  "FUMIGANT",
  "OTHER",
]);

export type MedicineFormType = z.infer<typeof MedicineFormSchema>;

// Label tiếng Việt cho form (dùng ở Select + table).
export const MEDICINE_FORM_LABEL: Record<MedicineFormType, string> = {
  POWDER: "Bột",
  WETTABLE_POWDER: "Bột thấm nước (WP)",
  LIQUID: "Dung dịch (SL)",
  EMULSIFIABLE_CONCENTRATE: "Nhũ dầu (EC)",
  SUSPENSION_CONCENTRATE: "Huyền phù (SC)",
  GRANULE: "Dạng hạt (GR)",
  FUMIGANT: "Khí xông hơi",
  OTHER: "Khác",
};

// ── Response schema ──────────────────────────────────────────────────────
export const MedicineResSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  scientificName: z.string().nullable(),
  form: MedicineFormSchema,
  unit: z.string(),
  strength: z.string().nullable(),
  // BE `z.any().nullable()` cho speciesScope + metadata; FE giữ nguyên.
  speciesScope: z.unknown().nullable(),
  contraindications: z.string().nullable(),
  sideEffects: z.string().nullable(),
  withdrawalPeriodDays: z.number().int().nullable(),
  isActive: z.boolean(),
  metadata: z.unknown().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ── Body schemas ─────────────────────────────────────────────────────────
// BE strict — chỉ accept đúng các field bên dưới.
export const CreateMedicineBodySchema = z.object({
  code: z
    .string()
    .min(1, "Mã thuốc không được để trống.")
    .max(64, "Mã tối đa 64 ký tự."),
  name: z
    .string()
    .min(1, "Tên thuốc không được để trống.")
    .max(255, "Tên tối đa 255 ký tự."),
  scientificName: z.string().max(255).optional(),
  form: MedicineFormSchema,
  unit: z
    .string()
    .min(1, "Đơn vị không được để trống.")
    .max(50, "Đơn vị tối đa 50 ký tự."),
  strength: z.string().max(100).optional(),
  speciesScope: z.unknown().optional(),
  contraindications: z.string().optional(),
  sideEffects: z.string().optional(),
  withdrawalPeriodDays: z
    .number()
    .int()
    .nonnegative()
    .optional(),
  metadata: z.unknown().optional(),
});

// BE PATCH — partial + nullable cho field text (cho phép set null để xoá).
export const UpdateMedicineBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  scientificName: z.string().max(255).nullable().optional(),
  form: MedicineFormSchema.optional(),
  unit: z.string().min(1).max(50).optional(),
  strength: z.string().max(100).nullable().optional(),
  speciesScope: z.unknown().optional(),
  contraindications: z.string().nullable().optional(),
  sideEffects: z.string().nullable().optional(),
  withdrawalPeriodDays: z.number().int().nonnegative().nullable().optional(),
  metadata: z.unknown().optional(),
});

export const ToggleMedicineBodySchema = z.object({ isActive: z.boolean() });

// ── List query (admin) — BE field name `q`, có `species` ──
export const ListMedicinesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  species: z.string().optional(),
});

export const MedicineListResSchema = PagingResponseSchema(MedicineResSchema);

// ── Catalog (doctor B10) — KHÔNG có pagination, chỉ q + species ──
export const MedicineCatalogQuerySchema = z.object({
  q: z.string().optional(),
  species: z.string().optional(),
});

export const MedicineCatalogResSchema = z.object({
  data: z.array(MedicineResSchema),
});

// ── Free-text stats (B13) — chỉ flat array {customMedicineName, count}, no pagination ──
export const FreetextMedicineStatRowSchema = z.object({
  customMedicineName: z.string(),
  count: z.number().int().nonnegative(),
});

export const FreetextMedicineStatListResSchema = z.object({
  data: z.array(FreetextMedicineStatRowSchema),
});

// ── Type exports ─────────────────────────────────────────────────────────
export type MedicineResType = z.infer<typeof MedicineResSchema>;
export type CreateMedicineBodyType = z.infer<typeof CreateMedicineBodySchema>;
export type UpdateMedicineBodyType = z.infer<typeof UpdateMedicineBodySchema>;
export type ToggleMedicineBodyType = z.infer<typeof ToggleMedicineBodySchema>;
export type ListMedicinesQueryType = z.infer<typeof ListMedicinesQuerySchema>;
export type MedicineListResType = z.infer<typeof MedicineListResSchema>;
export type MedicineCatalogQueryType = z.infer<
  typeof MedicineCatalogQuerySchema
>;
export type MedicineCatalogResType = z.infer<typeof MedicineCatalogResSchema>;
export type FreetextMedicineStatRowType = z.infer<
  typeof FreetextMedicineStatRowSchema
>;
export type FreetextMedicineStatListResType = z.infer<
  typeof FreetextMedicineStatListResSchema
>;
