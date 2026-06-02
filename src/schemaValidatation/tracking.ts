import { z } from "zod";

export const TrackingEntityTypeSchema = z.enum([
  "crop_season",
  "production_milestone",
  "employee_task",
  "harvest_record",
  "iot_device_assignment",
]);
export type TrackingEntityType = z.infer<typeof TrackingEntityTypeSchema>;

export const TrackingDataTypeSchema = z.enum([
  "string",
  "int",
  "decimal",
  "boolean",
  "date",
  "datetime",
  "enum",
  "uuid",
]);
export type TrackingDataType = z.infer<typeof TrackingDataTypeSchema>;

export const TrackingChangeTypeSchema = z.enum([
  "snapshot",
  "update",
  "create",
  "delete",
]);
export type TrackingChangeType = z.infer<typeof TrackingChangeTypeSchema>;

export const TrackingFieldLayerSchema = z.enum([
  "plan_only",
  "operational",
  "unplanned",
]);
export type TrackingFieldLayer = z.infer<typeof TrackingFieldLayerSchema>;

export const AvailableFieldSchema = z.object({
  fieldName: z.string(),
  dataType: TrackingDataTypeSchema,
  layer: TrackingFieldLayerSchema,
});
export type AvailableFieldType = z.infer<typeof AvailableFieldSchema>;

export const AvailableFieldGroupSchema = z.object({
  entityType: TrackingEntityTypeSchema,
  fields: z.array(AvailableFieldSchema),
});
export type AvailableFieldGroupType = z.infer<typeof AvailableFieldGroupSchema>;

export const AvailableFieldsResSchema = z.object({
  data: z.array(AvailableFieldGroupSchema),
});
export type AvailableFieldsResType = z.infer<typeof AvailableFieldsResSchema>;

export const TrackingConfigItemSchema = z.object({
  id: z.string().uuid(),
  entityType: TrackingEntityTypeSchema,
  entityId: z.string().uuid().nullable(),
  fieldName: z.string(),
  dataType: TrackingDataTypeSchema,
  layer: TrackingFieldLayerSchema,
  isActive: z.boolean(),
  cropSeasonId: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TrackingConfigItemType = z.infer<typeof TrackingConfigItemSchema>;

export const TrackingConfigListResSchema = z.object({
  data: z.array(TrackingConfigItemSchema),
});
export type TrackingConfigListResType = z.infer<
  typeof TrackingConfigListResSchema
>;

export const PutTrackingConfigsBodySchema = z.object({
  configs: z.array(
    z.object({
      entityType: TrackingEntityTypeSchema,
      entityId: z.string().uuid().nullable(),
      fieldName: z.string(),
    }),
  ),
});
export type PutTrackingConfigsBodyType = z.infer<
  typeof PutTrackingConfigsBodySchema
>;

export const TrackingLogUserSchema = z.object({
  id: z.string(),
  fullName: z.string().nullable(),
  email: z.string().nullable(),
});
export type TrackingLogUserType = z.infer<typeof TrackingLogUserSchema>;

export const TrackingLogItemSchema = z.object({
  id: z.string().uuid(),
  cropSeasonId: z.string().uuid(),
  entityType: TrackingEntityTypeSchema,
  entityId: z.string().uuid(),
  fieldName: z.string(),
  dataType: TrackingDataTypeSchema,
  changeType: TrackingChangeTypeSchema,
  oldValueJson: z.unknown().nullable(),
  newValueJson: z.unknown().nullable(),
  changedAt: z.string(),
  source: z.string().nullable(),
  changedBy: z.string().nullable(),
  changedByName: z.string().min(1),
  changedByEmail: z.string().nullable().optional(),
  changedByUser: TrackingLogUserSchema.nullable().optional(),
  requestId: z.string().nullable(),
  // Human-readable entity name resolved by BE (cropName / "#order stageName" /
  // task title / device name). Persists for soft-deleted entities too.
  entityLabel: z.string().nullable().optional(),
  // Parent milestone for child entities (employee_task, iot_device_assignment).
  // Lets FE roll task rows under their milestone card without N+1 lookups.
  entityParentId: z.string().uuid().nullable().optional(),
  entityParentLabel: z.string().nullable().optional(),
  // Readable label for old/new value when the field references another entity
  // (e.g. assignedTo → user full name). Set by B11 only; null elsewhere.
  oldValueLabel: z.string().nullable().optional(),
  newValueLabel: z.string().nullable().optional(),
});
export type TrackingLogItemType = z.infer<typeof TrackingLogItemSchema>;

const TrackingMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
});

