import { QUERY_KEYS } from "@/constants";
import type {
  CreatePlanBodyType,
  CreatePlanVersionBodyType,
  ListPlansQueryType,
  ListPlanVersionsQueryType,
  PlanVersionWithFeaturesResType,
  UpdatePlanBodyType,
} from "@/schemaValidatation/subscriptionPlan";
import subscriptionPlanService from "@/services/subscriptionPlanService";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useListSubscriptionPlans = (query: ListPlansQueryType) => {
  return useQuery({
    queryKey: QUERY_KEYS.subscriptionPlans.list(query),
    queryFn: () => subscriptionPlanService.listPlans(query),
  });
};

export const useSubscriptionPlanDetail = (id: string, enabled: boolean) => {
  return useQuery({
    queryKey: QUERY_KEYS.subscriptionPlans.detail(id),
    queryFn: () => subscriptionPlanService.getPlanDetail(id),
    enabled,
  });
};

export const useListSubscriptionPlanVersions = (
  planId: string,
  query: ListPlanVersionsQueryType,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.subscriptionPlans.versions(planId, query),
    queryFn: () => subscriptionPlanService.listPlanVersions(planId, query),
    enabled,
    placeholderData: keepPreviousData,
  });
};

export const useAdminCreateSubscriptionPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePlanBodyType) =>
      subscriptionPlanService.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptionPlans.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptions.summary(),
      });
    },
  });
};

export const useAdminUpdateSubscriptionPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlanBodyType }) =>
      subscriptionPlanService.updatePlan(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptionPlans.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptionPlans.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptions.summary(),
      });
    },
  });
};

export const useAdminArchiveSubscriptionPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => subscriptionPlanService.archivePlan(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptionPlans.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptionPlans.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptions.summary(),
      });
    },
  });
};

export const useAdminCreateSubscriptionPlanVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      data,
    }: {
      planId: string;
      data: CreatePlanVersionBodyType;
    }) => subscriptionPlanService.createPlanVersion(planId, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptionPlans.versions(variables.planId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptionPlans.detail(variables.planId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.subscriptions.summary(),
      });
    },
  });
};

export const useResolveActivePlanVersion = () => {
  return useMutation({
    mutationFn: async (
      planId: string,
    ): Promise<PlanVersionWithFeaturesResType> => {
      const response = await subscriptionPlanService.listPlanVersions(planId, {
        page: 1,
        limit: 100,
        search: undefined,
      });

      const activeVersion = response.data.data.find(
        (version) => version.isActive,
      );

      if (!activeVersion) {
        throw new Error("Error.PlanHasNoActiveVersion");
      }

      return activeVersion;
    },
  });
};
