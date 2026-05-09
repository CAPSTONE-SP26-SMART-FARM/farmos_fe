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

const RequiredDateOnlyStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/);

export const CreateProductionMilestoneItemBodySchema = z.object({
  stageName: z.string().min(1).max(100),
  milestoneOrder: z.number().int().positive(),
  expectedStartDate: RequiredDateOnlyStringSchema,
  actualStartDate: DateOnlyStringSchema,
  expectedEndDate: RequiredDateOnlyStringSchema,
  actualEndDate: DateOnlyStringSchema,
  status: ProductionMilestoneStatusSchema.optional(),
});

export const CreateProductionMilestoneBatchBodySchema = z.object({
  items: z.array(CreateProductionMilestoneItemBodySchema).min(1),
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

// ── IoT Config (per-milestone) ────────────────────────────────────────────────
export const IOT_CONFIG_ALLOWED_SENSOR_TYPES = [
  "soil_moisture",
  "air_temperature",
  "air_humidity",
  "light_intensity",
] as const;

export const IotConfigSensorTypeSchema = z.enum(IOT_CONFIG_ALLOWED_SENSOR_TYPES);

const iotConfigStoredShape = {
  readingIntervalSeconds: z.number().int().min(10).max(3600),
  staleThresholdSeconds: z.number().int().min(10).max(3600),
  sensorTypes: z
    .array(IotConfigSensorTypeSchema)
    .min(1)
    .max(IOT_CONFIG_ALLOWED_SENSOR_TYPES.length),
};

const refineSensorTypesNoDuplicates = (
  sensorTypes: string[],
  ctx: z.RefinementCtx,
) => {
  const seen = new Set<string>();
  for (const t of sensorTypes) {
    if (seen.has(t)) {
      ctx.addIssue({
        code: "custom",
        message: "trùng loại cảm biến",
        path: ["sensorTypes"],
      });
      break;
    }
    seen.add(t);
  }
};

const refineReadingStaleFeasible = (
  readingIntervalSeconds: number,
  ctx: z.RefinementCtx,
) => {
  if (Math.ceil(readingIntervalSeconds * 1.5) > 3600) {
    ctx.addIssue({
      code: "custom",
      message:
        "Chu kỳ ghi nhật ký quá lớn: không đồng bộ được với ngưỡng mất liên kết tối đa (3600 giây). Chọn giá trị nhỏ hơn.",
      path: ["readingIntervalSeconds"],
    });
  }
};

const iotConfigStoredSuperRefine = (
  cfg: {
    readingIntervalSeconds: number;
    staleThresholdSeconds: number;
    sensorTypes: string[];
  },
  ctx: z.RefinementCtx,
) => {
  const minStale = Math.ceil(cfg.readingIntervalSeconds * 1.5);
  if (cfg.staleThresholdSeconds < minStale) {
    ctx.addIssue({
      code: "custom",
      message: `Ngưỡng mất liên kết phải ≥ ${minStale} giây (gấp rưỡi chu kỳ ghi)`,
      path: ["staleThresholdSeconds"],
    });
  }
  refineReadingStaleFeasible(cfg.readingIntervalSeconds, ctx);
  refineSensorTypesNoDuplicates(cfg.sensorTypes, ctx);
};

/** Body PUT — chỉ gửi chu kỳ ghi + loại cảm biến; ngưỡng mất tín hiệu do server gán. */
export const IotConfigPutBodySchema = z
  .object({
    readingIntervalSeconds: iotConfigStoredShape.readingIntervalSeconds,
    sensorTypes: iotConfigStoredShape.sensorTypes,
  })
  .strict()
  .superRefine((cfg, ctx) => {
    refineReadingStaleFeasible(cfg.readingIntervalSeconds, ctx);
    refineSensorTypesNoDuplicates(cfg.sensorTypes, ctx);
  });

// Response GET/PUT — đủ 3 trường + isConfigured
export const IotConfigResSchema = z
  .object({
    ...iotConfigStoredShape,
    isConfigured: z.boolean(),
  })
  .strict()
  .superRefine(iotConfigStoredSuperRefine);

export const DEFAULT_IOT_CONFIG = {
  readingIntervalSeconds: 300,
  staleThresholdSeconds: 600,
  sensorTypes: [...IOT_CONFIG_ALLOWED_SENSOR_TYPES],
} as const;

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
export type CreateProductionMilestoneBatchBodyType = z.infer<
  typeof CreateProductionMilestoneBatchBodySchema
>;
export type UpdateProductionMilestoneBodyType = z.infer<
  typeof UpdateProductionMilestoneBodySchema
>;
export type IotConfigSensorType = z.infer<typeof IotConfigSensorTypeSchema>;
export type IotConfigPutBodyType = z.infer<typeof IotConfigPutBodySchema>;
export type IotConfigResType = z.infer<typeof IotConfigResSchema>;
