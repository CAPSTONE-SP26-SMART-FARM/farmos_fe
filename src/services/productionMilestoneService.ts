import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  CreateProductionMilestoneBatchBodyType,
  CreateProductionMilestoneItemBodyType,
  IotConfigResType,
  IotConfigPutBodyType,
  ListProductionMilestonesQueryType,
  ListProductionMilestonesResType,
  ProductionMilestoneResType,
  UpdateProductionMilestoneBodyType,
} from "@/schemaValidatation/productionMilestone";
import type { MessageResType } from "@/types/api";
import queryString from "query-string";

const MANAGER = API_ENDPOINTS.MANAGER;
const OWNER = API_ENDPOINTS.OWNER;

const toISOOrNull = (v: string | null | undefined): string | null =>
  v ? `${v}T00:00:00Z` : null;

const convertMilestoneDates = <
  T extends {
    expectedStartDate?: string | null;
    actualStartDate?: string | null;
    expectedEndDate?: string | null;
    actualEndDate?: string | null;
  },
>(
  body: T,
): T => ({
  ...body,
  ...(body.expectedStartDate !== undefined && {
    expectedStartDate: toISOOrNull(body.expectedStartDate),
  }),
  ...(body.actualStartDate !== undefined && {
    actualStartDate: toISOOrNull(body.actualStartDate),
  }),
  ...(body.expectedEndDate !== undefined && {
    expectedEndDate: toISOOrNull(body.expectedEndDate),
  }),
  ...(body.actualEndDate !== undefined && {
    actualEndDate: toISOOrNull(body.actualEndDate),
  }),
});

export const productionMilestoneService = {
  listAll: (query: ListProductionMilestonesQueryType) =>
    api.get<ListProductionMilestonesResType>(
      MANAGER.PRODUCTION_MILESTONE.LIST_ALL +
        "?" +
        queryString.stringify(
          { ...query },
          { skipEmptyString: true, skipNull: true },
        ),
    ),

  ownerListAll: (query: ListProductionMilestonesQueryType) =>
    api.get<ListProductionMilestonesResType>(
      OWNER.PRODUCTION_MILESTONE.LIST_ALL +
        "?" +
        queryString.stringify(
          { ...query },
          { skipEmptyString: true, skipNull: true },
        ),
    ),

  list: (cropSeasonId: string, query: ListProductionMilestonesQueryType) =>
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
      convertMilestoneDates(body),
    ),

  createBatch: (
    cropSeasonId: string,
    body: CreateProductionMilestoneBatchBodyType,
  ) =>
    api.post<
      ProductionMilestoneResType[],
      CreateProductionMilestoneBatchBodyType
    >(MANAGER.PRODUCTION_MILESTONE.CREATE_BATCH(cropSeasonId), {
      items: body.items.map(convertMilestoneDates),
    }),

  update: (
    milestoneId: string,
    cropSeasonId: string,
    body: UpdateProductionMilestoneBodyType,
  ) =>
    api.put<ProductionMilestoneResType, UpdateProductionMilestoneBodyType>(
      MANAGER.PRODUCTION_MILESTONE.UPDATE(milestoneId, cropSeasonId),
      convertMilestoneDates(body),
    ),

  delete: (milestoneId: string, cropSeasonId: string) =>
    api.delete<MessageResType>(
      MANAGER.PRODUCTION_MILESTONE.DELETE(milestoneId, cropSeasonId),
    ),

  ownerListByCropSeason: (
    cropSeasonId: string,
    query: ListProductionMilestonesQueryType,
  ) =>
    api.get<ListProductionMilestonesResType>(
      OWNER.PRODUCTION_MILESTONE.LIST(cropSeasonId) +
        "?" +
        queryString.stringify(
          { ...query },
          { skipEmptyString: true, skipNull: true },
        ),
    ),

  ownerDetail: (milestoneId: string, cropSeasonId: string) =>
    api.get<ProductionMilestoneResType>(
      OWNER.PRODUCTION_MILESTONE.DETAIL(milestoneId, cropSeasonId),
    ),

  // ── iotConfig (manager) ────────────────────────────────────────────────────
  getIotConfig: (cropSeasonId: string, milestoneId: string) =>
    api.get<IotConfigResType>(
      MANAGER.PRODUCTION_MILESTONE.IOT_CONFIG(cropSeasonId, milestoneId),
    ),

  updateIotConfig: (
    cropSeasonId: string,
    milestoneId: string,
    body: IotConfigPutBodyType,
  ) =>
    api.put<IotConfigResType, IotConfigPutBodyType>(
      MANAGER.PRODUCTION_MILESTONE.IOT_CONFIG(cropSeasonId, milestoneId),
      body,
    ),

  // ── iotConfig (owner) ──────────────────────────────────────────────────────
  ownerGetIotConfig: (cropSeasonId: string, milestoneId: string) =>
    api.get<IotConfigResType>(
      OWNER.PRODUCTION_MILESTONE.IOT_CONFIG(cropSeasonId, milestoneId),
    ),

  ownerUpdateIotConfig: (
    cropSeasonId: string,
    milestoneId: string,
    body: IotConfigPutBodyType,
  ) =>
    api.put<IotConfigResType, IotConfigPutBodyType>(
      OWNER.PRODUCTION_MILESTONE.IOT_CONFIG(cropSeasonId, milestoneId),
      body,
    ),
};
