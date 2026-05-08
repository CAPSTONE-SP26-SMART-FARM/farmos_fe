import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  CancelSubscriptionBodyType,
  CreateSubscriptionBodyType,
  EntitlementsQueryType,
  ListEntitlementsResType,
  ListSubscriptionsQueryType,
  ListSubscriptionsResType,
  SubscriptionCheckoutResType,
  ListUsageLedgerResType,
  MyQuotaResType,
  SubscriptionResType,
  SubscriptionDetailResType,
  SubscriptionSummaryResType,
  ToggleAutoRenewBodyType,
  UpgradePlanVersionBodyType,
  UsageLedgerQueryType,
} from "@/schemaValidatation/subscription";
import queryString from "query-string";

const SUBSCRIPTIONS = API_ENDPOINTS.SUBSCRIPTIONS;

const subscriptionService = {
  listSubscriptions: (query: ListSubscriptionsQueryType) =>
    api.get<ListSubscriptionsResType>(
      `${SUBSCRIPTIONS.BASE}?${queryString.stringify({ ...query })}`,
    ),

  getMySubscriptionHistory: (query: ListSubscriptionsQueryType) =>
    api.get<ListSubscriptionsResType>(
      `${SUBSCRIPTIONS.MY_HISTORY}?${queryString.stringify({ ...query })}`,
    ),

  getMySubscription: () => api.get<SubscriptionResType>(SUBSCRIPTIONS.MY),

  getMyQuota: () => api.get<MyQuotaResType>(SUBSCRIPTIONS.MY_QUOTA),

  getSubscriptionQuota: (id: string) =>
    api.get<MyQuotaResType>(SUBSCRIPTIONS.QUOTA(id)),

  getSubscriptionsSummary: () =>
    api.get<SubscriptionSummaryResType>(SUBSCRIPTIONS.SUMMARY),

  getSubscriptionDetail: (id: string) =>
    api.get<SubscriptionDetailResType>(SUBSCRIPTIONS.BY_ID(id)),

  createSubscription: (data: CreateSubscriptionBodyType) =>
    api.post<SubscriptionCheckoutResType, CreateSubscriptionBodyType>(
      SUBSCRIPTIONS.BASE,
      data,
    ),

  renewSubscription: (id: string) =>
    api.post<SubscriptionCheckoutResType>(SUBSCRIPTIONS.RENEW(id)),

  cancelSubscription: (id: string, data: CancelSubscriptionBodyType) =>
    api.patch<SubscriptionResType, CancelSubscriptionBodyType>(
      SUBSCRIPTIONS.CANCEL(id),
      data,
    ),

  toggleAutoRenew: (id: string, data: ToggleAutoRenewBodyType) =>
    api.patch<SubscriptionResType, ToggleAutoRenewBodyType>(
      SUBSCRIPTIONS.AUTO_RENEW(id),
      data,
    ),

  forceUpgradePlanVersion: (id: string, data: UpgradePlanVersionBodyType) =>
    api.patch<SubscriptionResType, UpgradePlanVersionBodyType>(
      SUBSCRIPTIONS.PLAN_VERSION(id),
      data,
    ),

  getEntitlements: (id: string, query: EntitlementsQueryType) =>
    api.get<ListEntitlementsResType>(
      `${SUBSCRIPTIONS.ENTITLEMENTS(id)}?${queryString.stringify({ ...query })}`,
    ),

  getUsageLedger: (id: string, query: UsageLedgerQueryType) =>
    api.get<ListUsageLedgerResType>(
      `${SUBSCRIPTIONS.USAGE(id)}?${queryString.stringify({ ...query })}`,
    ),
};

export default subscriptionService;
