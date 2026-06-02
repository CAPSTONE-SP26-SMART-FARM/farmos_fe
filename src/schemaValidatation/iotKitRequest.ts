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
  "RECOVERY_SCHEDULE",
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
  // Type-specific metadata. Set bởi BE — FE chỉ đọc.
  // Shape mirror src/shared/types/kit-request-metadata.type.ts của BE.
  metadata: z
    .object({
      triggerSource: z.enum(["system", "owner", "manager"]).optional(),
      replacementDeviceId: z.string().optional(),
      oldBoardOutcome: z.enum(["revoked", "available"]).optional(),
      boardIds: z.array(z.string()).optional(),
      recoveryResults: z
        .array(
          z.object({
            deviceId: z.string(),
            outcome: z.enum([
              "recovered_good",
              "recovered_damaged",
              "not_recovered",
            ]),
            note: z.string().optional(),
          }),
        )
        .optional(),
      milestoneId: z.string().optional(),
      installReason: z.enum(["crop_approved", "milestone_started"]).optional(),
      recoveryReason: z
        .enum(["milestone_transition", "cropseason_completed", "subscription_ended"])
        .optional(),
      boardOutcomeOnComplete: z.enum(["purchase", "available"]).optional(),
      ownerOverdueReportedAt: z.string().optional(),
      ownerOverdueReason: z.string().optional(),
    })
    .nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type KitRequestResType = z.infer<typeof KitRequestResSchema>;

