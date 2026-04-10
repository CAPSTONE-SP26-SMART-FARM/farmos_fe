import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  CreateProductionMilestoneItemBodyType,
  ListProductionMilestonesQueryType,
  ListProductionMilestonesResType,
  ProductionMilestoneResType,
  UpdateProductionMilestoneBodyType,
} from "@/schemaValidatation/productionMilestone";
import type { MessageResType } from "@/types/api";
import queryString from "query-string";

const MANAGER = API_ENDPOINTS.MANAGER;

export const productionMilestoneService = {
  list: (
    cropSeasonId: string,
    query: ListProductionMilestonesQueryType,
  ) =>
    api.get<ListProductionMilestonesResType>(
      MANAGER.PRODUCTION_MILESTONE.LIST(cropSeasonId) +
        "?" +
        queryString.stringify(
          { ...query },
          { skipEmptyString: true, skipNull: true },
        ),
    ),

  detail: (milestoneId: string, cropSeasonId: string) =>
    api.get<ProductionMilestoneResType>(
      MANAGER.PRODUCTION_MILESTONE.DETAIL(milestoneId, cropSeasonId),
    ),

  createItem: (
    cropSeasonId: string,
    body: CreateProductionMilestoneItemBodyType,
  ) =>
    api.post<ProductionMilestoneResType, CreateProductionMilestoneItemBodyType>(
      MANAGER.PRODUCTION_MILESTONE.CREATE_ITEM(cropSeasonId),
      body,
    ),

  update: (
    milestoneId: string,
    cropSeasonId: string,
    body: UpdateProductionMilestoneBodyType,
  ) =>
    api.put<ProductionMilestoneResType, UpdateProductionMilestoneBodyType>(
      MANAGER.PRODUCTION_MILESTONE.UPDATE(milestoneId, cropSeasonId),
      body,
    ),

  delete: (milestoneId: string, cropSeasonId: string) =>
    api.delete<MessageResType>(
      MANAGER.PRODUCTION_MILESTONE.DELETE(milestoneId, cropSeasonId),
    ),
};
