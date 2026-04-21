import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  CancelSubscriptionBodyType,
  CreateSubscriptionBodyType,
  EntitlementsQueryType,
  ListEntitlementsResType,
  ListSubscriptionsQueryType,
  ListSubscriptionsResType,
  ListUsageLedgerResType,
  SubscriptionResType,
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

  getMySubscription: () => api.get<SubscriptionResType>(SUBSCRIPTIONS.MY),

  getSubscriptionDetail: (id: string) =>
    api.get<SubscriptionResType>(SUBSCRIPTIONS.BY_ID(id)),

  createSubscription: (data: CreateSubscriptionBodyType) =>
    api.post<SubscriptionResType, CreateSubscriptionBodyType>(
      SUBSCRIPTIONS.BASE,
      data,
    ),

  renewSubscription: (id: string) =>
    api.post<SubscriptionResType>(SUBSCRIPTIONS.RENEW(id)),

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
