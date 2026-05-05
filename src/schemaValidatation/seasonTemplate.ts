import { z } from "zod";

// Module 6 — Crop Season Template. Mirror 1-1 với BE
// `farm_os_be/src/modules/season-template/season-template.model.ts`.
// BE Zod `.strict()` → field thừa = 422 UNRECOGNIZED.

// ── Enums ─────────────────────────────────────────────────────────────────

export const FarmTypeSchema = z.enum(["cultivation", "livestock", "mixed"]);
export type FarmTypeT = z.infer<typeof FarmTypeSchema>;

export const FARM_TYPE_LABEL: Record<FarmTypeT, string> = {
  cultivation: "Trồng trọt",
  livestock: "Chăn nuôi",
  mixed: "Hỗn hợp",
};

export const TemplateItemTypeSchema = z.enum([
  "activity",
  "metric",
  "condition",
]);
export type TemplateItemTypeT = z.infer<typeof TemplateItemTypeSchema>;

export const SensorTypeSchema = z.enum([
  "soil_moisture",
  "air_temperature",
  "air_humidity",
  "light_intensity",
]);
export type SensorTypeT = z.infer<typeof SensorTypeSchema>;

export const SENSOR_TYPE_LABEL: Record<SensorTypeT, string> = {
  soil_moisture: "Độ ẩm đất",
  air_temperature: "Nhiệt độ không khí",
  air_humidity: "Độ ẩm không khí",
  light_intensity: "Cường độ ánh sáng",
};

export const PrioritySchema = z.enum(["low", "medium", "high"]);
export type PriorityT = z.infer<typeof PrioritySchema>;

export const PRIORITY_LABEL: Record<PriorityT, string> = {
  low: "Thấp",
  medium: "Vừa",
  high: "Cao",
};

// ── Item config (discriminated union) ────────────────────────────────────

export const MilestoneConfigSchema = z
  .object({
    kind: z.literal("milestone"),
    stageName: z.string().min(1).max(100),
    milestoneOrder: z.number().int().nonnegative(),
    dayOffset: z.number().int().nonnegative(),
    expectedDuration: z.number().int().positive(),
    suggestedNotes: z.string().nullable().optional(),
  })
  .strict();

export const TaskConfigSchema = z
  .object({
    kind: z.literal("task"),
    title: z.string().min(1).max(255),
    description: z.string().nullable().optional(),
    priority: PrioritySchema.optional(),
    expectedDurationDays: z.number().int().positive().optional(),
    parentMilestoneOrder: z.number().int().nonnegative(),
  })
  .strict();

export const ThresholdConfigSchema = z
  .object({
    kind: z.literal("threshold"),
    sensorType: SensorTypeSchema,
    optimalMin: z.number(),
    optimalMax: z.number(),
    parentMilestoneOrder: z.number().int().nonnegative().nullable().optional(),
  })
  .strict();

export const TemplateItemConfigSchema = z.discriminatedUnion("kind", [
  MilestoneConfigSchema,
  TaskConfigSchema,
  ThresholdConfigSchema,
]);
export type TemplateItemConfigT = z.infer<typeof TemplateItemConfigSchema>;
export type MilestoneConfigT = z.infer<typeof MilestoneConfigSchema>;
export type TaskConfigT = z.infer<typeof TaskConfigSchema>;
export type ThresholdConfigT = z.infer<typeof ThresholdConfigSchema>;

export const TemplateItemInputSchema = z
  .object({
    itemType: TemplateItemTypeSchema,
    orderNo: z.number().int().nonnegative().default(0),
    config: TemplateItemConfigSchema,
  })
  .strict();
export type TemplateItemInputT = z.infer<typeof TemplateItemInputSchema>;

// ── Body ──────────────────────────────────────────────────────────────────

export const CreateSeasonTemplateBodySchema = z
  .object({
    name: z.string().min(1, "Tên mẫu là bắt buộc.").max(255),
    description: z.string().nullable().optional(),
    farmType: FarmTypeSchema,
    items: z
      .array(TemplateItemInputSchema)
      .min(1, "Mẫu phải có ít nhất 1 mục.")
      .max(500),
  })
  .strict();
export type CreateSeasonTemplateBodyT = z.infer<
  typeof CreateSeasonTemplateBodySchema
>;

export const PatchSeasonTemplateBodySchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().nullable().optional(),
    farmType: FarmTypeSchema.optional(),
    items: z.array(TemplateItemInputSchema).min(1).max(500).optional(),
  })
  .strict();
