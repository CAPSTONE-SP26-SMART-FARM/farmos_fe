import { z } from "zod";
import { DeviceStatusSchema, IotDeviceTypeSchema } from "./iotDevice";

// ─────────────────────────────────────────────────────────────
// Shared
// ─────────────────────────────────────────────────────────────

const uuidSchema = z.string().uuid();
const isoDatetimeSchema = z.string().datetime();

// ─────────────────────────────────────────────────────────────
// A1 — GET /dashboard/admin/iot-overview
// ─────────────────────────────────────────────────────────────

export const IotOverviewOldestSchema = z.object({
  ageDays: z.number().int().nonnegative(),
  label: z.string(),
});

export const IotOverviewActionItemSchema = z.object({
  count: z.number().int().nonnegative(),
  oldest: IotOverviewOldestSchema.nullable(),
});

export const IotOverviewInventorySchema = z.object({
  available: z.number().int().nonnegative(),
  purchase: z.number().int().nonnegative(),
  install: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  error: z.number().int().nonnegative(),
  revoked: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

export const IotOverviewRecentActivitySchema = z.object({
  period: z.literal("24h"),
  newSwaps: z.number().int().nonnegative(),
  newPaidOrders: z.number().int().nonnegative(),
  devicesActivated: z.number().int().nonnegative(),
});

export const IotOverviewResSchema = z.object({
  actionRequired: z.object({
    errorDevices: IotOverviewActionItemSchema,
    pendingInstall: IotOverviewActionItemSchema,
  }),
  inventoryHealth: IotOverviewInventorySchema,
  recentActivity: IotOverviewRecentActivitySchema,
});

export type IotOverviewResType = z.infer<typeof IotOverviewResSchema>;

// ─────────────────────────────────────────────────────────────
// A2 — GET admin/iot-device/:deviceId/decision-context
// ─────────────────────────────────────────────────────────────

export const DecisionContextOwnerSchema = z.object({
  id: uuidSchema,
  fullName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  totalDevices: z.number().int().nonnegative(),
  activeKits: z.number().int().nonnegative(),
  subscriptionStatus: z.string().nullable(),
  subExpiresAt: isoDatetimeSchema.nullable(),
});

export const DecisionContextMilestoneSchema = z.object({
  milestoneId: uuidSchema,
  milestoneName: z.string(),
  zoneName: z.string(),
  cropSeasonName: z.string(),
});

export const DecisionContextErrorSchema = z.object({
  sinceAt: isoDatetimeSchema,
  ageDays: z.number().int().nonnegative(),
});

export const SwapCandidateSchema = z.object({
  id: uuidSchema,
  label: z.string().nullable(),
  isEligible: z.boolean(),
  missingRequirements: z.array(z.string()),
});

export const KitConstraintSchema = z.object({
  kitName: z.string(),
  boardType: IotDeviceTypeSchema,
  includedSensors: z.array(z.string()),
  includedModules: z.array(z.string()),
});

export const SwapInfoSchema = z.object({
  possible: z.boolean(),
  candidatesCount: z.number().int().nonnegative(),
  topCandidates: z.array(SwapCandidateSchema),
  kitConstraint: KitConstraintSchema.nullable(),
});

// Loose schema for device — chỉ pick những field UI dùng. BE trả về full
// IotDeviceProvisioningDetailRes, FE không cần validate hết.
export const DecisionContextDeviceSchema = z
  .object({
    id: uuidSchema,
    deviceName: z.string(),
    deviceType: IotDeviceTypeSchema,
    status: DeviceStatusSchema,
    macAddress: z.string().nullable().optional(),
    label: z.string().nullable().optional(),
  })
  .passthrough();

export const DeviceLocationSchema = z.object({
  farmId: uuidSchema.nullable(),
  farmName: z.string().nullable(),
  farmAddress: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  zoneId: uuidSchema.nullable(),
  zoneName: z.string().nullable(),
  installedAt: isoDatetimeSchema.nullable(),
  isInWarehouse: z.boolean(),
});

export const DecisionContextResSchema = z.object({
  device: DecisionContextDeviceSchema,
  owner: DecisionContextOwnerSchema.nullable(),
  deviceLocation: DeviceLocationSchema,
  activeMilestones: z.array(DecisionContextMilestoneSchema),
  errorContext: DecisionContextErrorSchema.nullable(),
  swap: SwapInfoSchema,
});

export type DeviceLocationType = z.infer<typeof DeviceLocationSchema>;

export type DecisionContextOwnerType = z.infer<typeof DecisionContextOwnerSchema>;
export type DecisionContextMilestoneType = z.infer<typeof DecisionContextMilestoneSchema>;
export type DecisionContextErrorType = z.infer<typeof DecisionContextErrorSchema>;
export type SwapCandidateType = z.infer<typeof SwapCandidateSchema>;
export type KitConstraintType = z.infer<typeof KitConstraintSchema>;
export type SwapInfoType = z.infer<typeof SwapInfoSchema>;
export type DecisionContextResType = z.infer<typeof DecisionContextResSchema>;

// ─────────────────────────────────────────────────────────────
// Swap board (action từ A2)
// POST admin/iot-device/swap
// ─────────────────────────────────────────────────────────────

export const AdminSwapBoardBodySchema = z.object({
  oldBoardId: uuidSchema,
  newBoardId: uuidSchema,
});

export type AdminSwapBoardBodyType = z.infer<typeof AdminSwapBoardBodySchema>;

// ─────────────────────────────────────────────────────────────
// A3a — GET admin/iot-device/install-queue
// ─────────────────────────────────────────────────────────────

export const InstallQueueGroupBySchema = z.enum(["farm-zone", "farm"]);

export const InstallQueueQuerySchema = z.object({
  groupBy: InstallQueueGroupBySchema.optional(),
  farmId: uuidSchema.optional(),
  ownerId: uuidSchema.optional(),
  search: z.string().max(100).optional(),
  minAgeDays: z.number().int().nonnegative().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(50).optional(),
});

export const QueuePaginationSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  totalFarms: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export type QueuePaginationType = z.infer<typeof QueuePaginationSchema>;

// New farm→zone→kit shape (matches BE redesign).
export const InstallQueueFarmDeviceSchema = z.object({
  id: uuidSchema,
  label: z.string().nullable(),
  kitId: uuidSchema.nullable(),
  kitName: z.string().nullable(),
  orderId: uuidSchema.nullable(),
  orderNumber: z.string().nullable(),
  purchasedAt: isoDatetimeSchema.nullable(),
  ageDays: z.number().int().nonnegative(),
});

export const InstallQueueCropSeasonContextSchema = z.object({
  cropSeasonId: uuidSchema,
  cropSeasonName: z.string(),
  milestoneName: z.string().nullable(),
  approvedAt: isoDatetimeSchema.nullable(),
});

export const InstallQueueKitBreakdownSchema = z.object({
  kitId: uuidSchema.nullable(),
  kitName: z.string(),
  boardType: IotDeviceTypeSchema.nullable(),
  count: z.number().int().nonnegative(),
  estimatedInstallMinutes: z.number().int().nullable(),
});

export const InstallQueueZoneSchema = z.object({
  zoneId: uuidSchema.nullable(),
  zoneName: z.string().nullable(),
  isUnzoned: z.boolean(),
  totalDevices: z.number().int().nonnegative(),
  oldestAgeDays: z.number().int().nonnegative(),
  cropSeasonContext: z.array(InstallQueueCropSeasonContextSchema),
  kitBreakdown: z.array(InstallQueueKitBreakdownSchema),
  devices: z.array(InstallQueueFarmDeviceSchema),
});

export const InstallQueueFarmSchema = z.object({
  farmId: uuidSchema.nullable(),
  farmCode: z.string().nullable(),
  farmName: z.string(),
  address: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  ownerId: uuidSchema.nullable(),
  ownerName: z.string(),
  totalDevices: z.number().int().nonnegative(),
  oldestAgeDays: z.number().int().nonnegative(),
  zones: z.array(InstallQueueZoneSchema),
});

// Legacy device shape inside `groups[]` (kept for backward-compat).
export const InstallQueueDeviceSchema = z.object({
  id: uuidSchema,
  label: z.string().nullable(),
  ownerName: z.string(),
  purchasedAt: isoDatetimeSchema.nullable(),
  ageDays: z.number().int().nonnegative(),
  kitName: z.string().nullable(),
});

export const InstallQueueGroupKeySchema = z.object({
  type: z.literal("farm"),
  id: uuidSchema.nullable(),
  label: z.string(),
  address: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
});

export const InstallQueueGroupSchema = z.object({
  key: InstallQueueGroupKeySchema,
  deviceCount: z.number().int().nonnegative(),
  oldestAgeDays: z.number().int().nonnegative(),
  devices: z.array(InstallQueueDeviceSchema),
});

export const InstallQueueResSchema = z.object({
  totalDevicesPending: z.number().int().nonnegative(),
  totalFarms: z.number().int().nonnegative().optional(),
  totalZones: z.number().int().nonnegative().optional(),
  oldestAgeDays: z.number().int().nonnegative().optional(),
  generatedAt: isoDatetimeSchema.optional(),
  farms: z.array(InstallQueueFarmSchema).optional(),
  pagination: QueuePaginationSchema.optional(),
  groups: z.array(InstallQueueGroupSchema).optional(),
});

export type InstallQueueQueryType = z.infer<typeof InstallQueueQuerySchema>;
export type InstallQueueDeviceType = z.infer<typeof InstallQueueDeviceSchema>;
export type InstallQueueGroupType = z.infer<typeof InstallQueueGroupSchema>;
export type InstallQueueResType = z.infer<typeof InstallQueueResSchema>;
export type InstallQueueFarmType = z.infer<typeof InstallQueueFarmSchema>;
export type InstallQueueZoneType = z.infer<typeof InstallQueueZoneSchema>;
export type InstallQueueKitBreakdownType = z.infer<typeof InstallQueueKitBreakdownSchema>;
export type InstallQueueCropSeasonContextType = z.infer<typeof InstallQueueCropSeasonContextSchema>;
export type InstallQueueFarmDeviceType = z.infer<typeof InstallQueueFarmDeviceSchema>;

// ─────────────────────────────────────────────────────────────
// A3b — POST admin/iot-device/bulk-set-status
// ─────────────────────────────────────────────────────────────

export const BulkSetStatusContextSchema = z.object({
  zoneId: uuidSchema.optional(),
  farmId: uuidSchema.optional(),
  cropSeasonId: uuidSchema.optional(),
});

export const BulkSetStatusBodySchema = z.object({
  deviceIds: z.array(uuidSchema).min(1).max(200),
  status: DeviceStatusSchema,
  reason: z.string().max(500).optional(),
  context: BulkSetStatusContextSchema.optional(),
});

export type BulkSetStatusContextType = z.infer<typeof BulkSetStatusContextSchema>;

export const BulkActionResultItemSchema = z.object({
  deviceId: uuidSchema,
  ok: z.boolean(),
  error: z.string().nullable(),
});

export const BulkActionResSchema = z.object({
  total: z.number().int().nonnegative(),
  successCount: z.number().int().nonnegative(),
  failureCount: z.number().int().nonnegative(),
  results: z.array(BulkActionResultItemSchema),
});

export type BulkSetStatusBodyType = z.infer<typeof BulkSetStatusBodySchema>;
export type BulkActionResultItemType = z.infer<typeof BulkActionResultItemSchema>;
export type BulkActionResType = z.infer<typeof BulkActionResSchema>;

// ─────────────────────────────────────────────────────────────
// A4 — GET admin/owner/:ownerId/iot-overview
// ─────────────────────────────────────────────────────────────

const FarmSummarySchema = z.object({
  id: uuidSchema,
  code: z.string().optional(),
  name: z.string(),
  address: z.string().optional().nullable(),
});

export const OwnerOverviewProfileSchema = z.object({
  id: uuidSchema,
  fullName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  createdAt: isoDatetimeSchema,
  isActive: z.boolean(),
});

export const OwnerOverviewSubscriptionSchema = z.object({
  id: uuidSchema,
  planName: z.string(),
  status: z.string(),
  startedAt: isoDatetimeSchema.nullable(),
  expiresAt: isoDatetimeSchema.nullable(),
});

export const OwnerOverviewQuotaSchema = z.object({
  subscriptionMax: z.number().int().nonnegative(),
  kitBonus: z.number().int().nonnegative(),
  effectiveLimit: z.number().int().nonnegative(),
  used: z.number().int().nonnegative(),
  remaining: z.number().int(),
});

export const OwnerOverviewDeviceSchema = z.object({
  id: uuidSchema,
  label: z.string().nullable(),
  deviceName: z.string(),
  status: DeviceStatusSchema,
  lastSeenAt: isoDatetimeSchema.nullable(),
  farm: FarmSummarySchema.nullable(),
});

export const OwnerOverviewKitOrderSchema = z.object({
  orderId: uuidSchema,
  orderNumber: z.string(),
  kitName: z.string().nullable(),
  status: z.string(),
  deviceCount: z.number().int().nonnegative(),
  assignedCount: z.number().int().nonnegative(),
});

export const OwnerOverviewEventSchema = z.object({
  at: isoDatetimeSchema,
  deviceId: uuidSchema,
  deviceLabel: z.string().nullable(),
  action: z.string(),
  reason: z.string().nullable(),
});

export const OwnerOverviewErrorDeviceSchema = z.object({
  deviceId: uuidSchema,
  label: z.string().nullable(),
  sinceAt: isoDatetimeSchema,
});

export const OwnerOverviewUnpaidOrderSchema = z.object({
  orderId: uuidSchema,
  orderNumber: z.string(),
  amount: z.number(),
  ageDays: z.number().int().nonnegative(),
});

export const OwnerOverviewIssuesSchema = z.object({
  errorDevices: z.array(OwnerOverviewErrorDeviceSchema),
  unpaidOrders: z.array(OwnerOverviewUnpaidOrderSchema),
  expiringSubIn7d: z.boolean(),
});

export const OwnerOverviewResSchema = z.object({
  owner: OwnerOverviewProfileSchema,
  subscription: OwnerOverviewSubscriptionSchema.nullable(),
  quota: OwnerOverviewQuotaSchema,
  devices: z.array(OwnerOverviewDeviceSchema),
  kitOrders: z.array(OwnerOverviewKitOrderSchema),
  recentEvents: z.array(OwnerOverviewEventSchema),
  outstandingIssues: OwnerOverviewIssuesSchema,
});

export type OwnerOverviewProfileType = z.infer<typeof OwnerOverviewProfileSchema>;
export type OwnerOverviewSubscriptionType = z.infer<typeof OwnerOverviewSubscriptionSchema>;
export type OwnerOverviewQuotaType = z.infer<typeof OwnerOverviewQuotaSchema>;
export type OwnerOverviewDeviceType = z.infer<typeof OwnerOverviewDeviceSchema>;
export type OwnerOverviewKitOrderType = z.infer<typeof OwnerOverviewKitOrderSchema>;
export type OwnerOverviewEventType = z.infer<typeof OwnerOverviewEventSchema>;
export type OwnerOverviewIssuesType = z.infer<typeof OwnerOverviewIssuesSchema>;
export type OwnerOverviewResType = z.infer<typeof OwnerOverviewResSchema>;

// ─────────────────────────────────────────────────────────────
// A5 — GET admin/iot-device/:deviceId/timeline
// ─────────────────────────────────────────────────────────────

export const DeviceTimelineQuerySchema = z.object({
  limit: z.number().int().min(1).max(200).optional(),
  before: isoDatetimeSchema.optional(),
});

export const TimelineEventSourceSchema = z.enum([
  "audit_log",
  "notification",
  "provision",
]);

export const TimelineEventSchema = z.object({
  at: isoDatetimeSchema,
  source: TimelineEventSourceSchema,
  type: z.string(),
  details: z.record(z.string(), z.unknown()),
});

export const DeviceTimelineResSchema = z.object({
  deviceId: uuidSchema,
  events: z.array(TimelineEventSchema),
  hasMore: z.boolean(),
  nextBefore: isoDatetimeSchema.nullable(),
});

export type DeviceTimelineQueryType = z.infer<typeof DeviceTimelineQuerySchema>;
export type TimelineEventSourceType = z.infer<typeof TimelineEventSourceSchema>;
export type TimelineEventApiType = z.infer<typeof TimelineEventSchema>;
export type DeviceTimelineResType = z.infer<typeof DeviceTimelineResSchema>;

// ─────────────────────────────────────────────────────────────
// A6 — GET admin/iot-device/recovery-queue
// ─────────────────────────────────────────────────────────────

export const RecoveryQueueQuerySchema = z.object({
  groupBy: z.enum(["farm-zone"]).optional(),
  farmId: uuidSchema.optional(),
  ownerId: uuidSchema.optional(),
  search: z.string().max(100).optional(),
  minDaysOverdue: z.number().int().nonnegative().optional(),
  onlineOnly: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(50).optional(),
});

export const RecoveryDeviceSchema = z.object({
  id: uuidSchema,
  label: z.string().nullable(),
  kitId: uuidSchema.nullable(),
  kitName: z.string().nullable(),
  orderId: uuidSchema.nullable(),
  orderNumber: z.string().nullable(),
  installedAt: isoDatetimeSchema.nullable(),
  daysInField: z.number().int().nonnegative(),
  lastSeenAt: isoDatetimeSchema.nullable(),
  isOnline: z.boolean(),
  currentStatus: DeviceStatusSchema,
});

export const RecoveryKitBreakdownSchema = z.object({
  kitId: uuidSchema.nullable(),
  kitName: z.string(),
  boardType: IotDeviceTypeSchema.nullable(),
  count: z.number().int().nonnegative(),
  onlineCount: z.number().int().nonnegative(),
});

export const RecoveryContextSchema = z.object({
  subscriptionId: uuidSchema,
  subscriptionPlanName: z.string(),
  subscriptionExpiredAt: isoDatetimeSchema.nullable(),
  graceEndedAt: isoDatetimeSchema.nullable(),
  daysOverdue: z.number().int().nonnegative(),
});

export const RecoveryZoneSchema = z.object({
  zoneId: uuidSchema.nullable(),
  zoneName: z.string().nullable(),
  isUnzoned: z.boolean(),
  totalDevices: z.number().int().nonnegative(),
  oldestOverdueDays: z.number().int().nonnegative(),
  recoveryContext: RecoveryContextSchema.nullable(),
  kitBreakdown: z.array(RecoveryKitBreakdownSchema),
  devices: z.array(RecoveryDeviceSchema),
});

export const RecoveryFarmSchema = z.object({
  farmId: uuidSchema.nullable(),
  farmCode: z.string().nullable(),
  farmName: z.string(),
  address: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  ownerId: uuidSchema.nullable(),
  ownerName: z.string(),
  ownerPhone: z.string().nullable(),
  totalDevices: z.number().int().nonnegative(),
  oldestOverdueDays: z.number().int().nonnegative(),
  zones: z.array(RecoveryZoneSchema),
});

export const RecoveryQueueResSchema = z.object({
  totalDevicesPending: z.number().int().nonnegative(),
  totalFarms: z.number().int().nonnegative(),
  totalZones: z.number().int().nonnegative(),
  oldestOverdueDays: z.number().int().nonnegative(),
  generatedAt: isoDatetimeSchema,
  farms: z.array(RecoveryFarmSchema),
  pagination: QueuePaginationSchema.optional(),
});

// ─────────────────────────────────────────────────────────────
// A7 — POST admin/iot-device/recovery/bulk-complete
// ─────────────────────────────────────────────────────────────

export const RecoveryConditionSchema = z.enum(["good", "damaged"]);
export const RecoveryErrorReasonSchema = z.enum([
  "missing",
  "destroyed",
  "owner_refused",
]);

export const RecoveryRecoveredItemSchema = z.object({
  deviceId: uuidSchema,
  condition: RecoveryConditionSchema,
});

export const RecoveryNotRecoveredItemSchema = z.object({
  deviceId: uuidSchema,
  errorReason: RecoveryErrorReasonSchema,
});

export const RecoveryBulkCompleteContextSchema = z.object({
  farmId: uuidSchema.optional(),
  visitedAt: isoDatetimeSchema.optional(),
  assigneeId: uuidSchema.optional(),
});

export const RecoveryBulkCompleteBodySchema = z.object({
  recovered: z.array(RecoveryRecoveredItemSchema).max(200).optional(),
  notRecovered: z.array(RecoveryNotRecoveredItemSchema).max(200).optional(),
  notes: z.string().max(2000).optional(),
  context: RecoveryBulkCompleteContextSchema.optional(),
});

export const RecoveryBulkResultItemSchema = z.object({
  deviceId: uuidSchema,
  ok: z.boolean(),
  error: z.string().nullable(),
  newStatus: DeviceStatusSchema.nullable(),
});

export const RecoveryBulkCompleteResSchema = z.object({
  total: z.number().int().nonnegative(),
  successCount: z.number().int().nonnegative(),
  failureCount: z.number().int().nonnegative(),
  results: z.array(RecoveryBulkResultItemSchema),
});

// ─────────────────────────────────────────────────────────────
// A8 — POST admin/iot-device/install/mark-blocked
// ─────────────────────────────────────────────────────────────

export const InstallBlockReasonSchema = z.enum([
  "owner_absent",
  "site_not_ready",
  "missing_parts",
  "other",
]);

export const InstallMarkBlockedBodySchema = z.object({
  deviceIds: z.array(uuidSchema).min(1).max(200),
  blockReason: InstallBlockReasonSchema,
  notes: z.string().max(2000).optional(),
  retryAfterDate: isoDatetimeSchema.optional(),
});

/** Form dialog đánh dấu không lắp được (không gồm deviceIds). */
export const InstallMarkBlockedFormSchema = z.object({
  blockReason: InstallBlockReasonSchema,
  notes: z.string().max(2000, "Ghi chú tối đa 2000 ký tự").optional(),
  retryAfter: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return !Number.isNaN(new Date(val).getTime());
      },
      { message: "Ngày hẹn quay lại không hợp lệ" },
    ),
});

