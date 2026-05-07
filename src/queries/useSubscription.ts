import { QUERY_KEYS } from "@/constants";
import type {
  CancelSubscriptionBodyType,
  CreateSubscriptionBodyType,
  EntitlementsQueryType,
  ListSubscriptionsQueryType,
  SubscriptionResType,
  ToggleAutoRenewBodyType,
  UpgradePlanVersionBodyType,
  UsageLedgerQueryType,
} from "@/schemaValidatation/subscription";
import subscriptionService from "@/services/subscriptionService";
import { isApiErrorResponse } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useAdminListSubscriptions = (
  query: ListSubscriptionsQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.subscriptions.list(query),
    queryFn: () => subscriptionService.listSubscriptions(query),
    enabled,
  });
};

export const useAdminSubscriptionsSummary = (enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.subscriptions.summary(),
    queryFn: () => subscriptionService.getSubscriptionsSummary(),
    enabled,
  });
};

export const useOwnerMyQuota = (enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.subscriptions.myQuota(),
    queryFn: () => subscriptionService.getMyQuota(),
    enabled,
  });
};

export const useOwnerMySubscription = (enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.subscriptions.my(),
    queryFn: async () => {
      try {
        return await subscriptionService.getMySubscription();
      } catch (error) {
        if (isApiErrorResponse(error) && error.response?.status === 404) {
          return {
            data: null,
          } as { data: SubscriptionResType | null };
        }
        throw error;
      }
    },
    enabled,
  });
};

export const useOwnerSubscriptionHistory = (
  query: ListSubscriptionsQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.subscriptions.myHistory(query),
    queryFn: () => subscriptionService.getMySubscriptionHistory(query),
    enabled,
  });
};

export const useSubscriptionDetail = (id: string, enabled: boolean) => {
  return useQuery({
    queryKey: QUERY_KEYS.subscriptions.detail(id),
    queryFn: () => subscriptionService.getSubscriptionDetail(id),
    enabled,
  });
};

export const useSubscriptionEntitlements = (
  id: string,
  query: EntitlementsQueryType,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.subscriptions.entitlements(id, query),
    queryFn: () => subscriptionService.getEntitlements(id, query),
    enabled,
  });
};

export const useSubscriptionUsageLedger = (
  id: string,
  query: UsageLedgerQueryType,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.subscriptions.usage(id, query),
    queryFn: () => subscriptionService.getUsageLedger(id, query),
    enabled,
  });
};

export const useOwnerCreateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSubscriptionBodyType) =>
      subscriptionService.createSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptions.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptions.my(),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.invoices.all,
      });
    },
  });
};

export const useOwnerRenewSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => subscriptionService.renewSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptions.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptions.my(),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.invoices.all,
      });
    },
  });
};

export const useOwnerUpgradeSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpgradePlanVersionBodyType) =>
      subscriptionService.upgradeSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptions.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptions.my(),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.invoices.all,
      });
    },
  });
};

export const useSubscriptionCancel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: CancelSubscriptionBodyType;
    }) => subscriptionService.cancelSubscription(id, data),
    onSuccess: async (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptions.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptions.my(),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptions.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptions.entitlements(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptions.usage(variables.id),
      });

      await queryClient.refetchQueries({
        queryKey: QUERY_KEYS.subscriptions.my(),
        type: "all",
      });
    },
  });
};

export const useOwnerToggleAutoRenew = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ToggleAutoRenewBodyType }) =>
      subscriptionService.toggleAutoRenew(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptions.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptions.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptions.my(),
      });
    },
  });
};

export const useAdminForceUpgradePlanVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpgradePlanVersionBodyType;
    }) => subscriptionService.forceUpgradePlanVersion(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptions.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptions.detail(variables.id),
      });
    },
  });
};
