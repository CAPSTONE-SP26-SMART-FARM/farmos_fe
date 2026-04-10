import { z } from "zod";
import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";

// ── Available IoT Devices ─────────────────────────────────────────────────────

export const AvailableIotDeviceResSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  deviceName: z.string(),
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
  deviceId: z.string().uuid(),
  sensorType: z.string(),
  status: z.string(),
  bindingId: z.string().uuid(),
  assignedAt: z.string(),
});

export const MilestoneAssignmentDetailResSchema = z.object({
  assignmentId: z.string().uuid(),
  iotDeviceId: z.string().uuid(),
  milestoneId: z.string().uuid(),
  assignedAt: z.string(),
  sensors: z.array(AssignmentBoundSensorResSchema).optional(),
});

export const GetMilestoneAssignmentDetailResSchema = z.object({
  data: MilestoneAssignmentDetailResSchema.nullable(),
});

// ── Assign / Unassign Bodies ──────────────────────────────────────────────────

export const AssignIotDeviceBodySchema = z.object({
  iotDeviceId: z.string().uuid(),
});

export const UnassignIotDeviceBodySchema = z.object({
  iotDeviceId: z.string().uuid(),
});

// ── Sensor Binding ────────────────────────────────────────────────────────────

export const BoundSensorResSchema = z.object({
  id: z.string().uuid(),
  deviceId: z.string().uuid(),
  sensorType: z.string(),
  status: z.string(),
  bindingId: z.string().uuid(),
  assignedAt: z.string(),
});

export const ListBoundSensorsResSchema = z.object({
  data: z.array(BoundSensorResSchema),
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
export type AssignIotDeviceBodyType = z.infer<typeof AssignIotDeviceBodySchema>;
export type UnassignIotDeviceBodyType = z.infer<
  typeof UnassignIotDeviceBodySchema
>;
export type ListBoundSensorsResType = z.infer<typeof ListBoundSensorsResSchema>;
export type BindSensorsBodyType = z.infer<typeof BindSensorsBodySchema>;
export type UnbindSensorsBodyType = z.infer<typeof UnbindSensorsBodySchema>;