// Detail response — base + devices[]
export const KitRequestDetailResSchema = KitRequestResSchema.extend({
  devices: z.array(KitRequestDeviceSchema),
  // True khi milestone của request là milestone cuối mùa vụ → ẩn nút lắp
  // giai đoạn kế. Optional để an toàn với response cache cũ chưa có field.
  isLastMilestone: z.boolean().optional(),
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
  // Lọc nhiều trạng thái cùng lúc (tab "Đang mở" / "Đã xử lý"). BE nhận mảng
  // qua repeated query param `statuses=a&statuses=b`. Ưu tiên hơn `status`.
  statuses: z.array(KitRequestStatusSchema).optional(),
  // ISO datetime — chỉ lấy request có updatedAt >= mốc (KPI "xong tháng này").
  updatedFrom: z.string().optional(),
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

// — Start install — admin (purchase → install). deviceIds: chọn từng thiết bị,
//   bỏ trống = toàn bộ device purchase thuộc scope.
export const startInstallSchema = z.object({
  deviceIds: z.array(z.string()).optional(),
});
export type StartInstallBodyType = z.infer<typeof startInstallSchema>;

// — Complete install — admin (install → inactive). deviceIds: chọn từng thiết bị.
export const completeInstallSchema = z.object({
  resolutionNote: z.string().optional(),
  deviceIds: z.array(z.string()).optional(),
});
export type CompleteInstallBodyType = z.infer<typeof completeInstallSchema>;

// — Schedule install — admin chốt giờ ghé lắp (optional, ≤ slaDeadline)
export const scheduleInstallSchema = z.object({
  scheduledAt: z
    .string()
    .min(1, "Vui lòng chọn thời gian hẹn")
    .refine(
      (v) => {
        const d = new Date(v);
        return !isNaN(d.getTime()) && d.getTime() > Date.now();
      },
      "Thời gian hẹn phải sau hiện tại",
    ),
});
export type ScheduleInstallBodyType = z.infer<typeof scheduleInstallSchema>;

// — Tạo lịch lắp cho 1 milestone (owner/admin, sau khi thu hồi giai đoạn trước)
//   Truyền milestoneId (chỉ định thẳng) HOẶC afterMilestoneId (milestone vừa
//   thu hồi → BE lắp giai đoạn kế).
export const createInstallScheduleSchema = z
  .object({
    milestoneId: z.string().optional(),
    afterMilestoneId: z.string().optional(),
    scheduledAt: z
      .string()
      .optional()
      .refine(
        (v) => !v || new Date(v).getTime() > Date.now(),
        "Thời gian hẹn phải sau hiện tại",
      ),
  })
  .refine((b) => !!b.milestoneId || !!b.afterMilestoneId, {
    message: "Thiếu giai đoạn cần lắp",
    path: ["milestoneId"],
  });
export type CreateInstallScheduleBodyType = z.infer<
  typeof createInstallScheduleSchema
>;

// — Owner báo quá hạn (reason optional)
export const reportOverdueSchema = z.object({
  reason: z
    .string()
    .max(500, "Lý do tối đa 500 ký tự")
    .optional(),
});
export type ReportOverdueBodyType = z.infer<typeof reportOverdueSchema>;

// ============================================================
// SWAP workflow — admin lên lịch + hoàn tất thay board mới (FAULT_REPORT)
// ============================================================

// GET /admin/replacement-devices — list board available cho admin pick
export const ListReplacementDevicesQuerySchema = PagingRequestSchema.extend({
  farmId: z.string().optional(),
});
export type ListReplacementDevicesQueryType = z.infer<
  typeof ListReplacementDevicesQuerySchema
>;

export const ReplacementDeviceItemSchema = z.object({
  id: z.string(),
  deviceName: z.string(),
  label: z.string().nullable(),
  status: DeviceStatusSchema,
});
export type ReplacementDeviceItemType = z.infer<
  typeof ReplacementDeviceItemSchema
>;

export const ListReplacementDevicesResSchema = PagingResponseSchema(
  ReplacementDeviceItemSchema,
);
export type ListReplacementDevicesResType = z.infer<
  typeof ListReplacementDevicesResSchema
>;

// POST /admin/:id/schedule-swap — chọn replacement + lên lịch
export const scheduleSwapSchema = z.object({
  scheduledAt: z
    .string()
    .min(1, "Vui lòng chọn thời gian hẹn")
    .refine(
      (v) => {
        const d = new Date(v);
        return !isNaN(d.getTime()) && d.getTime() > Date.now();
      },
      "Thời gian hẹn phải sau hiện tại",
    ),
  replacementDeviceId: z
    .string()
    .min(1, "Vui lòng chọn bộ kit thay thế"),
});
export type ScheduleSwapBodyType = z.infer<typeof scheduleSwapSchema>;

// POST /admin/:id/complete-swap — xác nhận đã thay xong
export const completeSwapSchema = z.object({
  oldBoardOutcome: z.enum(["revoked", "available"], {
    message: "Vui lòng chọn tình trạng bộ kit cũ",
  }),
  resolutionNote: z
    .string()
    .max(1000, "Ghi chú tối đa 1000 ký tự")
    .optional(),
});
export type CompleteSwapBodyType = z.infer<typeof completeSwapSchema>;

// POST /admin/:id/complete-swap-install — hoàn tất lắp board mới sau swap
export const completeSwapInstallSchema = z.object({
  resolutionNote: z
    .string()
    .max(1000, "Ghi chú tối đa 1000 ký tự")
    .optional(),
});
export type CompleteSwapInstallBodyType = z.infer<
  typeof completeSwapInstallSchema
>;

// ============================================================
// RECOVERY workflow — admin thu hồi kit sau khi sub hết hạn
// ============================================================

export const recoveryBoardOutcomeSchema = z.enum([
  "recovered_good",
  "recovered_damaged",
  "not_recovered",
]);
export type RecoveryBoardOutcomeType = z.infer<
  typeof recoveryBoardOutcomeSchema
>;

// POST /admin/:id/schedule-recovery
export const scheduleRecoverySchema = z.object({
  scheduledAt: z
    .string()
    .min(1, "Vui lòng chọn thời gian hẹn")
    .refine(
      (v) => {
        const d = new Date(v);
        return !isNaN(d.getTime()) && d.getTime() > Date.now();
      },
      "Thời gian hẹn phải sau hiện tại",
    ),
});
export type ScheduleRecoveryBodyType = z.infer<typeof scheduleRecoverySchema>;

// POST /admin/:id/complete-recovery
export const completeRecoverySchema = z.object({
  outcomes: z
    .array(
      z.object({
        deviceId: z.string().min(1),
        outcome: recoveryBoardOutcomeSchema,
        note: z.string().max(500).optional(),
      }),
    )
    .min(1, "Cần ít nhất 1 thiết bị"),
  resolutionNote: z
    .string()
    .max(1000, "Ghi chú tối đa 1000 ký tự")
    .optional(),
});
export type CompleteRecoveryBodyType = z.infer<typeof completeRecoverySchema>;
