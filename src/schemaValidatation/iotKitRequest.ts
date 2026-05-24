import { z } from "zod";
import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";
import { DeviceStatusSchema } from "@/schemaValidatation/iotDevice";

/**
 * Mirror các Zod schema của BE module `iot-kit-request`. Khi BE đổi shape
 * (file `iot-kit-request.model.ts`), cập nhật ở đây để giữ FE/BE đồng bộ.
 *
 * Flow mới (2026-05-24): INSTALL_SCHEDULE auto-create khi owner approve crop
 * season → admin chỉ có start-install + complete-install bulk (không có
 * accept/reject/counter). Owner KHÔNG action với INSTALL_SCHEDULE (read-only).
 */

// ============================================================
// Enums — mirror BE Prisma enum
// ============================================================

export const KitRequestStatusSchema = z.enum([
  "pending",
  "in_progress",
  "accepted",
  "resolved",
  "rejected",
  "cancelled",
]);
export type KitRequestStatusType = z.infer<typeof KitRequestStatusSchema>;

export const KitRequestTypeSchema = z.enum([
  "FAULT_REPORT",
  "INSTALL_SCHEDULE",
]);
export type KitRequestTypeType = z.infer<typeof KitRequestTypeSchema>;

export const KitRequestDirectionSchema = z.enum([
  "OWNER_TO_ADMIN",
  "ADMIN_TO_OWNER",
]);
export type KitRequestDirectionType = z.infer<
  typeof KitRequestDirectionSchema
>;

// ============================================================
// Device sub-schema — embed trong detail response khi INSTALL_SCHEDULE
// ============================================================

export const KitRequestDeviceSchema = z.object({
  id: z.string(),
  label: z.string().nullable(),
  deviceName: z.string(),
  status: DeviceStatusSchema,
  zoneId: z.string().nullable(),
  zoneName: z.string().nullable(),
  milestoneId: z.string().nullable(),
  milestoneOrder: z.number().int().nullable(),
});
export type KitRequestDeviceType = z.infer<typeof KitRequestDeviceSchema>;

// ============================================================
// Base — single request
// ============================================================

export const KitRequestResSchema = z.object({
  id: z.string(),
  requestNumber: z.string(),
  direction: KitRequestDirectionSchema,
  type: KitRequestTypeSchema,
  status: KitRequestStatusSchema,
  ownerId: z.string(),
  createdBy: z.string(),
  handlerId: z.string().nullable(),
  iotDeviceId: z.string().nullable(),
  iotKitOrderId: z.string().nullable(),
  farmId: z.string().nullable(),
  cropSeasonId: z.string().nullable(),
  title: z.string(),
  description: z.string(),
  resolutionNote: z.string().nullable(),
  slaDeadline: z.string().nullable(),
  // DEPRECATED — chỉ tồn tại với row history flow cũ. Flow mới không set.
  proposedAt: z.string().nullable(),
  scheduledAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  resolvedAt: z.string().nullable(),
  resolvedBy: z.string().nullable(),
  cancelledAt: z.string().nullable(),
  cancelReason: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type KitRequestResType = z.infer<typeof KitRequestResSchema>;

// Detail response — base + devices[]
export const KitRequestDetailResSchema = KitRequestResSchema.extend({
  devices: z.array(KitRequestDeviceSchema),
});
export type KitRequestDetailResType = z.infer<typeof KitRequestDetailResSchema>;

// ============================================================
// List response + query
// ============================================================

export const ListKitRequestsResSchema = PagingResponseSchema(KitRequestResSchema);
export type ListKitRequestsResType = z.infer<typeof ListKitRequestsResSchema>;

export const ListKitRequestsQuerySchema = PagingRequestSchema.extend({
  direction: KitRequestDirectionSchema.optional(),
  type: KitRequestTypeSchema.optional(),
  status: KitRequestStatusSchema.optional(),
  iotDeviceId: z.string().optional(),
  cropSeasonId: z.string().optional(),
  ownerId: z.string().optional(),
  handlerId: z.string().optional(),
});
export type ListKitRequestsQueryType = z.infer<
  typeof ListKitRequestsQuerySchema
>;

// ============================================================
// Bulk action response — start-install + complete-install
// ============================================================

export const KitInstallBulkResultItemSchema = z.object({
  deviceId: z.string(),
  ok: z.boolean(),
  error: z.string().nullable(),
});
export type KitInstallBulkResultItemType = z.infer<
  typeof KitInstallBulkResultItemSchema
>;

export const KitInstallBulkResSchema = z.object({
  request: KitRequestResSchema,
  total: z.number().int().nonnegative(),
  successCount: z.number().int().nonnegative(),
  failureCount: z.number().int().nonnegative(),
  results: z.array(KitInstallBulkResultItemSchema),
});
export type KitInstallBulkResType = z.infer<typeof KitInstallBulkResSchema>;

// ============================================================
// Forms
// ============================================================

// — FAULT_REPORT — owner/manager tạo
export const createFaultReportSchema = z.object({
  iotDeviceId: z.string().min(1, "Vui lòng chọn thiết bị IoT"),
  title: z
    .string()
    .min(1, "Vui lòng nhập tiêu đề")
    .max(255, "Tiêu đề tối đa 255 ký tự"),
  description: z.string().min(1, "Vui lòng mô tả tình trạng thiết bị"),
});
export type CreateFaultReportBodyType = z.infer<typeof createFaultReportSchema>;

// — Cancel — chung cho FAULT (owner) hoặc INSTALL_SCHEDULE (admin)
export const cancelRequestSchema = z.object({
  reason: z.string().min(1, "Vui lòng nhập lý do hủy"),
});
export type CancelRequestBodyType = z.infer<typeof cancelRequestSchema>;

// — Resolve FAULT — admin
export const resolveFaultSchema = z.object({
  resolutionNote: z.string().min(1, "Vui lòng nhập ghi chú xử lý"),
});
export type ResolveFaultBodyType = z.infer<typeof resolveFaultSchema>;

// — Reject — admin (chỉ FAULT)
export const rejectRequestSchema = z.object({
  reason: z.string().min(1, "Vui lòng nhập lý do từ chối"),
});
export type RejectRequestBodyType = z.infer<typeof rejectRequestSchema>;

// — Complete install — admin (bulk, chỉ resolutionNote optional)
export const completeInstallSchema = z.object({
  resolutionNote: z.string().optional(),
});
export type CompleteInstallBodyType = z.infer<typeof completeInstallSchema>;
