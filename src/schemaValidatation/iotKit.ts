import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";
import { z } from "zod";

// ============================================================
// Enums (mirror BE iot-kit.model.ts)
// ============================================================
export const BoardTypeEnum = z.enum([
  "board_module",
  "wifi_module",
  "lora_module",
]);
export type BoardType = z.infer<typeof BoardTypeEnum>;

export const IotKitOrderStatusEnum = z.enum([
  "PENDING",
  "PAID",
  "CANCELLED",
  "REFUNDED",
]);
export type IotKitOrderStatus = z.infer<typeof IotKitOrderStatusEnum>;

export const SensorTypeEnum = z.enum([
  "soil_moisture",
  "air_temperature",
  "air_humidity",
  "light_intensity",
]);
export type IotKitSensorType = z.infer<typeof SensorTypeEnum>;

export const KitModuleNameEnum = z.enum(["board", "esp32", "lora"]);
export type KitModuleName = z.infer<typeof KitModuleNameEnum>;

// ============================================================
// IotDeviceKit (catalog)
// ============================================================
export const IotDeviceKitResSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
  description: z.string().nullable(),
  price: z.number(),
  currency: z.string(),
  boardType: BoardTypeEnum,
  includedSensors: z.array(SensorTypeEnum).nullable(),
  includedModules: z.array(KitModuleNameEnum).nullable(),
  deviceCount: z.number().int().positive(),
  isActive: z.boolean(),
  inStock: z.boolean(),
  thumbnailUrl: z.string().nullable(),
  metadata: z.unknown().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type IotDeviceKitResType = z.infer<typeof IotDeviceKitResSchema>;

export const ListIotDeviceKitsResSchema = PagingResponseSchema(
  IotDeviceKitResSchema,
);
export type ListIotDeviceKitsResType = z.infer<
  typeof ListIotDeviceKitsResSchema
>;

// ============================================================
// IotKitOrder
// ============================================================
export const IotKitOrderItemResSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  kitId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number(),
  amount: z.number(),
  metadata: z.unknown().nullable(),
});
export type IotKitOrderItemResType = z.infer<typeof IotKitOrderItemResSchema>;

export const IotKitOrderResSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  ownerId: z.string().uuid(),
  subscriptionId: z.string().uuid(),
  status: IotKitOrderStatusEnum,
  totalAmount: z.number(),
  currency: z.string(),
  invoiceId: z.string().uuid().nullable(),
  cancelledAt: z.string().nullable(),
  cancelReason: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type IotKitOrderResType = z.infer<typeof IotKitOrderResSchema>;

// ============================================================
// Request bodies
// ============================================================
export const CreateIotKitBodySchema = z
  .object({
    code: z
      .string()
      .min(1, "Vui lòng nhập mã bộ kit.")
      .max(64, "Mã bộ kit không được vượt quá 64 ký tự.")
      .regex(
        /^[A-Z0-9_-]+$/,
        "Mã chỉ chứa chữ HOA, số, gạch dưới hoặc gạch ngang.",
      ),
    name: z
      .string()
      .min(1, "Vui lòng nhập tên bộ kit.")
      .max(255, "Tên không được vượt quá 255 ký tự."),
    description: z
      .string()
      .max(2000, "Mô tả không được vượt quá 2000 ký tự.")
      .optional(),
    price: z
      .number({ message: "Vui lòng nhập giá hợp lệ." })
      .min(10000, "Giá tối thiểu là 10.000đ để đảm bảo cổng thanh toán chấp nhận."),
    boardType: BoardTypeEnum,
    includedSensors: z.array(SensorTypeEnum).optional(),
    includedModules: z.array(KitModuleNameEnum).optional(),
    deviceCount: z
      .number()
      .int("Số bộ phải là số nguyên.")
      .positive("Số bộ phải lớn hơn 0."),
    thumbnailUrl: z
      .string()
      .max(500, "URL không được vượt quá 500 ký tự.")
      .url("Đường dẫn URL không hợp lệ.")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    metadata: z.unknown().optional(),
  })
  .strict();
export type CreateIotKitBodyType = z.infer<typeof CreateIotKitBodySchema>;

