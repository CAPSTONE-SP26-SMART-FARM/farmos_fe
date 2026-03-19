import { z } from "zod";
import { PagingRequestSchema, PagingResponseSchema } from "./api";

export const ProductionStatusName = {
  Planning: "planning",
  Sent: "sent",
  Approved: "approved",
  Rejected: "rejected",
  Active: "active",
  Completed: "completed",
  Cancelled: "cancelled",
} as const;

export type ProductionStatusNameType =
  (typeof ProductionStatusName)[keyof typeof ProductionStatusName];

export const ProductionRequestStatusName = {
  Pending: "pending",
  Approved: "approved",
  Rejected: "rejected",
} as const;

export type ProductionRequestStatusNameType =
  (typeof ProductionRequestStatusName)[keyof typeof ProductionRequestStatusName];

export const CropSeasonSchema = z.object({
  id: z.string().uuid(),
  zoneId: z.string().uuid(),
  cropName: z.string(),
  variety: z.string().nullable(),
  plantDate: z.string(),
  expectedHarvestDate: z.string(),
  actualHarvestDate: z.string().nullable(),
  stageChangedAt: z.string(),
  totalAreaSqm: z.number().nullable(),
  plantCount: z.number().nullable(),
  status: z.enum([
    "planning",
    "sent",
    "approved",
    "rejected",
    "active",
    "completed",
    "cancelled",
  ]),
  notes: z.string().nullable(),
  createdBy: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CropSeasonType = z.infer<typeof CropSeasonSchema>;

export const ProductionRequestSchema = z.object({
  id: z.string().uuid(),
  productionId: z.string().uuid(),
  senderId: z.string().uuid(),
  sentAt: z.string(),
  replierId: z.string().uuid().nullable(),
  repliedAt: z.string().nullable(),
  description: z.string().nullable(),
  status: z.enum(["pending", "approved", "rejected"]),
  cropSeason: CropSeasonSchema.optional(),
});

export type ProductionRequestType = z.infer<typeof ProductionRequestSchema>;

export const CreateCropSeasonBodySchema = z.object({
  zoneId: z.string().uuid("Zone ID không hợp lệ"),
  cropName: z.string().min(1, "Tên cây trồng không được để trống").max(255),
  variety: z.string().optional(),
  plantDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải theo định dạng YYYY-MM-DD"),
  expectedHarvestDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải theo định dạng YYYY-MM-DD"),
  totalAreaSqm: z.number().positive().optional(),
  plantCount: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export type CreateCropSeasonBodyType = z.infer<
  typeof CreateCropSeasonBodySchema
>;

export const UpdateCropSeasonBodySchema = z.object({
  cropName: z.string().min(1).max(255).optional(),
  variety: z.string().optional(),
  plantDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải theo định dạng YYYY-MM-DD")
    .optional(),
  expectedHarvestDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải theo định dạng YYYY-MM-DD")
    .optional(),
  totalAreaSqm: z.number().positive().optional(),
  plantCount: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export type UpdateCropSeasonBodyType = z.infer<
  typeof UpdateCropSeasonBodySchema
>;

export const SendProductionRequestBodySchema = z.object({
  description: z.string().optional(),
});

export type SendProductionRequestBodyType = z.infer<
  typeof SendProductionRequestBodySchema
>;

export const ReplyProductionRequestBodySchema = z
  .object({
    status: z.enum(["approved", "rejected"]),
    description: z.string().optional(),
  })
  .superRefine(({ status, description }, ctx) => {
    if (status === "rejected" && (!description || description.trim() === "")) {
      ctx.addIssue({
        code: "custom",
        message: "Lý do từ chối không được để trống",
        path: ["description"],
      });
    }
  });

export type ReplyProductionRequestBodyType = z.infer<
  typeof ReplyProductionRequestBodySchema
>;

export const ListCropSeasonsQuerySchema = PagingRequestSchema.extend({
  status: z
    .enum([
      "planning",
      "sent",
      "approved",
      "rejected",
      "active",
      "completed",
      "cancelled",
    ])
    .optional(),
  sort: z
    .enum([
      "createdAt:asc",
      "createdAt:desc",
      "updatedAt:asc",
      "updatedAt:desc",
    ])
    .optional(),
});

export type ListCropSeasonsQueryType = z.infer<
  typeof ListCropSeasonsQuerySchema
>;

export const ListProductionRequestsQuerySchema = PagingRequestSchema.extend({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  sort: z
    .enum([
      "createdAt:asc",
      "createdAt:desc",
      "repliedAt:asc",
      "repliedAt:desc",
    ])
    .optional(),
});

export type ListProductionRequestsQueryType = z.infer<
  typeof ListProductionRequestsQuerySchema
>;

export const ListCropSeasonsResSchema = PagingResponseSchema(CropSeasonSchema);
export type ListCropSeasonsResType = z.infer<typeof ListCropSeasonsResSchema>;

export const ListProductionRequestsResSchema = PagingResponseSchema(
  ProductionRequestSchema,
);
export type ListProductionRequestsResType = z.infer<
  typeof ListProductionRequestsResSchema
>;
