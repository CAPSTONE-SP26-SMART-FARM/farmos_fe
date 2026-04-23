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
  })
  .strict();

export const ListInvoicesQuerySchema = PagingRequestSchema.extend({
  status: InvoiceStatusEnum.optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().uuid().optional(),
}).strict();

export const InvoiceDetailResSchema = InvoiceSchema.extend({
  items: z.array(InvoiceItemSchema),
  transactions: z.array(TransactionSchema),
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

export type InvoiceType = z.infer<typeof InvoiceSchema>;
export type TransactionType = z.infer<typeof TransactionSchema>;
export type InvoiceDetailResType = z.infer<typeof InvoiceDetailResSchema>;
export type CheckoutBodyType = z.infer<typeof CheckoutBodySchema>;
export type CheckoutResType = z.infer<typeof CheckoutResSchema>;
export type PaymentStatusResType = z.infer<typeof PaymentStatusResSchema>;
export type ListInvoicesQueryType = z.infer<typeof ListInvoicesQuerySchema>;
export type ListInvoicesResType = z.infer<typeof ListInvoicesResSchema>;
