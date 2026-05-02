import { QUERY_KEYS } from "@/constants";
import type {
  CreateCommissionRuleBodyType,
  ListCommissionRulesQueryType,
  UpdateCommissionRuleBodyType,
} from "@/schemaValidatation/commissionRule";
import commissionRuleService from "@/services/commissionRuleService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useCommissionRuleList = (
  query: ListCommissionRulesQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.commissionRules.list(query),
    queryFn: () => commissionRuleService.list(query),
    enabled,
  });
};

export const useCommissionRuleDetail = (id: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.commissionRules.detail(id),
    queryFn: () => commissionRuleService.detail(id),
    enabled: enabled && Boolean(id),
  });
};

export const useCreateCommissionRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCommissionRuleBodyType) =>
      commissionRuleService.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.commissionRules.root });
    },
  });
};

export const useUpdateCommissionRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdateCommissionRuleBodyType;
    }) => commissionRuleService.update(id, body),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.commissionRules.root });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.commissionRules.detail(id),
      });
    },
  });
};

export const useSoftDeleteCommissionRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => commissionRuleService.softDelete(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.commissionRules.root });
      qc.removeQueries({ queryKey: QUERY_KEYS.commissionRules.detail(id) });
    },
  });
};
