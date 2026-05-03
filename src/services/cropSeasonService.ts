import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/constants/endpoints";
import queryString from "query-string";
import type {
  CropSeasonType,
  ProductionRequestType,
  CreateCropSeasonBodyType,
  UpdateCropSeasonBodyType,
  SendProductionRequestBodyType,
  ReplyProductionRequestBodyType,
  ListCropSeasonsQueryType,
  ListProductionRequestsQueryType,
  ListCropSeasonsResType,
  ListProductionRequestsResType,
} from "@/types/cropSeason";

const toISO = (v: string) => (v ? `${v}T00:00:00.000Z` : v);

const CS = API_ENDPOINTS.CROP_SEASON;

export const cropSeasonService = {
  create: (body: CreateCropSeasonBodyType) =>
    api.post<CropSeasonType, CreateCropSeasonBodyType>(CS.MANAGER.CREATE, {
      ...body,
      plantDate: toISO(body.plantDate),
      expectedHarvestDate: toISO(body.expectedHarvestDate),
    }),

  listByZone: (zoneId: string, query: ListCropSeasonsQueryType) =>
    api.get<ListCropSeasonsResType>(
      `${CS.MANAGER.LIST_BY_ZONE(zoneId)}?${queryString.stringify(query, { skipEmptyString: true, skipNull: true })}`,
    ),

  detail: (id: string) => api.get<CropSeasonType>(CS.MANAGER.DETAIL(id)),

  update: (id: string, body: UpdateCropSeasonBodyType) => {
    const { actualHarvestDate, ...rest } = body;
    return api.put<CropSeasonType, UpdateCropSeasonBodyType>(
      CS.MANAGER.UPDATE(id),
      {
        ...rest,
        ...(rest.plantDate && { plantDate: toISO(rest.plantDate) }),
        ...(rest.expectedHarvestDate && {
          expectedHarvestDate: toISO(rest.expectedHarvestDate),
        }),
        ...(actualHarvestDate && {
          actualHarvestDate: toISO(actualHarvestDate),
        }),
      },
    );
  },

  sendRequest: (cropSeasonId: string, body: SendProductionRequestBodyType) =>
    api.post<ProductionRequestType, SendProductionRequestBodyType>(
      CS.MANAGER.SEND_REQUEST(cropSeasonId),
      body,
    ),

  listRequests: (
    cropSeasonId: string,
    query: ListProductionRequestsQueryType,
  ) =>
    api.get<ListProductionRequestsResType>(
      `${CS.MANAGER.LIST_REQUESTS(cropSeasonId)}?${queryString.stringify(query, { skipEmptyString: true, skipNull: true })}`,
    ),

  requestDetail: (requestId: string) =>
    api.get<ProductionRequestType>(CS.MANAGER.REQUEST_DETAIL(requestId)),

  ownerListByZone: (zoneId: string, query: ListCropSeasonsQueryType) =>
    api.get<ListCropSeasonsResType>(
      `${CS.OWNER.LIST_BY_ZONE(zoneId)}?${queryString.stringify(query, { skipEmptyString: true, skipNull: true })}`,
    ),

  ownerDetail: (id: string) => api.get<CropSeasonType>(CS.OWNER.DETAIL(id)),

  ownerListRequests: (
    cropSeasonId: string,
    query: ListProductionRequestsQueryType,
  ) =>
    api.get<ListProductionRequestsResType>(
      `${CS.OWNER.LIST_REQUESTS(cropSeasonId)}?${queryString.stringify(query, { skipEmptyString: true, skipNull: true })}`,
    ),

  ownerRequestDetail: (requestId: string) =>
    api.get<ProductionRequestType>(CS.OWNER.REQUEST_DETAIL(requestId)),

  replyRequest: (requestId: string, body: ReplyProductionRequestBodyType) =>
    api.put<ProductionRequestType, ReplyProductionRequestBodyType>(
      CS.OWNER.REPLY_REQUEST(requestId),
      body,
    ),
};
