import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";
import { z } from "zod";

// ============================================================
// Shared Enums
// ============================================================

export const IotDeviceTemplateTypeSchema = z.enum([
  "board_module",
  "wifi_module",
  "lora_module",
]);

export const SensorTemplateTypeSchema = z.enum([
  "soil_moisture_sensor",
  "light_intensity_sensor",
  "air_humidity_sensor",
  "air_temperature_sensor",
]);

export const FarmTypeForTemplateSchema = z.enum(["cultivation"]);

export const TemplateItemTypeSchema = z.enum([
  "activity",
  "metric",
  "condition",
]);

// ============================================================
// IoT Device Template
// ============================================================

/** Item config for IoT device template */
export const IotDeviceTemplateItemConfigSchema = z
  .object({
    deviceName: z.string().min(1).max(255),
  })
  .strict();

/** Response shape for a single device template item */
export const IotDeviceTemplateItemResSchema = z
  .object({
    id: z.string().uuid(),
    itemType: TemplateItemTypeSchema.nullable(),
    deviceName: z.string(),
    deviceType: IotDeviceTemplateTypeSchema,
  })
  .strict();

/** Full IoT device template response */
export const IotDeviceTemplateResSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    type: IotDeviceTemplateTypeSchema,
    farmType: FarmTypeForTemplateSchema,
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    deletedAt: z.string().nullable(),
    items: z.array(IotDeviceTemplateItemResSchema),
  })
  .strict();

/** Create IoT device template body */
export const CreateIotDeviceTemplateBodySchema = z
  .object({
    name: z.string().min(1).max(255),
    description: z.string().max(5000).nullable().optional(),
    type: IotDeviceTemplateTypeSchema,
    farmType: FarmTypeForTemplateSchema,
    isActive: z.boolean().default(true),
    items: z.array(IotDeviceTemplateItemConfigSchema).optional().default([]),
  })
  .strict();

/** Update IoT device template body */
export const UpdateIotDeviceTemplateBodySchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(5000).nullable().optional(),
    type: IotDeviceTemplateTypeSchema.optional(),
    farmType: FarmTypeForTemplateSchema.optional(),
    isActive: z.boolean().optional(),
    items: z.array(IotDeviceTemplateItemConfigSchema).optional(),
  })
  .strict();

/** Query for listing IoT device templates */
export const ListIotDeviceTemplateQuerySchema = PagingRequestSchema.extend({
  type: IotDeviceTemplateTypeSchema.optional(),
}).strict();

/** Paginated list response */
export const ListIotDeviceTemplateResSchema = PagingResponseSchema(
  IotDeviceTemplateResSchema,
);

// ============================================================
// Sensor Template
// ============================================================

/** Item config for sensor template */
export const SensorTemplateItemConfigSchema = z
  .object({
    sensorType: SensorTemplateTypeSchema,
    sensorModel: z.string().max(100).nullable().optional(),
    gpioPin: z.string().max(10).nullable().optional(),
    calibrationOffset: z.number().nullable().optional(),
    stageName: z.string().max(100).nullable().optional(),
    minValue: z.number().nullable().optional(),
    maxValue: z.number().nullable().optional(),
    optimalMin: z.number().nullable().optional(),
    optimalMax: z.number().nullable().optional(),
  })
  .strict();

/** Response shape for a single sensor template item */
export const SensorTemplateItemResSchema = z
  .object({
    id: z.string().uuid(),
    itemType: TemplateItemTypeSchema.nullable(),
    sensorType: SensorTemplateTypeSchema,
    sensorModel: z.string().nullable(),
    gpioPin: z.string().nullable(),
    calibrationOffset: z.number().nullable(),
    stageName: z.string().nullable(),
    minValue: z.number().nullable(),
    maxValue: z.number().nullable(),
    optimalMin: z.number().nullable(),
    optimalMax: z.number().nullable(),
  })
  .strict();

/** Full sensor template response */
export const SensorTemplateResSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    type: SensorTemplateTypeSchema,
    farmType: FarmTypeForTemplateSchema,
    version: z.number().int(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    deletedAt: z.string().nullable(),
    items: z.array(SensorTemplateItemResSchema),
  })
  .strict();

/** Create sensor template body */
export const CreateSensorTemplateBodySchema = z
  .object({
    name: z.string().min(1).max(255),
    description: z.string().max(5000).nullable().optional(),
    type: SensorTemplateTypeSchema,
    farmType: FarmTypeForTemplateSchema,
    version: z.number().int().positive().default(1),
    isActive: z.boolean().default(true),
    items: z.array(SensorTemplateItemConfigSchema).optional().default([]),
  })
  .strict();

/** Update sensor template body */
export const UpdateSensorTemplateBodySchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(5000).nullable().optional(),
    type: SensorTemplateTypeSchema.optional(),
    farmType: FarmTypeForTemplateSchema.optional(),
    version: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
    items: z.array(SensorTemplateItemConfigSchema).optional(),
  })
  .strict();

/** Query for listing sensor templates */
export const ListSensorTemplatesQuerySchema = PagingRequestSchema.extend({
  type: SensorTemplateTypeSchema.optional(),
  status: z.enum(["active", "inactive"]).optional(),
}).strict();

/** Paginated list response */
export const ListSensorTemplatesResSchema = PagingResponseSchema(
  SensorTemplateResSchema,
);

// ============================================================
// Type Exports
// ============================================================
export type IotDeviceTemplateType = z.infer<typeof IotDeviceTemplateTypeSchema>;
export type SensorTemplateType = z.infer<typeof SensorTemplateTypeSchema>;
export type FarmTypeForTemplateType = z.infer<typeof FarmTypeForTemplateSchema>;

export type IotDeviceTemplateItemResType = z.infer<
  typeof IotDeviceTemplateItemResSchema
>;
export type IotDeviceTemplateResType = z.infer<
  typeof IotDeviceTemplateResSchema
>;
export type CreateIotDeviceTemplateBodyType = z.infer<
  typeof CreateIotDeviceTemplateBodySchema
>;
export type UpdateIotDeviceTemplateBodyType = z.infer<
  typeof UpdateIotDeviceTemplateBodySchema
>;
export type ListIotDeviceTemplateQueryType = z.infer<
  typeof ListIotDeviceTemplateQuerySchema
>;
export type ListIotDeviceTemplateResType = z.infer<
  typeof ListIotDeviceTemplateResSchema
>;

export type SensorTemplateItemResType = z.infer<
  typeof SensorTemplateItemResSchema
>;
export type SensorTemplateResType = z.infer<typeof SensorTemplateResSchema>;
export type CreateSensorTemplateBodyType = z.infer<
  typeof CreateSensorTemplateBodySchema
>;
export type UpdateSensorTemplateBodyType = z.infer<
  typeof UpdateSensorTemplateBodySchema
>;
export type ListSensorTemplatesQueryType = z.infer<
  typeof ListSensorTemplatesQuerySchema
>;
export type ListSensorTemplatesResType = z.infer<
  typeof ListSensorTemplatesResSchema
>;
