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
  MilestoneChangesResType,
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

  getTrackingLog: (cropSeasonId: string, query: TrackingLogQueryType) => {
    // BE yêu cầu `from`/`to` là ISO datetime (`z.string().datetime()`),
    // strict mode → 422 nếu gửi `YYYY-MM-DD`. UI dùng <Input type="date">
    // → convert: `from` = đầu ngày UTC, `to` = cuối ngày UTC (inclusive).
    const isYmd = (v?: string) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
    const normalized = {
      ...query,
      from: isYmd(query.from) ? `${query.from}T00:00:00.000Z` : query.from,
      to: isYmd(query.to) ? `${query.to}T23:59:59.999Z` : query.to,
    };
    return api.get<TrackingLogListResType>(
      `${T.TRACKING_LOG(cropSeasonId)}?${queryString.stringify(normalized, { skipEmptyString: true, skipNull: true })}`,
    );
  },

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

  getMilestoneChanges: (cropSeasonId: string, milestoneId: string) =>
    api.get<MilestoneChangesResType>(
      T.MILESTONE_CHANGES(cropSeasonId, milestoneId),
    ),
};
