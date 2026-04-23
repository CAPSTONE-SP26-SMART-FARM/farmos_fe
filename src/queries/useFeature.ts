import { QUERY_KEYS } from "@/constants";
import type {
  CreateFeatureBodyType,
  ListFeaturesQueryType,
  UpdateFeatureBodyType,
} from "@/schemaValidatation/feature";
import featureService from "@/services/featureService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useListFeatures = (query: ListFeaturesQueryType) => {
  return useQuery({
    queryKey: QUERY_KEYS.admin.features.list(query),
    queryFn: () => featureService.listFeatures(query),
  });
};

export const useFeatureDetail = (featureCode: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.admin.features.detail(featureCode),
    queryFn: () => featureService.getFeatureByCode(featureCode),
    enabled: enabled && Boolean(featureCode),
  });
};

export const useCreateFeature = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateFeatureBodyType) => featureService.createFeature(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.admin.features.list() });
    },
  });
};

export const useUpdateFeature = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      featureCode,
      body,
    }: {
      featureCode: string;
      body: UpdateFeatureBodyType;
    }) => featureService.updateFeature(featureCode, body),
    onSuccess: (_res, { featureCode }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.admin.features.list() });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.admin.features.detail(featureCode),
      });
    },
  });
};

export const useDeleteFeature = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (featureCode: string) => featureService.deleteFeature(featureCode),
    onSuccess: (_res, featureCode) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.admin.features.list() });
      qc.removeQueries({
        queryKey: QUERY_KEYS.admin.features.detail(featureCode),
      });
    },
  });
};
