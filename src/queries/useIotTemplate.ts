import { QUERY_KEYS } from "@/constants";
import {
  iotDeviceTemplateService,
  sensorTemplateService,
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
    onSuccess: () => {
      toast.success("Cập nhật template thiết bị IoT thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.admin.iotDeviceTemplates.list(),
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
    onSuccess: () => {
      toast.success("Xóa template thiết bị IoT thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.admin.iotDeviceTemplates.list(),
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
    onSuccess: () => {
      toast.success("Cập nhật template cảm biến thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.admin.sensorTemplates.list(),
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
    onSuccess: () => {
      toast.success("Xóa template cảm biến thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.admin.sensorTemplates.list(),
      });
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(
        error?.response?.data?.message ?? "Xóa template cảm biến thất bại",
      );
    },
  });
};
