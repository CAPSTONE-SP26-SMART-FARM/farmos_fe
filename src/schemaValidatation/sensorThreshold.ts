import { z } from "zod";

export const ThresholdEligibleSensorTypeSchema = z.enum([
  "soil_moisture",
  "air_temperature",
  "air_humidity",
  "light_intensity",
]);
export type ThresholdEligibleSensorType = z.infer<
  typeof ThresholdEligibleSensorTypeSchema
>;

export const UpsertSensorThresholdBodySchema = z
  .object({
    sensorType: ThresholdEligibleSensorTypeSchema,
    optimalMin: z.number(),
    optimalMax: z.number(),
  })
  .refine((d) => d.optimalMin <= d.optimalMax, {
    message: "optimalMin must be ≤ optimalMax",
    path: ["optimalMax"],
  });

export const SensorThresholdResSchema = z.object({
  id: z.string().uuid(),
  zoneId: z.string().uuid(),
  milestoneId: z.string().uuid().nullable(),
  sensorType: ThresholdEligibleSensorTypeSchema,
  optimalMin: z.number(),
  optimalMax: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const SensorThresholdItemResSchema = z.object({
  sensorId: z.string().uuid(),
  sensorType: ThresholdEligibleSensorTypeSchema,
  minValue: z.string(),
  maxValue: z.string(),
  threshold: SensorThresholdResSchema.nullable(),
  source: z.enum(["milestone", "zone", "none"]),
});

export const GetThresholdsByAssignmentResSchema = z.object({
  assignmentId: z.string().uuid(),
  data: z.array(SensorThresholdItemResSchema),
});

export type UpsertSensorThresholdBodyType = z.infer<
  typeof UpsertSensorThresholdBodySchema
>;
export type SensorThresholdResType = z.infer<typeof SensorThresholdResSchema>;
export type SensorThresholdItemResType = z.infer<
  typeof SensorThresholdItemResSchema
>;
export type GetThresholdsByAssignmentResType = z.infer<
  typeof GetThresholdsByAssignmentResSchema
>;
