import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/constants/endpoints";
import queryString from "query-string";
import type {
  AvailableFieldsResType,
  TrackingConfigListResType,
  PutTrackingConfigsBodyType,
  TrackingLogListResType,
  TrackingLogQueryType,
  TrackingDiffResType,
  ProductionRequestSnapshotResType,
  ProductionRequestDiffResType,
  ProductionRequestDiffQueryType,
  FieldHistoryQueryType,
  FieldHistoryResType,
} from "@/schemaValidatation/tracking";

const T = API_ENDPOINTS.TRACKING;

export const trackingService = {
  getAvailableFields: (cropSeasonId: string) =>
    api.get<AvailableFieldsResType>(T.AVAILABLE_FIELDS(cropSeasonId)),

  getConfigs: (cropSeasonId: string) =>
    api.get<TrackingConfigListResType>(T.CONFIGS(cropSeasonId)),

  putConfigs: (cropSeasonId: string, body: PutTrackingConfigsBodyType) =>
    api.put<TrackingConfigListResType, PutTrackingConfigsBodyType>(
      T.CONFIGS(cropSeasonId),
      body,
    ),

  getTrackingLog: (cropSeasonId: string, query: TrackingLogQueryType) =>
    api.get<TrackingLogListResType>(
      `${T.TRACKING_LOG(cropSeasonId)}?${queryString.stringify(query, { skipEmptyString: true, skipNull: true })}`,
    ),

  getDiff: (cropSeasonId: string) =>
    api.get<TrackingDiffResType>(T.DIFF(cropSeasonId)),

  getFieldHistory: (cropSeasonId: string, query: FieldHistoryQueryType) =>
    api.get<FieldHistoryResType>(
      `${T.FIELD_HISTORY(cropSeasonId)}?${queryString.stringify(query, { skipEmptyString: true, skipNull: true })}`,
    ),

  getRequestSnapshot: (cropSeasonId: string, requestId: string) =>
    api.get<ProductionRequestSnapshotResType>(
      T.REQUEST_SNAPSHOT(cropSeasonId, requestId),
    ),

  getRequestDiff: (
    cropSeasonId: string,
    query: ProductionRequestDiffQueryType,
  ) =>
    api.get<ProductionRequestDiffResType>(
      `${T.REQUEST_DIFF(cropSeasonId)}?${queryString.stringify(query, { skipEmptyString: true, skipNull: true })}`,
    ),
};
