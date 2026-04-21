import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  CreatePlanBodyType,
  CreatePlanVersionBodyType,
  ListPlansQueryType,
  ListPlansResType,
  ListPlanVersionsQueryType,
  ListPlanVersionsResType,
  PlanResType,
  PlanVersionWithFeaturesResType,
  UpdatePlanBodyType,
} from "@/schemaValidatation/subscriptionPlan";
import queryString from "query-string";

const SUBSCRIPTION_PLAN = API_ENDPOINTS.SUBSCRIPTION_PLANS;

const subscriptionPlanService = {
  listPlans: (query: ListPlansQueryType) =>
    api.get<ListPlansResType>(
      `${SUBSCRIPTION_PLAN.BASE}?${queryString.stringify({ ...query })}`,
    ),

  getPlanDetail: (id: string) =>
    api.get<PlanResType>(SUBSCRIPTION_PLAN.BY_ID(id)),

  createPlan: (data: CreatePlanBodyType) =>
    api.post<PlanResType, CreatePlanBodyType>(SUBSCRIPTION_PLAN.BASE, data),

  updatePlan: (id: string, data: UpdatePlanBodyType) =>
    api.patch<PlanResType, UpdatePlanBodyType>(
      SUBSCRIPTION_PLAN.BY_ID(id),
      data,
    ),

  archivePlan: (id: string) =>
    api.patch<PlanResType>(SUBSCRIPTION_PLAN.ARCHIVE(id)),

  listPlanVersions: (id: string, query: ListPlanVersionsQueryType) =>
    api.get<ListPlanVersionsResType>(
      `${SUBSCRIPTION_PLAN.VERSIONS(id)}?${queryString.stringify({ ...query })}`,
    ),

  createPlanVersion: (id: string, data: CreatePlanVersionBodyType) =>
    api.post<PlanVersionWithFeaturesResType, CreatePlanVersionBodyType>(
      SUBSCRIPTION_PLAN.VERSIONS(id),
      data,
    ),
};

export default subscriptionPlanService;
