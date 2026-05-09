import { z } from "zod";
import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";

// ── Enums ──────────────────────────────────────────────────────────────

export const DeviceStatusSchema = z.enum([
  "active",
  "inactive",
  "maintenance",
  "retired",
]);

export const IotDeviceTypeSchema = z.enum([
  "board_module",
  "lora_module",
  "wifi_module",
]);

// ── Create body ────────────────────────────────────────────────────────

export const CreateIotDeviceItemSchema = z.object({
  deviceName: z.string().min(1, "Tên thiết bị là bắt buộc").max(255),
  deviceType: IotDeviceTypeSchema,
  macAddress: z
    .string()
    .max(17)
    .regex(
      /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
      "Địa chỉ MAC không hợp lệ (VD: AA:BB:CC:DD:EE:FF)",
    )
    .optional(),
  status: DeviceStatusSchema.optional(),
});

export const CreateIotDeviceBatchBodySchema = z
  .object({
    devices: z
      .array(CreateIotDeviceItemSchema)
      .min(3, "Cần ít nhất 3 thiết bị"),
  })
  .superRefine((data, ctx) => {
    const typeCounts = new Map<string, number>();
    data.devices.forEach((d) => {
      typeCounts.set(d.deviceType, (typeCounts.get(d.deviceType) ?? 0) + 1);
    });

    // Exactly 1 board_module
    const boardCount = typeCounts.get("board_module") ?? 0;
    if (boardCount !== 1) {
      ctx.addIssue({
        code: "custom",
        message: `Phải có đúng 1 Board Module (hiện có ${boardCount})`,
        path: ["devices"],
      });
    }

    // All 3 types required
    const required: Array<z.infer<typeof IotDeviceTypeSchema>> = [
      "board_module",
      "lora_module",
      "wifi_module",
    ];
    const missing = required.filter((r) => !typeCounts.has(r));
    if (missing.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: `Phải có ít nhất 1 thiết bị mỗi loại. Thiếu: ${missing.join(", ")}`,
        path: ["devices"],
      });
    }

    // MAC address required only for wifi_module
    data.devices.forEach((d, index) => {
      if (d.deviceType === "wifi_module" && !d.macAddress) {
        ctx.addIssue({
          code: "custom",
          message: "Địa chỉ MAC là bắt buộc cho WiFi Module",
          path: ["devices", index, "macAddress"],
        });
      }
    });

    // Unique MAC addresses (among devices that have one)
    const macs = new Set<string>();
    data.devices.forEach((d, index) => {
      if (d.macAddress) {
        const mac = d.macAddress.toUpperCase();
        if (macs.has(mac)) {
          ctx.addIssue({
            code: "custom",
            message: "Địa chỉ MAC bị trùng lặp",
            path: ["devices", index, "macAddress"],
          });
        }
        macs.add(mac);
      }
    });
  });

// ── Update body ────────────────────────────────────────────────────────

export const UpdateIotDeviceBodySchema = z.object({
  deviceName: z.string().min(1).max(255).optional(),
  macAddress: z
    .string()
    .max(17)
    .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)
    .optional(),
  status: DeviceStatusSchema.optional(),
});

export const AdminCreateSensorBodySchema = z
  .object({
    sensorType: z.string(),
    status: z.string().optional(),
    minValue: z.number(),
    maxValue: z.number(),
  })
  .refine((v) => v.minValue <= v.maxValue, {
    message: "minValue must be <= maxValue",
    path: ["minValue"],
  });

export const AdminCreateSensorBatchBodySchema = z.object({
  items: z.array(AdminCreateSensorBodySchema).min(1),
});

export const AdminUpdateSensorBodySchema = z
  .object({
    sensorType: z.string().optional(),
    status: z.string().optional(),
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
  })
  .refine(
    (v) =>
      v.sensorType !== undefined ||
      v.status !== undefined ||
      v.minValue !== undefined ||
      v.maxValue !== undefined,
    { message: "At least one field must be provided" },
  );

export const AdminAssignOwnerBodySchema = z.object({
  iotDeviceId: z.string().uuid(),
  ownerId: z.string().uuid(),
  iotKitOrderId: z.string().uuid().optional(),
});

