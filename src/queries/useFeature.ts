import { QUERY_KEYS } from "@/constants";
import type { ListFeaturesQueryType } from "@/schemaValidatation/feature";
import featureService from "@/services/featureService";
import { useQuery } from "@tanstack/react-query";

export const useListFeatures = (query: ListFeaturesQueryType) => {
  return useQuery({
    queryKey: QUERY_KEYS.features.list(query),
    queryFn: () => featureService.listFeatures(query),
  });
};