export const InstallMarkBlockedResSchema = BulkActionResSchema;

// ─────────────────────────────────────────────────────────────
// A9 — Attention queue (E-C5 + E-D3 vá 2026-05-24)
// ─────────────────────────────────────────────────────────────

export const AttentionKindSchema = z.enum(["error", "swap_pending_return"]);

export const AttentionQueueQuerySchema = z.object({
  farmId: uuidSchema.optional(),
  ownerId: uuidSchema.optional(),
  kind: AttentionKindSchema.optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
});

export const AttentionErrorContextSchema = z.object({
  lastReason: z.string().nullable(),
  occurredAt: isoDatetimeSchema.nullable(),
  hasActiveMilestoneAssignment: z.boolean(),
});

export const AttentionSwapContextSchema = z.object({
  swappedAt: isoDatetimeSchema.nullable(),
  revokeReason: z.string(),
});

export const AttentionItemSchema = z.object({
  deviceId: uuidSchema,
  deviceLabel: z.string().nullable(),
  deviceName: z.string(),
  deviceType: IotDeviceTypeSchema,
  currentStatus: DeviceStatusSchema,
  kind: AttentionKindSchema,
  farmId: uuidSchema.nullable(),
  farmName: z.string().nullable(),
  farmAddress: z.string().nullable(),
  ownerId: uuidSchema.nullable(),
  ownerName: z.string().nullable(),
  ownerPhone: z.string().nullable(),
  lastSeenAt: isoDatetimeSchema.nullable(),
  daysInState: z.number().int().nonnegative(),
  errorContext: AttentionErrorContextSchema.nullable(),
  swapContext: AttentionSwapContextSchema.nullable(),
});

