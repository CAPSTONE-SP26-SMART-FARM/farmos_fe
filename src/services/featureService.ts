import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  CreateFeatureBodyType,
  FeatureMenuResType,
  ListFeaturesQueryType,
  ListFeaturesResType,
  UpdateFeatureBodyType,
} from "@/schemaValidatation/feature";
import queryString from "query-string";

const FEATURE = API_ENDPOINTS.ADMIN.FEATURES;

const featureService = {
  listFeatures: (query: ListFeaturesQueryType) =>
    api.get<ListFeaturesResType>(
      `${FEATURE.LIST}?${queryString.stringify({ ...query })}`,
    ),
  createFeature: (body: CreateFeatureBodyType) =>
    api.post<FeatureMenuResType, CreateFeatureBodyType>(FEATURE.CREATE, body),
  getFeatureByCode: (featureCode: string) =>
    api.get<FeatureMenuResType>(FEATURE.DETAIL(featureCode)),
  updateFeature: (featureCode: string, body: UpdateFeatureBodyType) =>
    api.patch<FeatureMenuResType, UpdateFeatureBodyType>(
      FEATURE.UPDATE(featureCode),
      body,
    ),
  deleteFeature: (featureCode: string) =>
    api.delete<FeatureMenuResType>(FEATURE.DELETE(featureCode)),
};

export default featureService;