export const TrackingLogQuerySchema = z.object({
  entityType: TrackingEntityTypeSchema.optional(),
  entityId: z.string().uuid().optional(),
  fieldName: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
export type TrackingLogQueryType = z.infer<typeof TrackingLogQuerySchema>;

export const TrackingLogListResSchema = z.object({
  data: z.array(TrackingLogItemSchema),
  meta: TrackingMetaSchema,
});
export type TrackingLogListResType = z.infer<typeof TrackingLogListResSchema>;

const VarianceSchema = z
  .object({
    type: z.enum(["days", "absolute", "percent", "label", "changed", "none"]),
    value: z.unknown().optional(),
    direction: z
      .enum(["early", "on-time", "late", "lower", "higher", "equal"])
      .optional(),
  })
  .nullable();
export type VarianceType = z.infer<typeof VarianceSchema>;

const DiffFieldSchema = z.object({
  fieldName: z.string(),
  dataType: TrackingDataTypeSchema,
  planValue: z.unknown().nullable(),
  actualValue: z.unknown().nullable(),
  variance: VarianceSchema,
  changeCount: z.number(),
  lastChangedAt: z.string().nullable(),
});
export type DiffFieldType = z.infer<typeof DiffFieldSchema>;

const TrackedEntitySchema = z.object({
  entityId: z.string().uuid(),
  // Human-readable label (cropName / "#order stageName" / task title / null).
  // Null when entity was deleted between approve-time and diff call → FE falls
  // back to short entityId.
  label: z.string().nullable(),
  // Plan/actual values keyed by fieldName. `plan` = snapshot at approve time,
  // `actual` = live DB value. `fields[]` still carries per-field variance /
  // changeCount / lastChangedAt that the object form can't express.
  plan: z.record(z.string(), z.unknown()),
  actual: z.record(z.string(), z.unknown()),
  fields: z.array(DiffFieldSchema),
});
export type TrackedEntityType = z.infer<typeof TrackedEntitySchema>;

const TrackedSectionSchema = z.object({
  entityType: TrackingEntityTypeSchema,
  entities: z.array(TrackedEntitySchema),
});
export type TrackedSectionType = z.infer<typeof TrackedSectionSchema>;

const UnplannedFieldSchema = z.object({
  fieldName: z.string(),
  dataType: TrackingDataTypeSchema,
  actualValue: z.unknown().nullable(),
});
export type UnplannedFieldType = z.infer<typeof UnplannedFieldSchema>;

const UnplannedEntitySchema = z.object({
  entityId: z.string().uuid(),
  createdAt: z.string().nullable(),
  fields: z.array(UnplannedFieldSchema),
});
export type UnplannedEntityType = z.infer<typeof UnplannedEntitySchema>;

const UnplannedSectionSchema = z.object({
  entityType: TrackingEntityTypeSchema,
  entities: z.array(UnplannedEntitySchema),
});
export type UnplannedSectionType = z.infer<typeof UnplannedSectionSchema>;

export const TrackingDiffResSchema = z.object({
  cropSeason: z.object({
    id: z.string().uuid(),
    cropName: z.string().nullable(),
  }),
  tracked: z.array(TrackedSectionSchema),
  unplanned: z.array(UnplannedSectionSchema),
});
export type TrackingDiffResType = z.infer<typeof TrackingDiffResSchema>;

export const ProductionRequestSnapshotResSchema = z.object({
  productionRequestId: z.string().uuid(),
  capturedAt: z.string(),
  payload: z.unknown(),
});
export type ProductionRequestSnapshotResType = z.infer<
  typeof ProductionRequestSnapshotResSchema
>;

export const ProductionRequestDiffQuerySchema = z.object({
  from: z.string().uuid(),
  to: z.string().uuid(),
});
export type ProductionRequestDiffQueryType = z.infer<
  typeof ProductionRequestDiffQuerySchema
>;

export const PrDiffChangeSchema = z.object({
  path: z.string(),
  type: z.string(),
  oldValue: z.unknown().optional(),
  value: z.unknown().optional(),
});
export type PrDiffChangeType = z.infer<typeof PrDiffChangeSchema>;

export const ProductionRequestDiffResSchema = z.object({
  from: z.object({ requestId: z.string().uuid(), capturedAt: z.string() }),
  to: z.object({ requestId: z.string().uuid(), capturedAt: z.string() }),
  changes: z.array(PrDiffChangeSchema),
});
export type ProductionRequestDiffResType = z.infer<
  typeof ProductionRequestDiffResSchema
>;

export const FieldHistoryQuerySchema = z.object({
  entityType: TrackingEntityTypeSchema,
  entityId: z.string().uuid(),
  fieldName: z.string(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
export type FieldHistoryQueryType = z.infer<typeof FieldHistoryQuerySchema>;

export const FieldHistoryResSchema = TrackingLogListResSchema;
export type FieldHistoryResType = TrackingLogListResType;

// ─── B11 — Milestone changes (detail dialog) ───────────────────────────────
export const MilestoneChangeGroupSchema = z.object({
  entityId: z.string().uuid(),
  label: z.string().nullable(),
  logs: z.array(TrackingLogItemSchema),
});
export type MilestoneChangeGroupType = z.infer<
  typeof MilestoneChangeGroupSchema
>;

export const MilestoneChangesResSchema = z.object({
  milestone: MilestoneChangeGroupSchema,
  tasks: z.array(MilestoneChangeGroupSchema),
});
export type MilestoneChangesResType = z.infer<
  typeof MilestoneChangesResSchema
>;

export const IotSwapBodySchema = z.object({
  oldAssignmentId: z.string().uuid("ID thiết bị cũ không hợp lệ"),
  newDeviceId: z.string().uuid("ID thiết bị mới không hợp lệ"),
  swapReason: z.string().min(10, "Lý do phải có ít nhất 10 ký tự").max(500),
});
export type IotSwapBodyType = z.infer<typeof IotSwapBodySchema>;
