import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { onMutationError } from "@/lib/axios";
import { QUERY_KEYS } from "@/constants/endpoints";
import { trackingService } from "@/services/trackingService";
import type {
  PutTrackingConfigsBodyType,
  TrackingLogQueryType,
  FieldHistoryQueryType,
  ProductionRequestDiffQueryType,
} from "@/schemaValidatation/tracking";

export const useTrackingAvailableFields = (cropSeasonId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.tracking.availableFields(cropSeasonId),
    queryFn: () => trackingService.getAvailableFields(cropSeasonId),
    enabled: !!cropSeasonId,
  });

export const useTrackingConfigs = (cropSeasonId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.tracking.configs(cropSeasonId),
    queryFn: () => trackingService.getConfigs(cropSeasonId),
    enabled: !!cropSeasonId,
  });

export const usePutTrackingConfigs = (cropSeasonId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PutTrackingConfigsBodyType) =>
      trackingService.putConfigs(cropSeasonId, body),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: QUERY_KEYS.tracking.configs(cropSeasonId),
      });
      toast.success("Cấu hình theo dõi đã được lưu!");
    },
    onError: (error: unknown) => onMutationError(error),
  });
};

export const useTrackingLog = (
  cropSeasonId: string,
  query: TrackingLogQueryType,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.tracking.log(cropSeasonId, query),
    queryFn: () => trackingService.getTrackingLog(cropSeasonId, query),
    enabled: !!cropSeasonId && enabled,
  });

export const useTrackingDiff = (cropSeasonId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.tracking.diff(cropSeasonId),
    queryFn: () => trackingService.getDiff(cropSeasonId),
    enabled: !!cropSeasonId,
  });

export const useFieldHistory = (
  cropSeasonId: string,
  query: FieldHistoryQueryType,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.tracking.fieldHistory(cropSeasonId, query),
    queryFn: () => trackingService.getFieldHistory(cropSeasonId, query),
    enabled: !!cropSeasonId && enabled,
  });

export const useTrackingFieldHistory = useFieldHistory;

export const useRequestSnapshot = (
  cropSeasonId: string,
  requestId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.tracking.requestSnapshot(cropSeasonId, requestId),
    queryFn: () => trackingService.getRequestSnapshot(cropSeasonId, requestId),
    enabled: !!cropSeasonId && !!requestId && enabled,
  });

export const useMilestoneChanges = (
  cropSeasonId: string,
  milestoneId: string | null,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.tracking.milestoneChanges(
      cropSeasonId,
      milestoneId ?? "",
    ),
    queryFn: () =>
      trackingService.getMilestoneChanges(cropSeasonId, milestoneId!),
    enabled: !!cropSeasonId && !!milestoneId && enabled,
  });

export const useRequestDiff = (
  cropSeasonId: string,
  query: ProductionRequestDiffQueryType,
  enabled = true,
) =>
  useQuery({
    queryKey: ["tracking", cropSeasonId, "request-diff", query.from, query.to],
    queryFn: () => trackingService.getRequestDiff(cropSeasonId, query),
    enabled: !!cropSeasonId && !!query.from && !!query.to && enabled,
  });
