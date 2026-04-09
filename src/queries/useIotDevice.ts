import { QUERY_KEYS } from "@/constants";
import { ownerIotDeviceService } from "@/services/iotDeviceService";
import type {
  CreateIotDeviceBatchBodyType,
  ListIotDevicesQueryType,
  UpdateIotDeviceBodyType,
} from "@/schemaValidatation/iotDevice";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import type { ApiResponseType } from "@/types/api";

// ── List ───────────────────────────────────────────────────────────────

export const useOwnerListIotDevices = (
  farmId: string,
  query: ListIotDevicesQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.owner.iotDevices.list(farmId, query),
    queryFn: () => ownerIotDeviceService.list(farmId, query),
    enabled: !!farmId && enabled,
  });
};

// ── Detail ─────────────────────────────────────────────────────────────

export const useOwnerIotDeviceDetail = (
  deviceId: string,
  farmId: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.owner.iotDevices.detail(deviceId, farmId),
    queryFn: () => ownerIotDeviceService.detail(deviceId, farmId),
    enabled: !!deviceId && !!farmId && enabled,
  });
};

// ── Create (batch) ─────────────────────────────────────────────────────

export const useOwnerCreateIotDevices = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      farmId,
      body,
    }: {
      farmId: string;
      body: CreateIotDeviceBatchBodyType;
    }) => ownerIotDeviceService.create(farmId, body),
    onSuccess: (_res, { farmId }) => {
      toast.success("Tạo thiết bị IoT thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.owner.iotDevices.list(farmId),
      });
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(
        error?.response?.data?.message ?? "Tạo thiết bị IoT thất bại",
      );
    },
  });
};

// ── Update ─────────────────────────────────────────────────────────────

export const useOwnerUpdateIotDevice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      deviceId,
      farmId,
      body,
    }: {
      deviceId: string;
      farmId: string;
      body: UpdateIotDeviceBodyType;
    }) => ownerIotDeviceService.update(deviceId, farmId, body),
    onSuccess: (_res, { deviceId, farmId }) => {
      toast.success("Cập nhật thiết bị IoT thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.owner.iotDevices.list(farmId),
      });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.owner.iotDevices.detail(deviceId, farmId),
      });
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(
        error?.response?.data?.message ?? "Cập nhật thiết bị IoT thất bại",
      );
    },
  });
};

// ── Delete ─────────────────────────────────────────────────────────────

export const useOwnerDeleteIotDevice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceId, farmId }: { deviceId: string; farmId: string }) =>
      ownerIotDeviceService.delete(deviceId, farmId),
    onSuccess: (_res, { deviceId, farmId }) => {
      toast.success("Xóa thiết bị IoT thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.owner.iotDevices.list(farmId),
      });
      qc.removeQueries({
        queryKey: QUERY_KEYS.owner.iotDevices.detail(deviceId, farmId),
      });
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(
        error?.response?.data?.message ?? "Xóa thiết bị IoT thất bại",
      );
    },
  });
};

// ── Lock Sensors ───────────────────────────────────────────────────────

export const useOwnerLockSensors = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceId, farmId }: { deviceId: string; farmId: string }) =>
      ownerIotDeviceService.lockSensors(deviceId, farmId),
    onSuccess: (_res, { deviceId, farmId }) => {
      toast.success("Khóa cảm biến thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.owner.iotDevices.detail(deviceId, farmId),
      });
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(error?.response?.data?.message ?? "Khóa cảm biến thất bại");
    },
  });
};