export const AdminAssignFromKitBodySchema = z.object({
  iotDeviceId: z.string().uuid("Vui lòng chọn thiết bị."),
  ownerId: z.string().uuid("Vui lòng chọn chủ trang trại."),
  iotKitOrderId: z.string().uuid("Vui lòng chọn đơn kit."),
});
export type AdminAssignFromKitBodyType = z.infer<
  typeof AdminAssignFromKitBodySchema
>;

export const AdminUnassignOwnerBodySchema = z.object({
  iotDeviceId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

// ── Response schemas ───────────────────────────────────────────────────

export const IotDeviceLatestLogSchema = z.object({
  id: z.string().uuid(),
  action: z.string(),
  reason: z.string().nullable(),
  performedBy: z.string().uuid(),
  zoneIdSnapshot: z.string().uuid().nullable(),
  createdAt: z.string(),
});

export const ProvisionAssignedOwnerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const IotDeviceResSchema = z.object({
  id: z.string().uuid(),
  deviceName: z.string(),
  deviceType: IotDeviceTypeSchema,
  macAddress: z.string().nullable(),
  status: DeviceStatusSchema,
  installedAt: z.string(),
  iotDeviceBoardId: z.string().uuid().nullable(),
  sensorsLockedAt: z.string().nullable().optional(),
  owner: ProvisionAssignedOwnerSchema.nullable().optional(),
  latestLog: IotDeviceLatestLogSchema.nullable(),
});

export const FarmSummarySchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
});

export const SensorSummarySchema = z.object({
  id: z.string().uuid(),
  sensorType: z.string(),
  status: z.string(),
  minValue: z.string(),
  maxValue: z.string(),
});

export const IotDeviceDetailResSchema = IotDeviceResSchema.extend({
  farm: FarmSummarySchema.nullable(),
  sensors: z.array(SensorSummarySchema),
  subDevices: z.array(
    IotDeviceResSchema.extend({
      farm: FarmSummarySchema.nullable(),
      sensors: z.array(SensorSummarySchema),
    }),
  ),
});

// ── List query ─────────────────────────────────────────────────────────

export const ListIotDevicesQuerySchema = PagingRequestSchema.extend({
  status: DeviceStatusSchema.optional(),
  deviceType: z.string().optional(),
});

// ── List response ──────────────────────────────────────────────────────

export const ListIotDevicesResSchema = PagingResponseSchema(IotDeviceResSchema);
export const IotDeviceBatchResSchema = z.array(IotDeviceResSchema);

// ── Type exports ───────────────────────────────────────────────────────

export type DeviceStatusType = z.infer<typeof DeviceStatusSchema>;
export type IotDeviceType = z.infer<typeof IotDeviceTypeSchema>;
export type IotDeviceResType = z.infer<typeof IotDeviceResSchema>;
export type IotDeviceDetailResType = z.infer<typeof IotDeviceDetailResSchema>;
export type CreateIotDeviceItemType = z.infer<typeof CreateIotDeviceItemSchema>;
export type CreateIotDeviceBatchBodyType = z.infer<
  typeof CreateIotDeviceBatchBodySchema
>;
export type AdminCreateIotDeviceBatchBodyType = CreateIotDeviceBatchBodyType;
export type UpdateIotDeviceBodyType = z.infer<typeof UpdateIotDeviceBodySchema>;
export type AdminCreateSensorBatchBodyType = z.infer<
  typeof AdminCreateSensorBatchBodySchema
>;
export type AdminUpdateSensorBodyType = z.infer<
  typeof AdminUpdateSensorBodySchema
>;
export type AdminAssignOwnerBodyType = z.infer<
  typeof AdminAssignOwnerBodySchema
>;
export type AdminUnassignOwnerBodyType = z.infer<
  typeof AdminUnassignOwnerBodySchema
>;
export type ListIotDevicesQueryType = z.infer<typeof ListIotDevicesQuerySchema>;
export type ListIotDevicesResType = z.infer<typeof ListIotDevicesResSchema>;
export type IotDeviceBatchResType = z.infer<typeof IotDeviceBatchResSchema>;
