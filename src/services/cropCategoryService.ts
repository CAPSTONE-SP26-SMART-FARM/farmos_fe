import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  ActiveCropCategoryListResType,
  CreateCropCategoryBodyType,
  CropCategoryType,
  ListCropCategoriesQueryType,
  ListCropCategoriesResType,
  ToggleCropCategoryBodyType,
  UpdateCropCategoryBodyType,
} from "@/schemaValidatation/cropCategory";
import queryString from "query-string";

const EP = API_ENDPOINTS.CROP_CATEGORIES;

const cropCategoryService = {
  adminList: (query: ListCropCategoriesQueryType) =>
    api.get<ListCropCategoriesResType>(
      `${EP.ADMIN_LIST}?${queryString.stringify(
        { ...query },
        { skipNull: true, skipEmptyString: true },
      )}`,
    ),

  create: (body: CreateCropCategoryBodyType) =>
    api.post<CropCategoryType, CreateCropCategoryBodyType>(
      EP.ADMIN_CREATE,
      body,
    ),

  update: (id: string, body: UpdateCropCategoryBodyType) =>
    api.patch<CropCategoryType, UpdateCropCategoryBodyType>(
      EP.ADMIN_UPDATE(id),
      body,
    ),

  toggle: (id: string, body: ToggleCropCategoryBodyType) =>
    api.patch<CropCategoryType, ToggleCropCategoryBodyType>(
      EP.ADMIN_TOGGLE(id),
      body,
    ),

  activeList: () => api.get<ActiveCropCategoryListResType>(EP.ACTIVE_LIST),
};

export default cropCategoryService;
