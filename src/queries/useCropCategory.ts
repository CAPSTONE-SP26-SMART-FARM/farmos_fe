import { QUERY_KEYS } from "@/constants";
import type {
  CreateCropCategoryBodyType,
  ListCropCategoriesQueryType,
  ToggleCropCategoryBodyType,
  UpdateCropCategoryBodyType,
} from "@/schemaValidatation/cropCategory";
import cropCategoryService from "@/services/cropCategoryService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useAdminCropCategoryList = (
  query: ListCropCategoriesQueryType,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.cropCategories.adminList(query),
    queryFn: () => cropCategoryService.adminList(query),
    enabled,
  });

export const useActiveCropCategoryList = (enabled = true) =>
  useQuery({
    queryKey: QUERY_KEYS.cropCategories.activeList(),
    queryFn: () => cropCategoryService.activeList(),
    enabled,
  });

export const useCreateCropCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCropCategoryBodyType) =>
      cropCategoryService.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.cropCategories.root });
    },
  });
};

export const useUpdateCropCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdateCropCategoryBodyType;
    }) => cropCategoryService.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.cropCategories.root });
    },
  });
};

export const useToggleCropCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: ToggleCropCategoryBodyType;
    }) => cropCategoryService.toggle(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.cropCategories.root });
    },
  });
};
