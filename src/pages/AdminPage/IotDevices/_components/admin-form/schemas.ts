import { z } from "zod";
import {
  DeviceStatusSchema,
  IotDeviceTypeSchema,
} from "@/schemaValidatation/iotDevice";
import { SensorTypeSchema } from "@/schemaValidatation/sensor";
import { DEVICE_TYPE_LABEL } from "@/constants/iotDeviceDisplay";

// ── Form schemas ───────────────────────────────────────────────────────

export const DeviceItemFormSchema = z
  .object({
    deviceName: z.string().trim().min(1, "Tên thiết bị là bắt buộc").max(255),
    deviceType: IotDeviceTypeSchema,
    macAddress: z
      .string()
      .max(17)
      .regex(
        /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
        "Định dạng MAC không hợp lệ",
      )
      .or(z.literal("")),
    status: DeviceStatusSchema,
  })
  .superRefine((data, ctx) => {
    if (data.deviceType === "wifi_module" && !data.macAddress) {
      ctx.addIssue({
        code: "custom",
        message: "Địa chỉ MAC là bắt buộc cho mô-đun WiFi",
        path: ["macAddress"],
      });
    }

    if (data.deviceType !== "wifi_module" && data.macAddress) {
      ctx.addIssue({
        code: "custom",
        message: "Chỉ mô-đun WiFi mới cần địa chỉ MAC",
        path: ["macAddress"],
      });
    }
  });

export const BatchCreateFormSchema = z
  .object({
    devices: z.array(DeviceItemFormSchema).min(3, "Cần ít nhất 3 thiết bị"),
  })
  .superRefine((data, ctx) => {
    const typeCounts = new Map<string, number>();
    data.devices.forEach((d) => {
      typeCounts.set(d.deviceType, (typeCounts.get(d.deviceType) ?? 0) + 1);
    });

    // Business rule: exactly 1 board_module per batch
    const boardCount = typeCounts.get("board_module") ?? 0;
    if (boardCount !== 1) {
      ctx.addIssue({
        code: "custom",
        message: `Phải có đúng 1 vi xử lý (hiện có ${boardCount})`,
        path: ["devices"],
      });
    }

    // Business rule: all 3 types required
    const required: z.infer<typeof IotDeviceTypeSchema>[] = [
      "board_module",
      "lora_module",
      "wifi_module",
    ];
    const missing = required.filter((r) => !typeCounts.has(r));
    if (missing.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: `Phải có ít nhất 1 thiết bị mỗi loại. Thiếu: ${missing
          .map((m) => DEVICE_TYPE_LABEL[m])
          .join(", ")}`,
        path: ["devices"],
      });
    }

    // Business rule: unique MAC addresses (among devices that have one)
    const macs = new Set<string>();
    data.devices.forEach((d, i) => {
      if (d.macAddress) {
        const mac = d.macAddress.toUpperCase();
        if (macs.has(mac)) {
          ctx.addIssue({
            code: "custom",
            message: "MAC bị trùng",
            path: ["devices", i, "macAddress"],
          });
        }
        macs.add(mac);
      }
    });
  });

export const EditFormSchema = z
  .object({
    deviceName: z.string().trim().min(1, "Tên thiết bị là bắt buộc").max(255),
    deviceType: IotDeviceTypeSchema,
    macAddress: z
      .string()
      .max(17)
      .regex(
        /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
        "Định dạng MAC không hợp lệ",
      )
      .or(z.literal("")),
    status: DeviceStatusSchema,
  })
  .superRefine((data, ctx) => {
    if (data.deviceType === "wifi_module" && !data.macAddress) {
      ctx.addIssue({
        code: "custom",
        message: "Địa chỉ MAC là bắt buộc cho mô-đun WiFi",
        path: ["macAddress"],
      });
    }

    if (data.deviceType !== "wifi_module" && data.macAddress) {
      ctx.addIssue({
        code: "custom",
        message: "Chỉ mô-đun WiFi mới cần địa chỉ MAC",
        path: ["macAddress"],
      });
    }
  });

// Sensor batch form for adding sensors to a board
export const SensorItemFormSchema = z.object({
  sensorType: SensorTypeSchema,
  minValue: z
    .number()
    .refine(Number.isFinite, "Giá trị tối thiểu không hợp lệ"),
  maxValue: z.number().refine(Number.isFinite, "Giá trị tối đa không hợp lệ"),
});

export const SensorBatchFormSchema = z
  .object({
    items: z
      .array(SensorItemFormSchema)
      .min(1, "Cần ít nhất 1 cảm biến")
      .max(4, "Mỗi lần chỉ thêm tối đa 4 cảm biến"),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>();

    data.items.forEach((item, index) => {
      if (seen.has(item.sensorType)) {
        ctx.addIssue({
          code: "custom",
          message: "Mỗi loại cảm biến chỉ được xuất hiện 1 lần",
          path: ["items", index, "sensorType"],
        });
      }

      seen.add(item.sensorType);

      if (item.minValue > item.maxValue) {
        ctx.addIssue({
          code: "custom",
          message: "Giá trị tối thiểu phải nhỏ hơn hoặc bằng tối đa",
          path: ["items", index, "minValue"],
        });
      }
    });
  });

export type BatchCreateFormType = z.infer<typeof BatchCreateFormSchema>;
export type EditFormType = z.infer<typeof EditFormSchema>;
export type SensorBatchFormType = z.infer<typeof SensorBatchFormSchema>;
