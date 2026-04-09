import { z } from "zod";
import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";

// ── Enums ──────────────────────────────────────────────────────────────

export const DeviceStatusSchema = z.enum([
  "active",
  "inactive",
  "maintenance",
  "decommissioned",
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
  deviceType: IotDeviceTypeSchema.optional(),
  macAddress: z
    .string()
    .max(17)
    .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)
    .nullable()
    .optional(),
  status: DeviceStatusSchema.optional(),
});

// ── Response schemas ───────────────────────────────────────────────────

export const IotDeviceResSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  deviceName: z.string(),
  deviceType: z.string(),
  macAddress: z.string().nullable(),
  status: DeviceStatusSchema,
  lastSeenAt: z.string().nullable(),
  installedAt: z.string(),
  iotDeviceBoardId: z.string().uuid().nullable(),
  sensorsLockedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});

// ── List query ─────────────────────────────────────────────────────────

export const ListIotDevicesQuerySchema = PagingRequestSchema.extend({
  status: DeviceStatusSchema.optional(),
  deviceType: z.string().optional(),
});

// ── List response ──────────────────────────────────────────────────────

export const ListIotDevicesResSchema = PagingResponseSchema(IotDeviceResSchema);

// ── Type exports ───────────────────────────────────────────────────────

export type DeviceStatusType = z.infer<typeof DeviceStatusSchema>;
export type IotDeviceType = z.infer<typeof IotDeviceTypeSchema>;
export type IotDeviceResType = z.infer<typeof IotDeviceResSchema>;
export type CreateIotDeviceItemType = z.infer<typeof CreateIotDeviceItemSchema>;
export type CreateIotDeviceBatchBodyType = z.infer<
  typeof CreateIotDeviceBatchBodySchema
>;
export type UpdateIotDeviceBodyType = z.infer<typeof UpdateIotDeviceBodySchema>;
export type ListIotDevicesQueryType = z.infer<typeof ListIotDevicesQuerySchema>;
export type ListIotDevicesResType = z.infer<typeof ListIotDevicesResSchema>;
