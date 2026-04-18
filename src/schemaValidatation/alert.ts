import { z } from "zod";

// ── Severity enum ──────────────────────────────────────────────────────

export const IncidentSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
export type IncidentSeverityType = z.infer<typeof IncidentSeveritySchema>;

// ── Single alert ───────────────────────────────────────────────────────

export const AlertResSchema = z.object({
  id: z.string().uuid(),
  zoneId: z.string().uuid(),
  zoneName: z.string(),
  farmId: z.string().uuid(),
  farmName: z.string(),
  sensorId: z.string().uuid().nullable(),
  alertType: z.string(),
  severity: IncidentSeveritySchema,
  title: z.string(),
  message: z.string(),
  thresholdValue: z.string().nullable(),
  actualValue: z.string().nullable(),
  isResolved: z.boolean(),
  resolvedAt: z.string().nullable(),
  createdAt: z.string(),
});

// ── List query ─────────────────────────────────────────────────────────

export const ListAlertsQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  search: z.string().optional(),
  farmId: z.string().uuid().optional(),
  zoneId: z.string().uuid().optional(),
  severity: IncidentSeveritySchema.optional(),
  isResolved: z.boolean().optional(),
});

// ── List response (paginated) ──────────────────────────────────────────

export const ListAlertsResSchema = z.object({
  data: z.array(AlertResSchema),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  hasMore: z.boolean(),
});

// ── Type exports ───────────────────────────────────────────────────────

export type AlertResType = z.infer<typeof AlertResSchema>;
export type ListAlertsQueryType = z.infer<typeof ListAlertsQuerySchema>;
export type ListAlertsResType = z.infer<typeof ListAlertsResSchema>;
