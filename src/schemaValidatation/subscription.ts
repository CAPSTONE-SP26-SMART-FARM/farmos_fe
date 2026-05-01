import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";
import { z } from "zod";
import { PlanVersionWithFeaturesResSchema } from "./subscriptionPlan";

export const SubscriptionStatusEnum = z.enum([
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "CANCELLED",
  "EXPIRED",
]);

export const SubscriptionPlanLiteSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
});

export const SubscriptionOwnerLiteSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});

export const SubscriptionSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  planId: z.string().uuid(),
  planVersionId: z.string().uuid(),
  status: SubscriptionStatusEnum,
  autoRenew: z.boolean(),
  startedAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  cancelledAt: z.string().nullable(),
  cancelReason: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  plan: SubscriptionPlanLiteSchema.optional(),
  owner: SubscriptionOwnerLiteSchema.optional(),
});

export const SubscriptionEntitlementSchema = z.object({
  id: z.string().uuid(),
  subscriptionId: z.string().uuid(),
  featureCode: z.string(),
  value: z.string(),
  periodStart: z.string().nullable(),
  periodEnd: z.string().nullable(),
  createdAt: z.string(),
});

export const SubscriptionUsageLedgerSchema = z.object({
  id: z.string().uuid(),
  subscriptionId: z.string().uuid(),
  featureCode: z.string(),
  delta: z.number(),
  contextEntity: z.string().nullable(),
  contextId: z.string().nullable(),
  note: z.string().nullable(),
  createdAt: z.string(),
});

export const InvoiceStatusEnum = z.enum([
  "DRAFT",
  "OPEN",
  "PAID",
  "VOID",
  "UNCOLLECTIBLE",
]);

export const SubscriptionCheckoutResSchema = z.object({
  subscription: SubscriptionSchema,
  invoiceId: z.string().uuid(),
  invoiceNumber: z.string(),
  totalAmount: z.number(),
  invoiceStatus: InvoiceStatusEnum,
  checkoutRequired: z.boolean(),
});

export const SubscriptionDetailResSchema = z.object({
  subscription: SubscriptionSchema,
  currentPlanVersion: PlanVersionWithFeaturesResSchema,
});

export const CreateSubscriptionBodySchema = z
  .object({
    planVersionId: z.string().uuid("PlanVersionId không đúng định dạng UUID"),
  })
  .strict();

export const CancelSubscriptionBodySchema = z
  .object({
    cancelReason: z.string().trim().max(500).optional(),
  })
  .strict();

export const ToggleAutoRenewBodySchema = z
  .object({
    autoRenew: z.boolean(),
  })
  .strict();

export const UpgradePlanVersionBodySchema = z
  .object({
    planVersionId: z.string().uuid("PlanVersionId không đúng định dạng UUID"),
  })
  .strict();

export const ListSubscriptionsQuerySchema = PagingRequestSchema.extend({
  status: SubscriptionStatusEnum.optional(),
  ownerSearch: z.string().optional(),
}).strict();

export const EntitlementsQuerySchema = PagingRequestSchema.extend({}).strict();

export const UsageLedgerQuerySchema = PagingRequestSchema.extend({
  featureCode: z.string().optional(),
}).strict();

export const SubscriptionResSchema = SubscriptionSchema;

export const SubscriptionSummaryResSchema = z.object({
  statusCounts: z.object({
    total: z.number(),
    pending: z.number(),
    active: z.number(),
    suspended: z.number(),
    cancelled: z.number(),
    expired: z.number(),
  }),
  newLast30Days: z.number(),
  expiringNext7Days: z.number(),
  autoRenewEnabled: z.number(),
  topPlans: z.array(
    z.object({
      planId: z.string().uuid(),
      planName: z.string(),
      planCode: z.string(),
      activeCount: z.number(),
    }),
  ),
});

export const ListSubscriptionsResSchema = PagingResponseSchema(
  SubscriptionResSchema,
);

export const ListEntitlementsResSchema = PagingResponseSchema(
  SubscriptionEntitlementSchema,
);

export const ListUsageLedgerResSchema = PagingResponseSchema(
  SubscriptionUsageLedgerSchema,
);

export type SubscriptionStatusType = z.infer<typeof SubscriptionStatusEnum>;
export type InvoiceStatusType = z.infer<typeof InvoiceStatusEnum>;

export type SubscriptionType = z.infer<typeof SubscriptionSchema>;
export type SubscriptionResType = z.infer<typeof SubscriptionResSchema>;
export type SubscriptionEntitlementType = z.infer<
  typeof SubscriptionEntitlementSchema
>;
export type SubscriptionUsageLedgerType = z.infer<
  typeof SubscriptionUsageLedgerSchema
>;

export type CreateSubscriptionBodyType = z.infer<
  typeof CreateSubscriptionBodySchema
>;
export type SubscriptionCheckoutResType = z.infer<
  typeof SubscriptionCheckoutResSchema
>;
export type SubscriptionDetailResType = z.infer<
  typeof SubscriptionDetailResSchema
>;
export type CancelSubscriptionBodyType = z.infer<
  typeof CancelSubscriptionBodySchema
>;
export type ToggleAutoRenewBodyType = z.infer<typeof ToggleAutoRenewBodySchema>;
export type UpgradePlanVersionBodyType = z.infer<
  typeof UpgradePlanVersionBodySchema
>;

export type ListSubscriptionsQueryType = z.infer<
  typeof ListSubscriptionsQuerySchema
>;
export type EntitlementsQueryType = z.infer<typeof EntitlementsQuerySchema>;
export type UsageLedgerQueryType = z.infer<typeof UsageLedgerQuerySchema>;

export type ListSubscriptionsResType = z.infer<
  typeof ListSubscriptionsResSchema
>;
export type SubscriptionSummaryResType = z.infer<
  typeof SubscriptionSummaryResSchema
>;
export type ListEntitlementsResType = z.infer<typeof ListEntitlementsResSchema>;
export type ListUsageLedgerResType = z.infer<typeof ListUsageLedgerResSchema>;
