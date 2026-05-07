import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";
import { z } from "zod";

export const InvoiceStatusEnum = z.enum([
  "DRAFT",
  "OPEN",
  "PAID",
  "VOID",
  "UNCOLLECTIBLE",
]);

export const TransactionTypeEnum = z.enum(["CHARGE", "REFUND"]);
export const TransactionStatusEnum = z.enum(["PENDING", "SUCCESS", "FAILED"]);

export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  referenceType: z.string(),
  referenceId: z.string().uuid(),
  invoiceNumber: z.string(),
  status: InvoiceStatusEnum,
  currency: z.string().nullable(),
  subtotal: z.number(),
  taxAmount: z.number(),
  totalAmount: z.number(),
  issueDate: z.string().nullable(),
  dueDate: z.string().nullable(),
  paidAt: z.string().nullable(),
  metadata: z.unknown().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const InvoiceItemSchema = z.object({
  id: z.string().uuid(),
  invoiceId: z.string().uuid(),
  refItemType: z.string().nullable(),
  description: z.string(),
  quantity: z.number().int().nullable(),
  unitPrice: z.number(),
  amount: z.number(),
  metadata: z.unknown().nullable(),
});

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  invoiceId: z.string().uuid(),
  ownerId: z.string().uuid(),
  amount: z.number(),
  currency: z.string().nullable(),
  gateway: z.string(),
  gatewayTransactionId: z.string().nullable(),
  type: TransactionTypeEnum,
  status: TransactionStatusEnum,
  errorMessage: z.string().nullable(),
  gatewayResponse: z.unknown().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CheckoutBodySchema = z
  .object({
    gateway: z.literal("PAYOS").default("PAYOS"),
    returnUrl: z.string().max(2048).optional(),
  })
  .strict();

export const ListInvoicesQuerySchema = PagingRequestSchema.extend({
  status: InvoiceStatusEnum.optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().uuid().optional(),
}).strict();

export const InvoicePaymentSummarySchema = z.object({
  totalPaid: z.number(),
  refundedAmount: z.number(),
  pendingAmount: z.number(),
  outstandingAmount: z.number(),
  latestSuccessfulPaymentAt: z.string().nullable(),
  transactionCount: z.number().int().nonnegative(),
});

export const CheckoutResSchema = z.object({
  transactionId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  invoiceNumber: z.string(),
  totalAmount: z.number(),
  expiredAt: z.string(),
  orderCode: z.number().int(),
  paymentUrl: z.string().url(),
});

export const PaymentStatusResSchema = z.object({
  subscriptionId: z.string().uuid(),
  subscriptionStatus: z.string(),
  latestTransaction: TransactionSchema.nullable(),
});

export const ListInvoicesResSchema = PagingResponseSchema(InvoiceSchema);

// ============================================================
// Admin list — enriched invoice rows (mirrors backend ListInvoicesAdminResSchema)
// ============================================================

export const InvoiceReferenceTypeEnum = z.enum([
  "SUBSCRIPTION",
  "SERVICE_PACKAGE",
  "IOT_KIT_ORDER",
]);

export const InvoiceOwnerSummarySchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
});

export const InvoiceReferenceSummarySchema = z.object({
  type: InvoiceReferenceTypeEnum,
  id: z.string().uuid(),
  label: z.string(),
  summary: z.unknown().nullable(),
});

export const InvoiceLatestTransactionSummarySchema = z.object({
  id: z.string().uuid(),
  status: TransactionStatusEnum,
  gateway: z.string(),
  amount: z.number(),
  createdAt: z.string(),
});

export const InvoiceAdminListItemSchema = InvoiceSchema.extend({
  owner: InvoiceOwnerSummarySchema,
  reference: InvoiceReferenceSummarySchema.nullable(),
  latestTransaction: InvoiceLatestTransactionSummarySchema.nullable(),
  itemCount: z.number().int().nonnegative(),
});

export const ListInvoicesAdminResSchema = PagingResponseSchema(
  InvoiceAdminListItemSchema,
);

// ============================================================
// Invoice detail — enriched with owner, reference, payment summary
// (shared by both owner and admin invoice detail endpoints)
// ============================================================

export const InvoiceDetailResSchema = InvoiceSchema.extend({
  items: z.array(InvoiceItemSchema),
  transactions: z.array(TransactionSchema),
  referenceData: z.unknown().nullable(),
  owner: InvoiceOwnerSummarySchema,
  reference: InvoiceReferenceSummarySchema.nullable(),
  paymentSummary: InvoicePaymentSummarySchema,
});

export type InvoiceType = z.infer<typeof InvoiceSchema>;
export type InvoiceStatusType = z.infer<typeof InvoiceStatusEnum>;
export type TransactionType = z.infer<typeof TransactionSchema>;
export type InvoiceDetailResType = z.infer<typeof InvoiceDetailResSchema>;
export type CheckoutBodyType = z.infer<typeof CheckoutBodySchema>;
export type CheckoutResType = z.infer<typeof CheckoutResSchema>;
export type PaymentStatusResType = z.infer<typeof PaymentStatusResSchema>;
export type ListInvoicesQueryType = z.infer<typeof ListInvoicesQuerySchema>;
export type ListInvoicesResType = z.infer<typeof ListInvoicesResSchema>;
export type InvoiceReferenceType = z.infer<typeof InvoiceReferenceTypeEnum>;
export type InvoiceOwnerSummaryType = z.infer<typeof InvoiceOwnerSummarySchema>;
export type InvoiceReferenceSummaryType = z.infer<
  typeof InvoiceReferenceSummarySchema
>;
export type InvoiceLatestTransactionSummaryType = z.infer<
  typeof InvoiceLatestTransactionSummarySchema
>;
export type InvoiceAdminListItemType = z.infer<
  typeof InvoiceAdminListItemSchema
>;
export type ListInvoicesAdminResType = z.infer<
  typeof ListInvoicesAdminResSchema
>;
export type InvoicePaymentSummaryType = z.infer<
  typeof InvoicePaymentSummarySchema
>;
