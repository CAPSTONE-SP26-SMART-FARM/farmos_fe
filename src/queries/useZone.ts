import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/endpoints";
import { zoneService } from "@/services/zoneService";
import type {
  CreateZoneBodyType,
  ListZonesQueryType,
  UpdateZoneBodyType,
} from "@/types/zone";

export const useOwnerListZones = (farmId: string, query: ListZonesQueryType) =>
  useQuery({
    queryKey: QUERY_KEYS.zones.listByFarm(
      farmId,
      query as Record<string, unknown>,
    ),
    queryFn: () => zoneService.listByFarm(farmId, query),
    enabled: !!farmId,
  });

export const useOwnerGetZoneDetail = (id: string) =>
  useQuery({
    queryKey: QUERY_KEYS.zones.detail(id),
    queryFn: () => zoneService.getDetail(id),
    enabled: !!id,
  });

export const useOwnerCreateZone = (farmId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateZoneBodyType) => zoneService.create(body),
    onSuccess: () => {
      // Prefix-match invalidates all page/filter variants for this farm
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.zones.byFarm(farmId),
      });
    },
  });
};

export const useOwnerUpdateZone = (id: string, farmId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateZoneBodyType) => zoneService.update(id, body),
    onSuccess: () => {
      // Invalidate all list variants for this farm
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.zones.byFarm(farmId),
      });
      // Invalidate the specific zone detail
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.zones.detail(id),
      });
    },
  });
};