export type PatchSeasonTemplateBodyT = z.infer<
  typeof PatchSeasonTemplateBodySchema
>;

export const ListSeasonTemplatesQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  farmType: FarmTypeSchema.optional(),
  search: z.string().min(1).max(100).optional(),
  includeInactive: z.boolean().optional(),
});
export type ListSeasonTemplatesQueryT = z.infer<
  typeof ListSeasonTemplatesQuerySchema
>;

// ── Response ──────────────────────────────────────────────────────────────

export const SeasonTemplateItemResSchema = z.object({
  id: z.string().uuid(),
  itemType: TemplateItemTypeSchema,
  orderNo: z.number().int(),
  config: z.unknown(),
});
export type SeasonTemplateItemResT = z.infer<typeof SeasonTemplateItemResSchema>;

export const SeasonTemplateResSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  type: z.string().nullable(),
  farmType: FarmTypeSchema.nullable(),
  version: z.number().int().nullable(),
  isActive: z.boolean().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  itemCount: z.number().int().nonnegative(),
});
export type SeasonTemplateResT = z.infer<typeof SeasonTemplateResSchema>;

export const SeasonTemplateDetailResSchema = SeasonTemplateResSchema.extend({
  items: z.array(SeasonTemplateItemResSchema),
});
export type SeasonTemplateDetailResT = z.infer<
  typeof SeasonTemplateDetailResSchema
>;

export const SeasonTemplateListResSchema = z.object({
  data: z.array(SeasonTemplateResSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
  }),
});
export type SeasonTemplateListResT = z.infer<
  typeof SeasonTemplateListResSchema
>;

export const ActionResSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean().nullable(),
  deletedAt: z.string().nullable(),
});
export type ActionResT = z.infer<typeof ActionResSchema>;

export const UsageItemSchema = z.object({
  cropSeasonId: z.string().uuid(),
  productionRequestId: z.string().uuid(),
  capturedAt: z.string(),
  appliedTemplateVersion: z.number().int().nullable(),
  cropName: z.string().nullable(),
});
export type UsageItemT = z.infer<typeof UsageItemSchema>;

export const UsageResSchema = z.object({
  templateId: z.string().uuid(),
  totalUsage: z.number().int().nonnegative(),
  data: z.array(UsageItemSchema),
});
export type UsageResT = z.infer<typeof UsageResSchema>;

// ── Preview / applied-info ────────────────────────────────────────────────

export const PreviewFromTemplateBodySchema = z
  .object({
    templateId: z.string().uuid(),
    startDate: z.string(),
    farmType: FarmTypeSchema.optional(),
  })
  .strict();
export type PreviewFromTemplateBodyT = z.infer<
  typeof PreviewFromTemplateBodySchema
>;

export const PreviewMilestoneSchema = z.object({
  stageName: z.string(),
  milestoneOrder: z.number().int(),
  expectedStartDate: z.string(),
  expectedEndDate: z.string(),
  suggestedNotes: z.string().nullable().optional(),
  tasks: z.array(
    z.object({
      title: z.string(),
      description: z.string().nullable().optional(),
      priority: z.string().nullable().optional(),
      expectedDurationDays: z.number().int().nullable().optional(),
    }),
  ),
  thresholds: z.array(
    z.object({
      sensorType: z.string(),
      optimalMin: z.number(),
      optimalMax: z.number(),
    }),
  ),
});
export type PreviewMilestoneT = z.infer<typeof PreviewMilestoneSchema>;

export const PreviewFromTemplateResSchema = z.object({
  meta: z.object({
    appliedTemplateId: z.string().uuid(),
    appliedTemplateVersion: z.number().int().nullable(),
    appliedAt: z.string(),
    templateName: z.string().nullable(),
  }),
  milestones: z.array(PreviewMilestoneSchema),
  seasonLevelThresholds: z.array(
    z.object({
      sensorType: z.string(),
      optimalMin: z.number(),
      optimalMax: z.number(),
    }),
  ),
});
export type PreviewFromTemplateResT = z.infer<
  typeof PreviewFromTemplateResSchema
>;

export const AppliedTemplateInfoResSchema = z.object({
  cropSeasonId: z.string().uuid(),
  appliedTemplate: z
    .object({
      templateId: z.string().uuid(),
      version: z.number().int().nullable(),
      appliedAt: z.string(),
      templateName: z.string().nullable(),
    })
    .nullable(),
});
export type AppliedTemplateInfoResT = z.infer<
  typeof AppliedTemplateInfoResSchema
>;
