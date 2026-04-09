import { z } from "zod";
import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";

// ── Enums ──────────────────────────────────────────────────────────────

export const SensorTypeSchema = z.enum([
  "soil_moisture",
  "air_temperature",
  "air_humidity",
  "light_intensity",
]);

export const SensorStatusSchema = z.enum([
  "active",
  "inactive",
  "calibration",
  "error",
  "damaged",
]);

// ── Create body (batch) ────────────────────────────────────────────────

export const CreateSensorItemSchema = z.object({
  sensorType: SensorTypeSchema,
  status: SensorStatusSchema.optional(),
  minValue: z.number(),
  maxValue: z.number(),
});

export const CreateSensorBatchBodySchema = z.object({
  items: z.array(CreateSensorItemSchema).min(1, "Cần ít nhất 1 cảm biến"),
});

// ── Update body ────────────────────────────────────────────────────────

export const UpdateSensorBodySchema = z
  .object({
    sensorType: SensorTypeSchema.optional(),
    status: SensorStatusSchema.optional(),
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    // min and max must come together
    if (
      (data.minValue !== undefined && data.maxValue === undefined) ||
      (data.minValue === undefined && data.maxValue !== undefined)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Giá trị tối thiểu và tối đa phải được cập nhật cùng nhau",
        path: ["minValue"],
      });
    }
    // min <= max
    if (
      data.minValue !== undefined &&
      data.maxValue !== undefined &&
      data.minValue > data.maxValue
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Giá trị tối thiểu phải nhỏ hơn hoặc bằng giá trị tối đa",
        path: ["minValue"],
      });
    }
  });

// ── Response schemas ───────────────────────────────────────────────────

export const SensorResSchema = z.object({
  id: z.string().uuid(),
  deviceId: z.string().uuid(),
  sensorType: z.string(),
  status: SensorStatusSchema,
  minValue: z.string(),
  maxValue: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ── List query ─────────────────────────────────────────────────────────

export const ListSensorsQuerySchema = PagingRequestSchema.extend({
  status: SensorStatusSchema.optional(),
  sensorType: SensorTypeSchema.optional(),
});

// ── List response ──────────────────────────────────────────────────────

export const ListSensorsResSchema = PagingResponseSchema(SensorResSchema);

// ── Type exports ───────────────────────────────────────────────────────

export type SensorTypeType = z.infer<typeof SensorTypeSchema>;
export type SensorStatusType = z.infer<typeof SensorStatusSchema>;
export type SensorResType = z.infer<typeof SensorResSchema>;
export type CreateSensorItemType = z.infer<typeof CreateSensorItemSchema>;
export type CreateSensorBatchBodyType = z.infer<
  typeof CreateSensorBatchBodySchema
>;
export type UpdateSensorBodyType = z.infer<typeof UpdateSensorBodySchema>;
export type ListSensorsQueryType = z.infer<typeof ListSensorsQuerySchema>;
export type ListSensorsResType = z.infer<typeof ListSensorsResSchema>;
