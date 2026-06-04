import { z } from "zod";
import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";

// ── Available IoT Devices ─────────────────────────────────────────────────────

export const AvailableIotDeviceResSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  deviceName: z.string(),
  /** Nhãn dán vật lý unique tự tăng (K001, W001...). Null với mô-đun LoRa. */
  label: z.string().nullable().optional(),
  deviceType: z.string(),
  macAddress: z.string().nullable(),
  status: z.string(),
  iotDeviceBoardId: z.string().uuid().nullable(),
});

export const ListAvailableIotDevicesQuerySchema = PagingRequestSchema;
export const ListAvailableIotDevicesResSchema = PagingResponseSchema(
  AvailableIotDeviceResSchema,
);

// ── Assignment ────────────────────────────────────────────────────────────────

export const AssignmentBoundSensorResSchema = z.object({
  id: z.string().uuid(),
  sensorId: z.string().uuid(),
  sensorName: z.string(),
  deviceId: z.string().uuid(),
  sensorType: z.string(),
  unit: z.string().nullable(),
  status: z.string(),
  bindingId: z.string().uuid(),
  assignedAt: z.string(),
  minValue: z.number().nullable().optional(),
  maxValue: z.number().nullable().optional(),
  threshold: z.object({
    source: z.enum(["milestone", "zone", "none"]),
    optimalMin: z.number().nullable(),
    optimalMax: z.number().nullable(),
  }),
});

export const DEVICE_STATUS_VALUES = [
  "available",
  "purchase",
  "install",
  "inactive",
  "active",
  "error",
  "revoked",
] as const;
export const DeviceStatusSchema = z.enum(DEVICE_STATUS_VALUES);
export type DeviceStatusType = z.infer<typeof DeviceStatusSchema>;

export const AssignmentDeviceResSchema = z.object({
  deviceId: z.string().uuid(),
  deviceName: z.string(),
  deviceCode: z.string(),
  /** Nhãn dán vật lý unique tự tăng (K001, W001...). */
  label: z.string(),
  deviceType: z.string(),
  /** Real device status (active/error/install/...). */
  status: z.string(),
  isDeleted: z.boolean(),
});

export const MilestoneAssignmentDetailResSchema = z.object({
  assignmentId: z.string().uuid(),
  iotDeviceId: z.string().uuid(),
  milestoneId: z.string().uuid(),
  zoneId: z.string().uuid(),
  farmId: z.string().uuid(),
  assignedAt: z.string(),
  assignedBy: z.string().uuid().nullable(),
  device: AssignmentDeviceResSchema,
  sensors: z.array(AssignmentBoundSensorResSchema),
  warnings: z.array(z.string()).optional(),
});

export const GetMilestoneAssignmentDetailResSchema = z.object({
  data: MilestoneAssignmentDetailResSchema.nullable(),
});

// List ALL active assignments for a milestone — needed because one milestone
// may have multiple devices after `assign-bulk`. Singular `getAssignment`
// returns just the latest one (with a warning).
export const ListMilestoneAssignmentsResSchema = z.object({
  data: z.array(MilestoneAssignmentDetailResSchema),
});

// Paginated/filtered search of active assignments for a milestone.
export const SearchMilestoneAssignmentsQuerySchema = PagingRequestSchema.extend({
  q: z.string().trim().min(1).optional(),
  status: DeviceStatusSchema.optional(),
});
export const SearchMilestoneAssignmentsResSchema = PagingResponseSchema(
  MilestoneAssignmentDetailResSchema,
);

// ── Assign / Unassign Bodies ──────────────────────────────────────────────────

export const AssignIotDeviceBodySchema = z.object({
  iotDeviceId: z.string().uuid(),
});

export const UnassignIotDeviceBodySchema = z.object({
  iotDeviceId: z.string().uuid(),
});

// ── Bulk Assign ───────────────────────────────────────────────────────────────

export const BulkAssignIotDevicesBodySchema = z.object({
  iotDeviceIds: z.array(z.string().uuid()).min(1).max(50),
});

export const BulkAssignItemResultSchema = z.object({
  iotDeviceId: z.string().uuid(),
  ok: z.boolean(),
  assignmentId: z.string().uuid().nullable(),
  boundSensorTypes: z.array(z.string()),
  missingSensorTypes: z.array(z.string()),
  error: z.string().nullable(),
});

export const BulkAssignIotDevicesResSchema = z.object({
  milestoneId: z.string().uuid(),
  results: z.array(BulkAssignItemResultSchema),
  summary: z.object({
    attempted: z.number().int(),
    succeeded: z.number().int(),
    failed: z.number().int(),
  }),
});

// ── Sensor Binding ────────────────────────────────────────────────────────────

export const BoundSensorResSchema = z.object({
  id: z.string().uuid(),
  sensorId: z.string().uuid(),
  sensorName: z.string(),
  deviceId: z.string().uuid(),
  sensorType: z.string(),
  unit: z.string().nullable(),
  status: z.string(),
  bindingId: z.string().uuid(),
  assignedAt: z.string(),
  threshold: z.object({
    source: z.enum(["milestone", "zone", "none"]),
    optimalMin: z.number().nullable(),
    optimalMax: z.number().nullable(),
  }),
});

export const ListBoundSensorsResSchema = z.object({
  assignmentId: z.string().uuid(),
  milestoneId: z.string().uuid(),
  zoneId: z.string().uuid(),
  farmId: z.string().uuid(),
  device: AssignmentDeviceResSchema,
  data: z.array(BoundSensorResSchema),
  warnings: z.array(z.string()).optional(),
});

export const BindSensorsBodySchema = z.object({
  sensorIds: z.array(z.string().uuid()).min(1),
});

export const UnbindSensorsBodySchema = z.object({
  sensorIds: z.array(z.string().uuid()).min(1),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type ListAvailableIotDevicesQueryType = z.infer<
  typeof ListAvailableIotDevicesQuerySchema
>;
export type ListAvailableIotDevicesResType = z.infer<
  typeof ListAvailableIotDevicesResSchema
>;
export type MilestoneAssignmentDetailResType = z.infer<
  typeof MilestoneAssignmentDetailResSchema
>;
export type GetMilestoneAssignmentDetailResType = z.infer<
  typeof GetMilestoneAssignmentDetailResSchema
>;
export type MilestoneAssignmentDetailItemType = z.infer<
  typeof MilestoneAssignmentDetailResSchema
>;
export type ListMilestoneAssignmentsResType = z.infer<
  typeof ListMilestoneAssignmentsResSchema
>;
export type SearchMilestoneAssignmentsQueryType = z.infer<
  typeof SearchMilestoneAssignmentsQuerySchema
>;
export type SearchMilestoneAssignmentsResType = z.infer<
  typeof SearchMilestoneAssignmentsResSchema
>;
export type AssignIotDeviceBodyType = z.infer<typeof AssignIotDeviceBodySchema>;
export type UnassignIotDeviceBodyType = z.infer<
  typeof UnassignIotDeviceBodySchema
>;
export type ListBoundSensorsResType = z.infer<typeof ListBoundSensorsResSchema>;
export type BindSensorsBodyType = z.infer<typeof BindSensorsBodySchema>;
export type UnbindSensorsBodyType = z.infer<typeof UnbindSensorsBodySchema>;
export type BulkAssignIotDevicesBodyType = z.infer<
  typeof BulkAssignIotDevicesBodySchema
>;
export type BulkAssignItemResultType = z.infer<
  typeof BulkAssignItemResultSchema
>;
export type BulkAssignIotDevicesResType = z.infer<
  typeof BulkAssignIotDevicesResSchema
>;
