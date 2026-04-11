import { QUERY_KEYS } from "@/constants";
import {
  iotDeviceTemplateService,
  managerIotDeviceTemplateService,
  managerSensorTemplateService,
  sensorTemplateService,
  ownerIotDeviceTemplateService,
  ownerSensorTemplateService,
} from "@/services/iotTemplateService";
import type {
  CreateIotDeviceTemplateBodyType,
  UpdateIotDeviceTemplateBodyType,
  ListIotDeviceTemplateQueryType,
  CreateSensorTemplateBodyType,
  UpdateSensorTemplateBodyType,
  ListSensorTemplatesQueryType,
} from "@/schemaValidatation/iotTemplate";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import type { ApiResponseType } from "@/types/api";

// ============================================================
// IoT Device Template
// ============================================================

export const useAdminListIotDeviceTemplates = (
  query: ListIotDeviceTemplateQueryType,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.admin.iotDeviceTemplates.list(query),
    queryFn: () => iotDeviceTemplateService.list(query),
  });
};

export const useAdminIotDeviceTemplateDetail = (
  id: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.admin.iotDeviceTemplates.detail(id),
    queryFn: () => iotDeviceTemplateService.detail(id),
    enabled,
  });
};

export const useAdminCreateIotDeviceTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateIotDeviceTemplateBodyType) =>
      iotDeviceTemplateService.create(body),
    onSuccess: () => {
      toast.success("Tạo template thiết bị IoT thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.admin.iotDeviceTemplates.list(),
      });
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(
        error?.response?.data?.message ?? "Tạo template thiết bị thất bại",
      );
    },
  });
};

export const useAdminUpdateIotDeviceTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdateIotDeviceTemplateBodyType;
    }) => iotDeviceTemplateService.update(id, body),
    onSuccess: (_res, { id }) => {
      toast.success("Cập nhật template thiết bị IoT thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.admin.iotDeviceTemplates.list(),
      });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.admin.iotDeviceTemplates.detail(id),
      });
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(
        error?.response?.data?.message ?? "Cập nhật template thiết bị thất bại",
      );
    },
  });
};

export const useAdminDeleteIotDeviceTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => iotDeviceTemplateService.delete(id),
    onSuccess: (_res, id) => {
      toast.success("Xóa template thiết bị IoT thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.admin.iotDeviceTemplates.list(),
      });
      qc.removeQueries({
        queryKey: QUERY_KEYS.admin.iotDeviceTemplates.detail(id),
      });
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(
        error?.response?.data?.message ?? "Xóa template thiết bị thất bại",
      );
    },
  });
};

// ============================================================
// Sensor Template
// ============================================================

export const useAdminListSensorTemplates = (
  query: ListSensorTemplatesQueryType,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.admin.sensorTemplates.list(query),
    queryFn: () => sensorTemplateService.list(query),
  });
};

export const useAdminSensorTemplateDetail = (id: string, enabled: boolean) => {
  return useQuery({
    queryKey: QUERY_KEYS.admin.sensorTemplates.detail(id),
    queryFn: () => sensorTemplateService.detail(id),
    enabled,
  });
};

export const useAdminCreateSensorTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSensorTemplateBodyType) =>
      sensorTemplateService.create(body),
    onSuccess: () => {
      toast.success("Tạo template cảm biến thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.admin.sensorTemplates.list(),
      });
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(
        error?.response?.data?.message ?? "Tạo template cảm biến thất bại",
      );
    },
  });
};

export const useAdminUpdateSensorTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdateSensorTemplateBodyType;
    }) => sensorTemplateService.update(id, body),
    onSuccess: (_res, { id }) => {
      toast.success("Cập nhật template cảm biến thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.admin.sensorTemplates.list(),
      });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.admin.sensorTemplates.detail(id),
      });
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(
        error?.response?.data?.message ?? "Cập nhật template cảm biến thất bại",
      );
    },
  });
};

export const useAdminDeleteSensorTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sensorTemplateService.delete(id),
    onSuccess: (_res, id) => {
      toast.success("Xóa template cảm biến thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.admin.sensorTemplates.list(),
      });
      qc.removeQueries({
        queryKey: QUERY_KEYS.admin.sensorTemplates.detail(id),
      });
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(
        error?.response?.data?.message ?? "Xóa template cảm biến thất bại",
      );
    },
  });
};

// ============================================================
// Owner — IoT Device Template (read-only)
// ============================================================

export const useOwnerListIotDeviceTemplates = (
  query: ListIotDeviceTemplateQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.owner.iotDeviceTemplates.list(query),
    queryFn: () => ownerIotDeviceTemplateService.list(query),
    enabled,
  });
};

export const useOwnerIotDeviceTemplateDetail = (
  id: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.owner.iotDeviceTemplates.detail(id),
    queryFn: () => ownerIotDeviceTemplateService.detail(id),
    enabled,
  });
};

// ============================================================
// Owner — Sensor Template (read-only)
// ============================================================

export const useOwnerListSensorTemplates = (
  query: ListSensorTemplatesQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.owner.sensorTemplates.list(query),
    queryFn: () => ownerSensorTemplateService.list(query),
    enabled,
  });
};

export const useOwnerSensorTemplateDetail = (id: string, enabled: boolean) => {
  return useQuery({
    queryKey: QUERY_KEYS.owner.sensorTemplates.detail(id),
    queryFn: () => ownerSensorTemplateService.detail(id),
    enabled,
  });
};

// ============================================================
// Manager — IoT Device Template (read-only)
// ============================================================

export const useManagerListIotDeviceTemplates = (
  query: ListIotDeviceTemplateQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.manager.iotDeviceTemplates.list(query),
    queryFn: () => managerIotDeviceTemplateService.list(query),
    enabled,
  });
};

export const useManagerIotDeviceTemplateDetail = (
  id: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.manager.iotDeviceTemplates.detail(id),
    queryFn: () => managerIotDeviceTemplateService.detail(id),
    enabled,
  });
};

// ============================================================
// Manager — Sensor Template (read-only)
// ============================================================

export const useManagerListSensorTemplates = (
  query: ListSensorTemplatesQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.manager.sensorTemplates.list(query),
    queryFn: () => managerSensorTemplateService.list(query),
    enabled,
  });
};

export const useManagerSensorTemplateDetail = (
  id: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.manager.sensorTemplates.detail(id),
    queryFn: () => managerSensorTemplateService.detail(id),
    enabled,
  });
};
