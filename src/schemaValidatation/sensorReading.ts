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
  sensorStatus: z
    .enum(["active", "inactive", "calibration", "error", "damaged"])
    .optional(),
  device: z
    .object({
      id: z.string().uuid(),
      label: z.string().nullable(),
    })
    .optional(),
});

// ── Wrapper: latest readings for an assignment ─────────────────────────

export const GetLatestReadingsByAssignmentResSchema = z.object({
  assignmentId: z.string().uuid(),
  zoneId: z.string().uuid(),
  milestoneId: z.string().uuid(),
  data: z.array(LatestSensorReadingResSchema),
});

// ── Time-series readings for ONE sensor (legacy raw series) ────────────

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

// ── Series by interval (bucketed) ──────────────────────────────────────

export const SensorIntervalSchema = z.enum([
  "10s",
  "1m",
  "1h",
  "1D",
  "1W",
  "1M",
]);

export const SensorStatsPeriodSchema = z.enum(["today", "7d", "10d"]);

export const SensorSeriesIntervalResSchema = z.object({
  assignmentId: z.string().uuid(),
  sensorId: z.string().uuid(),
  sensorType: SensorTypeSchema,
  interval: SensorIntervalSchema,
  startedAt: z.string().nullable(),
  data: z.array(SensorReadingPointSchema),
});

// ── Stats (4 badge) ────────────────────────────────────────────────────

export const SensorStatsResSchema = z.object({
  assignmentId: z.string().uuid(),
  sensorId: z.string().uuid(),
  period: SensorStatsPeriodSchema,
  currentValue: z.number(),
  minValue: z.number(),
  maxValue: z.number(),
  alertCount: z.number(),
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
export type SensorIntervalType = z.infer<typeof SensorIntervalSchema>;
export type SensorStatsPeriodType = z.infer<typeof SensorStatsPeriodSchema>;
export type SensorSeriesIntervalResType = z.infer<
  typeof SensorSeriesIntervalResSchema
>;
export type SensorStatsResType = z.infer<typeof SensorStatsResSchema>;
