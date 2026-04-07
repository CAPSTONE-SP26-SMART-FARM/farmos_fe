import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";
import { z } from "zod";

// ============================================================
// Enums
// ============================================================

export const FarmTypeEnum = z.enum(["cultivation", "livestock", "mixed"]);
export type FarmTypeType = z.infer<typeof FarmTypeEnum>;

// ============================================================
// Item schemas
// ============================================================

export const MilestoneTemplateItemResSchema = z.object({
  id: z.string().uuid(),
  itemType: z.enum(["activity", "metric", "condition"]).nullable(),
  stageName: z.string(),
  milestoneOrder: z.number().int(),
  daysBetween: z.number().nullable(),
});

export const MilestoneTemplateItemInputSchema = z.object({
  stageName: z.string().min(1, "Stage name is required").max(100),
  milestoneOrder: z.number().int().positive("Must be a positive integer"),
  daysBetween: z.number().int().nonnegative().nullable().optional(),
});

// ============================================================
// Template schemas
// ============================================================

export const MilestoneTemplateResSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.literal("crop_season"),
  farmType: FarmTypeEnum,
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  items: z.array(MilestoneTemplateItemResSchema),
});

export const CreateMilestoneTemplateBodySchema = z
  .object({
    name: z.string().min(1, "Name is required").max(255),
    description: z.string().max(5000).nullable().optional(),
    type: z.literal("crop_season"),
    farmType: FarmTypeEnum,
    isActive: z.boolean().default(true),
    items: z.array(MilestoneTemplateItemInputSchema).optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (!data.items?.length) return;
    const seen = new Set<number>();
    data.items.forEach((item, i) => {
      if (seen.has(item.milestoneOrder)) {
        ctx.addIssue({
          code: "custom",
          message: "Milestone order must be unique",
          path: ["items", i, "milestoneOrder"],
        });
      }
      seen.add(item.milestoneOrder);
    });
  });

export const UpdateMilestoneTemplateBodySchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(5000).nullable().optional(),
    farmType: FarmTypeEnum.optional(),
    isActive: z.boolean().optional(),
    items: z.array(MilestoneTemplateItemInputSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.items?.length) return;
    const seen = new Set<number>();
    data.items.forEach((item, i) => {
      if (seen.has(item.milestoneOrder)) {
        ctx.addIssue({
          code: "custom",
          message: "Milestone order must be unique",
          path: ["items", i, "milestoneOrder"],
        });
      }
      seen.add(item.milestoneOrder);
    });
  });

export const ListMilestoneTemplatesQuerySchema = PagingRequestSchema.extend({
  type: z.literal("crop_season").optional(),
}).strict();

export const ListMilestoneTemplatesResSchema = PagingResponseSchema(
  MilestoneTemplateResSchema,
);

// ============================================================
// Types
// ============================================================

export type MilestoneTemplateItemResType = z.infer<
  typeof MilestoneTemplateItemResSchema
>;
export type MilestoneTemplateItemInputType = z.infer<
  typeof MilestoneTemplateItemInputSchema
>;
export type MilestoneTemplateResType = z.infer<
  typeof MilestoneTemplateResSchema
>;
export type CreateMilestoneTemplateBodyType = z.infer<
  typeof CreateMilestoneTemplateBodySchema
>;
export type UpdateMilestoneTemplateBodyType = z.infer<
  typeof UpdateMilestoneTemplateBodySchema
>;
export type ListMilestoneTemplatesQueryType = z.infer<
  typeof ListMilestoneTemplatesQuerySchema
>;
export type ListMilestoneTemplatesResType = z.infer<
  typeof ListMilestoneTemplatesResSchema
>;