export const UpdateIotKitBodySchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(2000).nullable().optional(),
    price: z
      .number()
      .min(10000, "Giá tối thiểu là 10.000đ để đảm bảo cổng thanh toán chấp nhận.")
      .optional(),
    boardType: BoardTypeEnum.optional(),
    includedSensors: z.array(SensorTypeEnum).nullable().optional(),
    includedModules: z.array(KitModuleNameEnum).nullable().optional(),
    deviceCount: z.number().int().positive().optional(),
    thumbnailUrl: z
      .string()
      .max(500)
      .url()
      .nullable()
      .optional()
      .or(z.literal("").transform(() => undefined)),
    metadata: z.unknown().nullable().optional(),
  })
  .strict();
export type UpdateIotKitBodyType = z.infer<typeof UpdateIotKitBodySchema>;

export const PurchaseIotKitBodySchema = z
  .object({
    quantity: z.literal(1),
  })
  .strict();
export type PurchaseIotKitBodyType = z.infer<typeof PurchaseIotKitBodySchema>;

// ============================================================
// Query schemas
// ============================================================
export const ListIotKitsQuerySchema = PagingRequestSchema.extend({
  isActive: z.coerce.boolean().optional(),
  boardType: BoardTypeEnum.optional(),
  sortBy: z.enum(["createdAt", "price", "name"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
}).strict();
export type ListIotKitsQueryType = z.infer<typeof ListIotKitsQuerySchema>;

// ============================================================
// Response schemas
// ============================================================
export const PurchaseIotKitResSchema = z.object({
  orderId: z.string().uuid(),
  orderNumber: z.string(),
  invoiceId: z.string().uuid(),
  invoiceNumber: z.string(),
  totalAmount: z.number(),
  paymentUrl: z.string().nullable(),
  packageKind: z.literal("IOT_KIT"),
});
export type PurchaseIotKitResType = z.infer<typeof PurchaseIotKitResSchema>;

export const IotKitOrderPaymentStatusResSchema = z.object({
  orderId: z.string().uuid(),
  orderStatus: IotKitOrderStatusEnum,
  invoiceId: z.string().uuid().nullable(),
  invoiceStatus: z.string().nullable(),
  transactionStatus: z.string().nullable(),
  paidAt: z.string().nullable(),
});
export type IotKitOrderPaymentStatusResType = z.infer<
  typeof IotKitOrderPaymentStatusResSchema
>;

export const IotQuotaResSchema = z.object({
  subscriptionMax: z.number().int(),
  kitBonus: z.number().int(),
  used: z.number().int(),
  remaining: z.number().int(),
  expiresAt: z.string().nullable(),
});
export type IotQuotaResType = z.infer<typeof IotQuotaResSchema>;

export const IotKitAssignedStatusEnum = z.enum([
  "UNASSIGNED",
  "ASSIGNED",
  "RETURNED",
]);
export type IotKitAssignedStatus = z.infer<typeof IotKitAssignedStatusEnum>;

export const AvailableSlotItemSchema = z.object({
  orderId: z.string().uuid(),
  orderNumber: z.string(),
  kitId: z.string().uuid(),
  kitCode: z.string(),
  kitName: z.string(),
  boardType: BoardTypeEnum,
  includedSensors: z.array(SensorTypeEnum).nullable(),
  includedModules: z.array(KitModuleNameEnum).nullable(),
  deviceCount: z.number().int(),
  totalSlots: z.number().int(),
  usedSlots: z.number().int(),
  remainingSlots: z.number().int(),
  statusAssigned: IotKitAssignedStatusEnum.nullable(),
  createdAt: z.string(),
});
export type AvailableSlotItemType = z.infer<typeof AvailableSlotItemSchema>;

export const AvailableSlotsResSchema = z.object({
  data: z.array(AvailableSlotItemSchema),
});
export type AvailableSlotsResType = z.infer<typeof AvailableSlotsResSchema>;

// ============================================================
// Owners eligible for kit assignment (paginated, BE pre-filtered)
// ============================================================
export const OwnerWithAvailableKitsSchema = z.object({
  owner: z.object({
    id: z.string().uuid(),
    fullName: z.string(),
    email: z.string(),
    phone: z.string().nullable(),
    avatarUrl: z.string().nullable(),
  }),
  quota: z.object({
    subscriptionMax: z.number().int(),
    kitBonus: z.number().int(),
    used: z.number().int(),
    effectiveLimit: z.number().int(),
    remaining: z.number().int(),
  }),
  orders: z.array(AvailableSlotItemSchema),
});
export type OwnerWithAvailableKitsType = z.infer<
  typeof OwnerWithAvailableKitsSchema
>;

export const ListOwnersWithAvailableKitsQuerySchema =
  PagingRequestSchema.extend({
    search: z.string().optional(),
  }).strict();
export type ListOwnersWithAvailableKitsQueryType = z.infer<
  typeof ListOwnersWithAvailableKitsQuerySchema
>;

export const ListOwnersWithAvailableKitsResSchema = PagingResponseSchema(
  OwnerWithAvailableKitsSchema,
);
export type ListOwnersWithAvailableKitsResType = z.infer<
  typeof ListOwnersWithAvailableKitsResSchema
>;

// ============================================================
// Owner — IoT provisioning tracking page
// ============================================================
export const ProvisionedDeviceSummarySchema = z.object({
  id: z.string().uuid(),
  deviceName: z.string(),
  deviceType: z.string(),
  status: z.string(),
  installedAt: z.string(),
  provisionedAt: z.string(),
});
export type ProvisionedDeviceSummaryType = z.infer<
  typeof ProvisionedDeviceSummarySchema
>;

export const OwnerKitOrderTrackingSchema = z.object({
  orderId: z.string().uuid(),
  orderNumber: z.string(),
  status: IotKitOrderStatusEnum,
  statusAssigned: IotKitAssignedStatusEnum.nullable(),
  totalAmount: z.number(),
  createdAt: z.string(),
  cancelledAt: z.string().nullable(),
  kit: z.object({
    id: z.string().uuid(),
    code: z.string(),
    name: z.string(),
    boardType: BoardTypeEnum,
    includedSensors: z.array(SensorTypeEnum).nullable(),
    includedModules: z.array(KitModuleNameEnum).nullable(),
    deviceCount: z.number().int(),
  }),
  totalSlots: z.number().int(),
  usedSlots: z.number().int(),
  remainingSlots: z.number().int(),
  devices: z.array(ProvisionedDeviceSummarySchema),
});
export type OwnerKitOrderTrackingType = z.infer<
  typeof OwnerKitOrderTrackingSchema
>;

export const OwnerIotTrackingResSchema = z.object({
  quota: IotQuotaResSchema,
  kitOrders: z.array(OwnerKitOrderTrackingSchema),
  subscriptionDevices: z.array(ProvisionedDeviceSummarySchema),
});
export type OwnerIotTrackingResType = z.infer<typeof OwnerIotTrackingResSchema>;

// ============================================================
// IoT Kit Order summary embedded inside Invoice referenceData
// ============================================================
export const IotKitOrderInvoiceSummarySchema = z.object({
  orderId: z.string().uuid().optional(),
  orderNumber: z.string().optional(),
  status: IotKitOrderStatusEnum.optional(),
  totalAmount: z.number().optional(),
  kitName: z.string().optional(),
  kitCode: z.string().optional(),
  quantity: z.number().int().optional(),
});
export type IotKitOrderInvoiceSummaryType = z.infer<
  typeof IotKitOrderInvoiceSummarySchema
>;

// ============================================================
// Vietnamese label maps
// ============================================================
export const SENSOR_TYPE_LABEL_VI: Record<IotKitSensorType, string> = {
  soil_moisture: "Độ ẩm đất",
  air_temperature: "Nhiệt độ",
  air_humidity: "Độ ẩm không khí",
  light_intensity: "Cường độ ánh sáng",
};

export const KIT_MODULE_LABEL_VI: Record<KitModuleName, string> = {
  board: "Bo mạch chính",
  esp32: "Module Wi-Fi (ESP32)",
  lora: "Module LoRa",
};

export const BOARD_TYPE_LABEL_VI: Record<BoardType, string> = {
  board_module: "Bo mạch tích hợp (board_module)",
  wifi_module: "Module Wi-Fi",
  lora_module: "Module LoRa",
};
