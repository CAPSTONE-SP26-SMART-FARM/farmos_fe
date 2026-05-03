import { z } from "zod";

// ── Legacy schema (luồng cũ — chỉ medicineName + dosage) ──────────────────
// Giữ cho `DoctorTicketsPage.tsx` legacy + Owner/Manager khi feature flag off.
// Module 3 v2 dùng PrescriptionResSchema bên dưới (BE shape mới).

export const PrescriptionLegacyResSchema = z.object({
  id: z.string().uuid(),
  ticketId: z.string().uuid(),
  medicineName: z.string(),
  dosage: z.string(),
  createdAt: z.string().datetime(),
});

export const CreatePrescriptionBodySchema = z.object({
  medicineName: z.string().min(1, "Tên thuốc không được để trống.").max(255),
  dosage: z.string().min(1, "Liều dùng không được để trống.").max(255),
});

export const ListPrescriptionQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

export const PrescriptionLegacyListResSchema = z.object({
  data: z.array(PrescriptionLegacyResSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
});

// Aliases cho code legacy.
export const PrescriptionResSchema = PrescriptionLegacyResSchema;
export const PrescriptionListResSchema = PrescriptionLegacyListResSchema;

export type PrescriptionLegacyResType = z.infer<
  typeof PrescriptionLegacyResSchema
>;
export type PrescriptionResType = PrescriptionLegacyResType;
export type CreatePrescriptionBodyType = z.infer<
  typeof CreatePrescriptionBodySchema
>;
export type ListPrescriptionQueryType = z.infer<
  typeof ListPrescriptionQuerySchema
>;
export type PrescriptionListResType = z.infer<
  typeof PrescriptionLegacyListResSchema
>;

// ── Module 3 v2 — Prescription có cấu trúc items ─────────────────────────
// Schema 1-1 với BE
// `farm_os_be/src/modules/ticket-lifecycle/ticket-lifecycle.model.ts:144-173`.
//
// CHÚ Ý field naming khác legacy:
//  - BE dùng `usageInstructions` (không phải `instructions`).
//  - BE dùng `authorId` (không phải `createdBy`).
//  - BE dùng `generalNotes` cho Prescription, `orderIndex` cho Item.
//  - BE có `medicineName` denormalized (string nullable) ở Item — render fallback.
//  - BE có `withdrawalPeriodDays` snapshot ở Item ✓.
//  - BE prisma enum `PrescriptionStatus`. KHÔNG có `supersededById` ở response.

// BE prisma enum.
export const PrescriptionStatusSchema = z.enum([
  "ISSUED",
  "SUPERSEDED",
  "CANCELLED",
]);

export const PrescriptionItemResSchema = z.object({
  id: z.string().uuid(),
  prescriptionId: z.string().uuid(),
  medicineId: z.string().uuid().nullable(),
  customMedicineName: z.string().nullable(),
  dosage: z.string(),
  route: z.string().nullable(),
  frequency: z.string(),
  durationDays: z.number().int().nullable(),
  // BE: `usageInstructions` (BR-76 ≥30 chars).
  usageInstructions: z.string(),
  warnings: z.string().nullable(),
  orderIndex: z.number().int(),
  // Snapshot tại thời điểm kê (BE đã include — decision 9.11 đã trả lời).
  withdrawalPeriodDays: z.number().int().nullable(),
  // Denormalized tên hiển thị (medicine.name lúc kê hoặc customMedicineName).
  medicineName: z.string().nullable(),
  createdAt: z.string().datetime(),
});

// PrescriptionResSchema mới (V2 — đổi tên để không trùng legacy).
export const PrescriptionWithItemsResSchema = z.object({
  id: z.string().uuid(),
  ticketId: z.string().uuid(),
  authorId: z.string().uuid(),
  status: PrescriptionStatusSchema,
  generalNotes: z.string().nullable(),
  createdAt: z.string().datetime(),
  items: z.array(PrescriptionItemResSchema),
});

// ── Body schemas (B2 resolve + B3 prescription create) ──
// BE B2/B3 nested item schema — XOR medicineId vs customMedicineName.
export const PrescriptionItemInputSchema = z
  .object({
    medicineId: z.string().uuid().nullable().optional(),
    customMedicineName: z.string().max(255).nullable().optional(),
    dosage: z.string().min(1).max(255),
    route: z.string().max(100).nullable().optional(),
    frequency: z.string().min(1).max(255),
    durationDays: z.number().int().nonnegative().nullable().optional(),
    usageInstructions: z
      .string()
      .min(30, "Hướng dẫn sử dụng tối thiểu 30 ký tự (BR-76)."),
    warnings: z.string().nullable().optional(),
    orderIndex: z.number().int().nonnegative().default(0),
  })
  .refine(
    (v) => Boolean(v.medicineId) !== Boolean(v.customMedicineName),
    {
      message:
        "Phải chọn 1 trong 2: thuốc từ catalog HOẶC tên thuốc tự nhập.",
      path: ["medicineId"],
    },
  );

// BE B3: POST /ticket/:id/prescriptions (extend) — items + reissue flag.
export const CreatePrescriptionV2BodySchema = z.object({
  generalNotes: z.string().nullable().optional(),
  items: z.array(PrescriptionItemInputSchema).min(1),
  reissue: z.boolean().optional(),
});

export type PrescriptionStatusType = z.infer<typeof PrescriptionStatusSchema>;
export type PrescriptionItemResType = z.infer<typeof PrescriptionItemResSchema>;
export type PrescriptionWithItemsResType = z.infer<
  typeof PrescriptionWithItemsResSchema
>;
export type PrescriptionItemInputType = z.infer<
  typeof PrescriptionItemInputSchema
>;
export type CreatePrescriptionV2BodyType = z.infer<
  typeof CreatePrescriptionV2BodySchema
>;
