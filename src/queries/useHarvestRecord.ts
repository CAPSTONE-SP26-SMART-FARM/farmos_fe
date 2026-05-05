import { QUERY_KEYS } from "@/constants";
import type {
  CreateHarvestRecordBodyType,
  ListHarvestRecordsQueryType,
  UpdateHarvestRecordBodyType,
} from "@/schemaValidatation/harvestRecord";
import harvestRecordService from "@/services/harvestRecordService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ── List by zone ──────────────────────────────────────────────────────────
export const useHarvestRecordsByZone = (
  zoneId: string,
  query: ListHarvestRecordsQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.harvestRecords.listByZone(zoneId, query),
    queryFn: () => harvestRecordService.listByZone(zoneId, query),
    enabled: enabled && Boolean(zoneId),
  });
};

// ── Detail ────────────────────────────────────────────────────────────────
export const useHarvestRecordDetail = (id: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.harvestRecords.detail(id),
    queryFn: () => harvestRecordService.detail(id),
    enabled: enabled && Boolean(id),
  });
};

// ── Mutations ─────────────────────────────────────────────────────────────
// onError không tự toast — page tự handle để phân biệt 422 vs lỗi khác
// (theo docs/form-error-and-date-handling.md §3 bước 1).

export const useCreateHarvestRecord = (zoneId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateHarvestRecordBodyType) =>
      harvestRecordService.create(zoneId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.harvestRecords.root });
    },
  });
};

export const useUpdateHarvestRecord = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdateHarvestRecordBodyType;
    }) => harvestRecordService.update(id, body),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.harvestRecords.root });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.harvestRecords.detail(id),
      });
    },
  });
};

export const useDeleteHarvestRecord = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => harvestRecordService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.harvestRecords.root });
    },
  });
};
