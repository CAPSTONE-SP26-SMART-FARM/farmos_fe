import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  CreateMedicineBodyType,
  FreetextMedicineStatListResType,
  ListMedicinesQueryType,
  MedicineCatalogQueryType,
  MedicineCatalogResType,
  MedicineListResType,
  MedicineResType,
  ToggleMedicineBodyType,
  UpdateMedicineBodyType,
} from "@/schemaValidatation/medicine";
import queryString from "query-string";

const M = API_ENDPOINTS.MEDICINES;

const medicineService = {
  // ── Admin CRUD (B11) ──
  // Note: BE query field là `q` (không phải `search`). BE schema `.strict()`
  // → field thừa = 422 UNRECOGNIZED.
  adminList: (query: ListMedicinesQueryType) =>
    api.get<MedicineListResType>(
      `${M.ADMIN_LIST}?${queryString.stringify(
        { ...query },
        { skipNull: true, skipEmptyString: true },
      )}`,
    ),

  adminDetail: (id: string) => api.get<MedicineResType>(M.ADMIN_DETAIL(id)),

  adminCreate: (body: CreateMedicineBodyType) =>
    api.post<MedicineResType, CreateMedicineBodyType>(M.ADMIN_CREATE, body),

  adminUpdate: (id: string, body: UpdateMedicineBodyType) =>
    api.patch<MedicineResType, UpdateMedicineBodyType>(
      M.ADMIN_UPDATE(id),
      body,
    ),

  // ── Toggle isActive (B12) ──
  adminToggle: (id: string, body: ToggleMedicineBodyType) =>
    api.patch<MedicineResType, ToggleMedicineBodyType>(
      M.ADMIN_TOGGLE(id),
      body,
    ),

  // ── Free-text aggregate (B13) ──
  // BE không có pagination/sort — endpoint flat.
  adminFreetextStats: () =>
    api.get<FreetextMedicineStatListResType>(M.FREETEXT_STATS),

  // ── Catalog cho picker (B10, doctor) ──
  // BE KHÔNG có page/limit/isActive — chỉ q + species. Trả flat array.
  catalog: (query: MedicineCatalogQueryType = {}) =>
    api.get<MedicineCatalogResType>(
      `${M.CATALOG}?${queryString.stringify(
        { ...query },
        { skipNull: true, skipEmptyString: true },
      )}`,
    ),
};

export default medicineService;
