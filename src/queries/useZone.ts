import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/endpoints";
import { zoneService } from "@/services/zoneService";
import type {
  CreateZoneBodyType,
  ListZonesQueryType,
  UpdateZoneBodyType,
} from "@/types/zone";
import type {
  AssignBulkManagerBodyType,
  AssignManagerBodyType,
  ListAvailableManagersQueryType,
  ListZoneManagersQueryType,
} from "@/schemaValidatation/zoneMember";

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

export const useManagerListAssignedZones = (query: ListZonesQueryType) =>
  useQuery({
    queryKey: QUERY_KEYS.manager.zones.list(query as Record<string, unknown>),
    queryFn: () => zoneService.listAssignedForManager(query),
  });

export const useOwnerListAssignedZones = (query: ListZonesQueryType) =>
  useQuery({
    queryKey: QUERY_KEYS.owner.zones.list(query as Record<string, unknown>),
    queryFn: () => zoneService.listForOwner(query),
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

// ── Zone Member Management Hooks ────────────────────────────

export const useOwnerListZoneManagers = (
  zoneId: string,
  query: ListZoneManagersQueryType,
) =>
  useQuery({
    queryKey: QUERY_KEYS.zones.managers.list(
      zoneId,
      query as Record<string, unknown>,
    ),
    queryFn: () => zoneService.listManagers(zoneId, query),
    enabled: !!zoneId,
  });

export const useOwnerListAvailableManagers = (
  zoneId: string,
  query: ListAvailableManagersQueryType,
) =>
  useQuery({
    queryKey: QUERY_KEYS.zones.managers.availableList(
      zoneId,
      query as Record<string, unknown>,
    ),
    queryFn: () => zoneService.listAvailableManagers(zoneId, query),
    enabled: !!zoneId,
  });

export const useOwnerAssignManager = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AssignManagerBodyType) =>
      zoneService.assignManager(zoneId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.zones.managers.byZone(zoneId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.zones.managers.availableByZone(zoneId),
      });
    },
  });
};

export const useOwnerAssignBulkManagers = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AssignBulkManagerBodyType) =>
      zoneService.assignBulkManagers(zoneId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.zones.managers.byZone(zoneId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.zones.managers.availableByZone(zoneId),
      });
    },
  });
};

export const useOwnerRemoveZoneManager = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (managerId: string) =>
      zoneService.removeManager(zoneId, managerId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.zones.managers.byZone(zoneId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.zones.managers.availableByZone(zoneId),
      });
    },
  });
};

