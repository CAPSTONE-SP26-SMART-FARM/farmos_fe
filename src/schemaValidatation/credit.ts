import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";
import { z } from "zod";

export const CreditTransactionTypeEnum = z.enum([
  "PURCHASE",
  "SUBSCRIPTION_GRANT",
  "USAGE",
  "EXPIRED",
  "ADJUSTMENT",
]);

export const OwnerCreditSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  creditType: z.string(),
  balance: z.number().int(),
  updatedAt: z.string(),
});

export const CreditLedgerSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  creditType: z.string(),
  amount: z.number().int(),
  balanceAfter: z.number().int(),
  transactionType: CreditTransactionTypeEnum,
  referenceId: z.string().uuid().nullable(),
  description: z.string().nullable(),
  createdAt: z.string(),
});

export const ServicePackageSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  creditAmount: z.number().int(),
  creditType: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export const CreditHistoryQuerySchema = PagingRequestSchema.extend({
  creditType: z.string().optional(),
}).strict();

export const ListServicePackagesQuerySchema = PagingRequestSchema.extend(
  {},
).strict();

export const CreateServicePackageBodySchema = z
  .object({
    code: z.string().min(1, "Vui lòng nhập mã gói").max(50),
    name: z.string().min(1, "Vui lòng nhập tên gói").max(255),
    description: z.string().optional(),
    price: z.number().min(0, "Giá phải >= 0"),
    creditAmount: z
      .number()
      .int("Số credit phải là số nguyên")
      .positive("Số credit phải > 0"),
    creditType: z.string().min(1, "Vui lòng nhập loại credit"),
  })
  .strict();

export const UpdateServicePackageBodySchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    price: z.number().min(0).optional(),
    creditAmount: z.number().int().positive().optional(),
    creditType: z.string().min(1).optional(),
  })
  .strict();

export const PurchaseCreditResSchema = z.object({
  invoiceId: z.string().uuid(),
  invoiceNumber: z.string(),
  totalAmount: z.number(),
  creditAmount: z.number().int(),
  creditType: z.string(),
  checkoutRequired: z.boolean(),
});

export const ServicePackagePaymentStatusResSchema = z.object({
  packageId: z.string().uuid(),
  latestTransaction: z
    .object({
      id: z.string().uuid(),
      invoiceId: z.string().uuid(),
      ownerId: z.string().uuid(),
      amount: z.number(),
      currency: z.string().nullable(),
      gateway: z.string(),
      gatewayTransactionId: z.string().nullable(),
      type: z.enum(["CHARGE", "REFUND"]),
      status: z.enum(["PENDING", "SUCCESS", "FAILED"]),
      errorMessage: z.string().nullable(),
      gatewayResponse: z.unknown().nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
    .nullable(),
});

export const OwnerCreditsResSchema = z.object({
  data: z.array(OwnerCreditSchema),
});

export const ListCreditHistoryResSchema = PagingResponseSchema(CreditLedgerSchema);
export const ListServicePackagesResSchema = PagingResponseSchema(
  ServicePackageSchema,
);

export type CreditHistoryQueryType = z.infer<typeof CreditHistoryQuerySchema>;
export type ListServicePackagesQueryType = z.infer<
  typeof ListServicePackagesQuerySchema
>;
export type OwnerCreditType = z.infer<typeof OwnerCreditSchema>;
export type CreditLedgerType = z.infer<typeof CreditLedgerSchema>;
export type ServicePackageType = z.infer<typeof ServicePackageSchema>;
export type PurchaseCreditResType = z.infer<typeof PurchaseCreditResSchema>;
export type ServicePackagePaymentStatusResType = z.infer<
  typeof ServicePackagePaymentStatusResSchema
>;
export type OwnerCreditsResType = z.infer<typeof OwnerCreditsResSchema>;
export type ListCreditHistoryResType = z.infer<typeof ListCreditHistoryResSchema>;
export type ListServicePackagesResType = z.infer<
  typeof ListServicePackagesResSchema
>;
export type CreateServicePackageBodyType = z.infer<
  typeof CreateServicePackageBodySchema
>;
export type UpdateServicePackageBodyType = z.infer<
  typeof UpdateServicePackageBodySchema
>;
