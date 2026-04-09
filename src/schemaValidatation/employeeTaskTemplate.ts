import { z } from "zod";
import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";

// ── Enums ──────────────────────────────────────────────────────────────

export const EmployeeTaskTemplateTypeSchema = z.enum(["task"]);

export const FarmTypeForTaskTemplateSchema = z.enum(["cultivation"]);

export const EmployeeTaskItemPrioritySchema = z.enum([
  "low",
  "normal",
  "high",
  "urgent",
]);

// ── Item schemas ───────────────────────────────────────────────────────

export const EmployeeTaskTemplateItemInputSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc").max(255),
  description: z.string().max(5000).nullable().optional(),
  priority: EmployeeTaskItemPrioritySchema.default("normal"),
});

export const EmployeeTaskTemplateItemResSchema = z.object({
  id: z.string().uuid(),
  itemType: z.enum(["activity", "metric", "condition"]).nullable(),
  title: z.string(),
  description: z.string().nullable(),
  priority: EmployeeTaskItemPrioritySchema,
});

// ── Template response ──────────────────────────────────────────────────

export const EmployeeTaskTemplateResSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  type: EmployeeTaskTemplateTypeSchema,
  farmType: FarmTypeForTaskTemplateSchema,
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  items: z.array(EmployeeTaskTemplateItemResSchema),
});

// ── Create body ────────────────────────────────────────────────────────

export const CreateEmployeeTaskTemplateBodySchema = z
  .object({
    name: z.string().min(1, "Tên template là bắt buộc").max(255),
    description: z.string().max(5000).nullable().optional(),
    type: EmployeeTaskTemplateTypeSchema,
    farmType: FarmTypeForTaskTemplateSchema,
    isActive: z.boolean().default(true),
    items: z.array(EmployeeTaskTemplateItemInputSchema).optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (!data.items.length) return;
    const seen = new Set<string>();
    for (let i = 0; i < data.items.length; i++) {
      const t = data.items[i].title.trim().toLowerCase();
      if (seen.has(t)) {
        ctx.addIssue({
          code: "custom",
          message: "Tiêu đề nhiệm vụ bị trùng lặp",
          path: ["items", i, "title"],
        });
        return;
      }
      seen.add(t);
    }
  });

// ── Update body ────────────────────────────────────────────────────────

export const UpdateEmployeeTaskTemplateBodySchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(5000).nullable().optional(),
    type: EmployeeTaskTemplateTypeSchema.optional(),
    farmType: FarmTypeForTaskTemplateSchema.optional(),
    isActive: z.boolean().optional(),
    items: z.array(EmployeeTaskTemplateItemInputSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.items?.length) return;
    const seen = new Set<string>();
    for (let i = 0; i < data.items.length; i++) {
      const t = data.items[i].title.trim().toLowerCase();
      if (seen.has(t)) {
        ctx.addIssue({
          code: "custom",
          message: "Tiêu đề nhiệm vụ bị trùng lặp",
          path: ["items", i, "title"],
        });
        return;
      }
      seen.add(t);
    }
  });

// ── List query ─────────────────────────────────────────────────────────

export const ListEmployeeTaskTemplatesQuerySchema = PagingRequestSchema.extend({
  type: EmployeeTaskTemplateTypeSchema.optional(),
});

// ── List response ──────────────────────────────────────────────────────

export const ListEmployeeTaskTemplatesResSchema = PagingResponseSchema(
  EmployeeTaskTemplateResSchema,
);

// ── Type exports ───────────────────────────────────────────────────────

export type EmployeeTaskTemplateItemResType = z.infer<
  typeof EmployeeTaskTemplateItemResSchema
>;
export type EmployeeTaskTemplateResType = z.infer<
  typeof EmployeeTaskTemplateResSchema
>;
export type CreateEmployeeTaskTemplateBodyType = z.infer<
  typeof CreateEmployeeTaskTemplateBodySchema
>;
export type UpdateEmployeeTaskTemplateBodyType = z.infer<
  typeof UpdateEmployeeTaskTemplateBodySchema
>;
export type ListEmployeeTaskTemplatesQueryType = z.infer<
  typeof ListEmployeeTaskTemplatesQuerySchema
>;
export type ListEmployeeTaskTemplatesResType = z.infer<
  typeof ListEmployeeTaskTemplatesResSchema
>;
