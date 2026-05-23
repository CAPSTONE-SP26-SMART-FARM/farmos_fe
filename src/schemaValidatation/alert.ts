import { z } from "zod";

// ── Severity enum (mirror BE Prisma `IncidentSeverity`) ────────────────

export const IncidentSeveritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);
export type IncidentSeverityType = z.infer<typeof IncidentSeveritySchema>;

// ── Single alert (mirror BE AlertResSchema) ────────────────────────────

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
  resolvedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

// ── List query — BE strict: page/limit + optional zoneId filter ────────

export const ListAlertsQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  zoneId: z.string().uuid().optional(),
});

// ── Paging meta (mirror BE PagingMetaSchema) ───────────────────────────

export const AlertPagingMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

// ── List response (paginated) ──────────────────────────────────────────

export const ListAlertsResSchema = z.object({
  data: z.array(AlertResSchema),
  meta: AlertPagingMetaSchema,
});

// ── Type exports ───────────────────────────────────────────────────────

export type AlertResType = z.infer<typeof AlertResSchema>;
export type ListAlertsQueryType = z.infer<typeof ListAlertsQuerySchema>;
export type ListAlertsResType = z.infer<typeof ListAlertsResSchema>;
