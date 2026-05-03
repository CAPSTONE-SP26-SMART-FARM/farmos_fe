import { QUERY_KEYS } from "@/constants";
import type {
  CreateMedicineBodyType,
  ListMedicinesQueryType,
  MedicineCatalogQueryType,
  ToggleMedicineBodyType,
  UpdateMedicineBodyType,
} from "@/schemaValidatation/medicine";
import medicineService from "@/services/medicineService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ── Admin CRUD (B11) ──────────────────────────────────────────────────────

export const useAdminMedicineList = (
  query: ListMedicinesQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.medicines.adminList(query),
    queryFn: () => medicineService.adminList(query),
    enabled,
  });
};

export const useAdminMedicineDetail = (id: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.medicines.adminDetail(id),
    queryFn: () => medicineService.adminDetail(id),
    enabled: enabled && Boolean(id),
  });
};

export const useCreateMedicine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateMedicineBodyType) =>
      medicineService.adminCreate(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.medicines.root });
    },
  });
};

export const useUpdateMedicine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdateMedicineBodyType;
    }) => medicineService.adminUpdate(id, body),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.medicines.root });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.medicines.adminDetail(id),
      });
    },
  });
};

export const useToggleMedicine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: ToggleMedicineBodyType;
    }) => medicineService.adminToggle(id, body),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.medicines.root });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.medicines.adminDetail(id),
      });
    },
  });
};

// ── Free-text aggregate (B13) ────────────────────────────────────────────
// BE không có pagination/sort — luôn trả full flat list.

export const useMedicineFreetextStats = (enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.medicines.freetextStats(),
    queryFn: () => medicineService.adminFreetextStats(),
    enabled,
  });
};

// ── Catalog cho picker (B10) ──────────────────────────────────────────────
// BE catalog KHÔNG có pagination/isActive filter — chỉ q + species.
// Picker hiển thị tối đa N items client-side; cần search-as-you-type qua `q`.

export const useMedicineCatalog = (
  query: MedicineCatalogQueryType = {},
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.medicines.catalog(query),
    queryFn: () => medicineService.catalog(query),
    enabled,
  });
};
