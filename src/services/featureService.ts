import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  ListFeaturesQueryType,
  ListFeaturesResType,
} from "@/schemaValidatation/feature";
import queryString from "query-string";

const FEATURE = API_ENDPOINTS.FEATURES;

const featureService = {
  listFeatures: (query: ListFeaturesQueryType) =>
    api.get<ListFeaturesResType>(
      `${FEATURE.BASE}?${queryString.stringify({ ...query })}`,
    ),
};

export default featureService;