export const AttentionQueueResSchema = z.object({
  totalDevices: z.number().int().nonnegative(),
  totalErrorBoards: z.number().int().nonnegative(),
  totalSwapPendingReturn: z.number().int().nonnegative(),
  generatedAt: isoDatetimeSchema,
  items: z.array(AttentionItemSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    totalItems: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

export const AttentionConfirmReturnedBodySchema = z.object({
  deviceIds: z.array(uuidSchema).min(1).max(200),
  notes: z.string().max(2000).optional(),
});

export const AttentionConfirmReturnedResSchema = z.object({
  total: z.number().int().nonnegative(),
  successCount: z.number().int().nonnegative(),
  failureCount: z.number().int().nonnegative(),
  results: z.array(
    z.object({
      deviceId: uuidSchema,
      ok: z.boolean(),
      error: z.string().nullable(),
    }),
  ),
});

export type AttentionKindType = z.infer<typeof AttentionKindSchema>;
export type AttentionQueueQueryType = z.infer<typeof AttentionQueueQuerySchema>;
export type AttentionItemType = z.infer<typeof AttentionItemSchema>;
export type AttentionQueueResType = z.infer<typeof AttentionQueueResSchema>;
export type AttentionConfirmReturnedBodyType = z.infer<typeof AttentionConfirmReturnedBodySchema>;
export type AttentionConfirmReturnedResType = z.infer<typeof AttentionConfirmReturnedResSchema>;

export type RecoveryQueueQueryType = z.infer<typeof RecoveryQueueQuerySchema>;
export type RecoveryDeviceType = z.infer<typeof RecoveryDeviceSchema>;
export type RecoveryKitBreakdownType = z.infer<typeof RecoveryKitBreakdownSchema>;
export type RecoveryContextType = z.infer<typeof RecoveryContextSchema>;
export type RecoveryZoneType = z.infer<typeof RecoveryZoneSchema>;
export type RecoveryFarmType = z.infer<typeof RecoveryFarmSchema>;
export type RecoveryQueueResType = z.infer<typeof RecoveryQueueResSchema>;
export type RecoveryConditionType = z.infer<typeof RecoveryConditionSchema>;
export type RecoveryErrorReasonType = z.infer<typeof RecoveryErrorReasonSchema>;
export type RecoveryRecoveredItemType = z.infer<typeof RecoveryRecoveredItemSchema>;
export type RecoveryNotRecoveredItemType = z.infer<typeof RecoveryNotRecoveredItemSchema>;
export type RecoveryBulkCompleteBodyType = z.infer<typeof RecoveryBulkCompleteBodySchema>;
export type RecoveryBulkCompleteResType = z.infer<typeof RecoveryBulkCompleteResSchema>;
export type RecoveryBulkResultItemType = z.infer<typeof RecoveryBulkResultItemSchema>;
export type InstallBlockReasonType = z.infer<typeof InstallBlockReasonSchema>;
export type InstallMarkBlockedBodyType = z.infer<typeof InstallMarkBlockedBodySchema>;
export type InstallMarkBlockedFormType = z.infer<typeof InstallMarkBlockedFormSchema>;
export type InstallMarkBlockedResType = z.infer<typeof InstallMarkBlockedResSchema>;
