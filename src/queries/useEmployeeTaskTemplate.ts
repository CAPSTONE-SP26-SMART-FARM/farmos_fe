import { QUERY_KEYS } from "@/constants";
import {
  employeeTaskTemplateService,
  managerEmployeeTaskTemplateService,
  ownerEmployeeTaskTemplateService,
} from "@/services/employeeTaskTemplateService";
import type {
  CreateEmployeeTaskTemplateBodyType,
  UpdateEmployeeTaskTemplateBodyType,
  ListEmployeeTaskTemplatesQueryType,
} from "@/schemaValidatation/employeeTaskTemplate";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { onMutationError } from "@/lib/axios";

// ── List ───────────────────────────────────────────────────────────────

export const useAdminListEmployeeTaskTemplates = (
  query: ListEmployeeTaskTemplatesQueryType,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.admin.employeeTaskTemplates.list(query),
    queryFn: () => employeeTaskTemplateService.list(query),
  });
};

// ── Detail ─────────────────────────────────────────────────────────────

export const useAdminEmployeeTaskTemplateDetail = (
  id: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.admin.employeeTaskTemplates.detail(id),
    queryFn: () => employeeTaskTemplateService.detail(id),
    enabled,
  });
};

// ── Create ─────────────────────────────────────────────────────────────

export const useAdminCreateEmployeeTaskTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateEmployeeTaskTemplateBodyType) =>
      employeeTaskTemplateService.create(body),
    onSuccess: () => {
      toast.success("Tạo template nhiệm vụ thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.admin.employeeTaskTemplates.list(),
      });
    },
  });
};

// ── Update ─────────────────────────────────────────────────────────────

export const useAdminUpdateEmployeeTaskTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdateEmployeeTaskTemplateBodyType;
    }) => employeeTaskTemplateService.update(id, body),
    onSuccess: (_res, { id }) => {
      toast.success("Cập nhật template nhiệm vụ thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.admin.employeeTaskTemplates.list(),
      });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.admin.employeeTaskTemplates.detail(id),
      });
    },
  });
};

// ── Delete ─────────────────────────────────────────────────────────────

export const useAdminDeleteEmployeeTaskTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeeTaskTemplateService.delete(id),
    onSuccess: (_res, id) => {
      toast.success("Xóa template nhiệm vụ thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.admin.employeeTaskTemplates.list(),
      });
      qc.removeQueries({
        queryKey: QUERY_KEYS.admin.employeeTaskTemplates.detail(id),
      });
    },
    onError: (error) =>
      onMutationError(error, "Xóa template nhiệm vụ thất bại"),
  });
};

// ============================================================
// Manager — read-only
// ============================================================

export const useManagerListEmployeeTaskTemplates = (
  query: ListEmployeeTaskTemplatesQueryType,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.manager.employeeTaskTemplates.list(query),
    queryFn: () => managerEmployeeTaskTemplateService.list(query),
  });
};

export const useManagerEmployeeTaskTemplateDetail = (
  id: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.manager.employeeTaskTemplates.detail(id),
    queryFn: () => managerEmployeeTaskTemplateService.detail(id),
    enabled,
  });
};

// ============================================================
// Owner — read-only
// ============================================================

export const useOwnerListEmployeeTaskTemplates = (
  query: ListEmployeeTaskTemplatesQueryType,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.owner.employeeTaskTemplates.list(query),
    queryFn: () => ownerEmployeeTaskTemplateService.list(query),
  });
};

export const useOwnerEmployeeTaskTemplateDetail = (
  id: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.owner.employeeTaskTemplates.detail(id),
    queryFn: () => ownerEmployeeTaskTemplateService.detail(id),
    enabled,
  });
};
