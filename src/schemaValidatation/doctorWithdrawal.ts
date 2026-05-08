import { z } from "zod";

// ── Status ────────────────────────────────────────────────────────────────
export const WITHDRAWAL_STATUS_VALUES = [
  "pending",
  "in_progress",
  "paid",
  "done",
  "rejected",
  "cancelled",
  "not_received",
] as const;

export type WithdrawalStatus = (typeof WITHDRAWAL_STATUS_VALUES)[number];

// ── Entity ────────────────────────────────────────────────────────────────
export const WithdrawalRequestResSchema = z.object({
  id: z.string().uuid(),
  doctorId: z.string().uuid(),
  walletId: z.string().uuid(),
  amount: z.number(),
  status: z.enum(WITHDRAWAL_STATUS_VALUES),

  bankAccountId: z.string().uuid(),
  snapshotBankCode: z.string(),
  snapshotBankName: z.string(),
  snapshotAccountNumber: z.string(),
  snapshotAccountHolder: z.string(),
  snapshotBranch: z.string().nullable(),

  doctorNote: z.string().nullable(),

  reviewedBy: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  rejectReason: z.string().nullable(),

  paidBy: z.string().nullable(),
  paidAt: z.string().nullable(),
  transferReference: z.string().nullable(),
  transferProofUrl: z.string().nullable(),
  adminNote: z.string().nullable(),

  confirmedAt: z.string().nullable(),
  notReceivedAt: z.string().nullable(),
  notReceivedReason: z.string().nullable(),

  createdAt: z.string(),
  updatedAt: z.string(),
});

export type WithdrawalRequestResType = z.infer<
  typeof WithdrawalRequestResSchema
>;

// ── List Response ─────────────────────────────────────────────────────────
export const ListWithdrawalsAdminResSchema = z.object({
  data: z.array(WithdrawalRequestResSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
  }),
});

export type ListWithdrawalsAdminResType = z.infer<
  typeof ListWithdrawalsAdminResSchema
>;

// ── Query ─────────────────────────────────────────────────────────────────
export const ListAdminWithdrawalsQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).default(10),
  status: z.enum(WITHDRAWAL_STATUS_VALUES).optional(),
  doctorId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type ListAdminWithdrawalsQueryType = z.infer<
  typeof ListAdminWithdrawalsQuerySchema
>;

// ── Admin Action Bodies ───────────────────────────────────────────────────
export const RejectWithdrawalBodySchema = z.object({
  rejectReason: z
    .string()
    .min(1, "Lý do từ chối là bắt buộc")
    .max(2000, "Tối đa 2000 ký tự"),
});

export type RejectWithdrawalBodyType = z.infer<
  typeof RejectWithdrawalBodySchema
>;

export const MarkPaidBodySchema = z.object({
  transferReference: z
    .string()
    .min(1, "Mã chuyển khoản là bắt buộc")
    .max(255, "Tối đa 255 ký tự"),
  transferProofUrl: z
    .string()
    .max(500, "URL tối đa 500 ký tự")
    .optional()
    .or(z.literal("")),
  adminNote: z.string().max(2000, "Tối đa 2000 ký tự").optional(),
});

export type MarkPaidBodyType = z.infer<typeof MarkPaidBodySchema>;

export const ResolveNotReceivedBodySchema = z.object({
  action: z.enum(["RETRY_PAID", "REFUND"]),
  transferReference: z.string().max(255).optional(),
  transferProofUrl: z.string().max(500).optional().or(z.literal("")),
  adminNote: z.string().max(2000).optional(),
});

export type ResolveNotReceivedBodyType = z.infer<
  typeof ResolveNotReceivedBodySchema
>;

// ── Audit ─────────────────────────────────────────────────────────────────
export const WithdrawalAuditEntrySchema = z.object({
  at: z.string(),
  actor: z.string().nullable(),
  actorRole: z.enum(["DOCTOR", "ADMIN", "SYSTEM"]),
  event: z.string(),
  note: z.string().nullable(),
});

export type WithdrawalAuditEntryType = z.infer<
  typeof WithdrawalAuditEntrySchema
>;

export const WithdrawalAuditResSchema = z.object({
  data: z.array(WithdrawalAuditEntrySchema),
});

export type WithdrawalAuditResType = z.infer<typeof WithdrawalAuditResSchema>;
