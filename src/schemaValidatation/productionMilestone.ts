import { z } from "zod";
import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";

export const ProductionMilestoneStatusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
]);
export type ProductionMilestoneStatusType = z.infer<
  typeof ProductionMilestoneStatusSchema
>;

const DateOnlyStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .optional();

export const CreateProductionMilestoneItemBodySchema = z.object({
  stageName: z.string().min(1).max(100),
  milestoneOrder: z.number().int().positive(),
  expectedStartDate: DateOnlyStringSchema,
  actualStartDate: DateOnlyStringSchema,
  expectedEndDate: DateOnlyStringSchema,
  actualEndDate: DateOnlyStringSchema,
  status: ProductionMilestoneStatusSchema.optional(),
});

export const UpdateProductionMilestoneBodySchema = z
  .object({
    stageName: z.string().min(1).max(100).optional(),
    milestoneOrder: z.number().int().positive().optional(),
    expectedStartDate: DateOnlyStringSchema,
    expectedEndDate: DateOnlyStringSchema,
    actualStartDate: DateOnlyStringSchema,
    actualEndDate: DateOnlyStringSchema,
    status: ProductionMilestoneStatusSchema.optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field is required",
  });

export const ProductionMilestoneResSchema = z.object({
  id: z.string().uuid(),
  cropSeasonId: z.string().uuid().nullable(),
  stageName: z.string(),
  milestoneOrder: z.number().int(),
  expectedStartDate: z.string().nullable(),
  actualStartDate: z.string().nullable(),
  expectedEndDate: z.string().nullable(),
  actualEndDate: z.string().nullable(),
  status: ProductionMilestoneStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ListProductionMilestonesQuerySchema = PagingRequestSchema.extend({
  status: ProductionMilestoneStatusSchema.optional(),
});

export const ListProductionMilestonesResSchema = PagingResponseSchema(
  ProductionMilestoneResSchema,
);

export type ProductionMilestoneResType = z.infer<
  typeof ProductionMilestoneResSchema
>;
export type ListProductionMilestonesQueryType = z.infer<
  typeof ListProductionMilestonesQuerySchema
>;
export type ListProductionMilestonesResType = z.infer<
  typeof ListProductionMilestonesResSchema
>;
export type CreateProductionMilestoneItemBodyType = z.infer<
  typeof CreateProductionMilestoneItemBodySchema
>;
export type UpdateProductionMilestoneBodyType = z.infer<
  typeof UpdateProductionMilestoneBodySchema
>;
