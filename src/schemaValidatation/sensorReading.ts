import { z } from "zod";
import { SensorTypeSchema } from "./sensor";

// ── Threshold source ───────────────────────────────────────────────────

export const ThresholdSourceSchema = z.enum(["milestone", "zone"]);

// ── Latest sensor reading (single sensor) ──────────────────────────────

export const LatestSensorReadingResSchema = z.object({
  sensorId: z.string().uuid(),
  sensorType: SensorTypeSchema,
  timestamp: z.string().nullable(),
  value: z.number().nullable(),
  minValue: z.number(),
  maxValue: z.number(),
  threshold: z
    .object({
      optimalMin: z.number(),
      optimalMax: z.number(),
      source: ThresholdSourceSchema,
    })
    .nullable(),
  isSafe: z.boolean(),
});

// ── Wrapper: latest readings for an assignment ─────────────────────────

export const GetLatestReadingsByAssignmentResSchema = z.object({
  assignmentId: z.string().uuid(),
  zoneId: z.string().uuid(),
  milestoneId: z.string().uuid(),
  data: z.array(LatestSensorReadingResSchema),
});

// ── Time-series readings (per-sensor chart) ────────────────────────────

export const ListSensorReadingsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.number().int().positive().max(50).optional(),
});

export const SensorReadingPointSchema = z.object({
  timestamp: z.string(),
  value: z.number(),
});

export const ListSensorReadingsResSchema = z.object({
  assignmentId: z.string().uuid(),
  sensorId: z.string().uuid(),
  sensorType: SensorTypeSchema,
  unit: z.string().nullable(),
  data: z.array(SensorReadingPointSchema),
});

// ── Type exports ───────────────────────────────────────────────────────

export type ThresholdSourceType = z.infer<typeof ThresholdSourceSchema>;
export type LatestSensorReadingResType = z.infer<
  typeof LatestSensorReadingResSchema
>;
export type GetLatestReadingsByAssignmentResType = z.infer<
  typeof GetLatestReadingsByAssignmentResSchema
>;
export type ListSensorReadingsQueryType = z.infer<
  typeof ListSensorReadingsQuerySchema
>;
export type SensorReadingPointType = z.infer<typeof SensorReadingPointSchema>;
export type ListSensorReadingsResType = z.infer<
  typeof ListSensorReadingsResSchema
>;
