import { z } from "zod";
import { PagingResponseSchema } from "@/types/api";

// Harvest Record — mirror BE
// `farm_os_be/src/modules/harvest-record/harvest-record.model.ts`.
// Endpoint set:
//   POST   /harvest-records/zone/:zoneId   (owner|manager)
//   GET    /harvest-records/zone/:zoneId   (paginated)
//   GET    /harvest-records/:id
//   PATCH  /harvest-records/:id
//   DELETE /harvest-records/:id            (204)

// ── Response ──────────────────────────────────────────────────────────────
// `harvestDate` BE serializes as `YYYY-MM-DD` (date only).
// `quantity` BE Decimal(10,2) → number qua repo.serialize.
// `zoneId` được inject từ relation cropSeason.zoneId (không có cột riêng).
export const HarvestRecordResSchema = z.object({
  id: z.string().uuid(),
  cropSeasonId: z.string().uuid().nullable(),
  milestoneId: z.string().uuid().nullable(),
  zoneId: z.string().uuid(),
  harvestDate: z.string(), // YYYY-MM-DD
  quantity: z.number(),
  unit: z.string(),
  qualityGrade: z.string().nullable(),
  notes: z.string().nullable(),
  createdBy: z.string().uuid(),
  createdAt: z.string(),
});

export type HarvestRecordResType = z.infer<typeof HarvestRecordResSchema>;

// ── Create body ───────────────────────────────────────────────────────────
// Form state lưu `harvestDate` dạng `YYYY-MM-DD` (theo docs §5.1) —
// service sẽ convert sang ISO trước khi gửi.
export const CreateHarvestRecordBodySchema = z.object({
  cropSeasonId: z.string().uuid("Mùa vụ không hợp lệ."),
  milestoneId: z.string().uuid().optional(),
  harvestDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày thu hoạch phải có định dạng YYYY-MM-DD."),
  quantity: z
    .number({ error: "Sản lượng phải là số." })
    .positive("Sản lượng phải lớn hơn 0."),
  unit: z
    .string()
    .min(1, "Đơn vị không được để trống.")
    .max(20, "Đơn vị tối đa 20 ký tự."),
  qualityGrade: z
    .string()
    .max(50, "Phẩm cấp tối đa 50 ký tự.")
    .optional(),
  notes: z.string().optional(),
});

export type CreateHarvestRecordBodyType = z.infer<
  typeof CreateHarvestRecordBodySchema
>;

// ── Update body ───────────────────────────────────────────────────────────
// BE `.strict()` — chỉ accept đúng 5 field bên dưới, không có `cropSeasonId`
// hay `milestoneId`. Field optional KHÔNG nullable → clear field = gửi
// `undefined` (bị JSON.stringify bỏ qua), KHÔNG gửi `null`.
export const UpdateHarvestRecordBodySchema = z.object({
  harvestDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày thu hoạch phải có định dạng YYYY-MM-DD.")
    .optional(),
  quantity: z
    .number({ error: "Sản lượng phải là số." })
    .positive("Sản lượng phải lớn hơn 0.")
    .optional(),
  unit: z
    .string()
    .min(1, "Đơn vị không được để trống.")
    .max(20, "Đơn vị tối đa 20 ký tự.")
    .optional(),
  qualityGrade: z
    .string()
    .max(50, "Phẩm cấp tối đa 50 ký tự.")
    .optional(),
  notes: z.string().optional(),
});

export type UpdateHarvestRecordBodyType = z.infer<
  typeof UpdateHarvestRecordBodySchema
>;

// ── List query ────────────────────────────────────────────────────────────
// BE accepts page/limit + optional fromDate/toDate (YYYY-MM-DD).
export const ListHarvestRecordsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  fromDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  toDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export type ListHarvestRecordsQueryType = z.infer<
  typeof ListHarvestRecordsQuerySchema
>;

export const ListHarvestRecordsResSchema = PagingResponseSchema(
  HarvestRecordResSchema,
);
export type ListHarvestRecordsResType = z.infer<
  typeof ListHarvestRecordsResSchema
>;
