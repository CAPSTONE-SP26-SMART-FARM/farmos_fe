import { QUERY_KEYS } from "@/constants";
import { ownerSensorService } from "@/services/sensorService";
import type {
  CreateSensorBatchBodyType,
  ListSensorsQueryType,
  UpdateSensorBodyType,
} from "@/schemaValidatation/sensor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import type { ApiResponseType } from "@/types/api";

// ── List ───────────────────────────────────────────────────────────────

export const useOwnerListSensors = (
  iotDeviceId: string,
  query: ListSensorsQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.owner.sensors.list(iotDeviceId, query),
    queryFn: () => ownerSensorService.list(iotDeviceId, query),
    enabled: !!iotDeviceId && enabled,
  });
};

// ── Create (batch) ─────────────────────────────────────────────────────

export const useOwnerCreateSensors = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      iotDeviceId,
      body,
    }: {
      iotDeviceId: string;
      body: CreateSensorBatchBodyType;
    }) => ownerSensorService.create(iotDeviceId, body),
    onSuccess: (_res, { iotDeviceId }) => {
      toast.success("Tạo cảm biến thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.owner.sensors.list(iotDeviceId),
      });
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(error?.response?.data?.message ?? "Tạo cảm biến thất bại");
    },
  });
};

// ── Update ─────────────────────────────────────────────────────────────

export const useOwnerUpdateSensor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sensorId,
      iotDeviceId,
      body,
    }: {
      sensorId: string;
      iotDeviceId: string;
      body: UpdateSensorBodyType;
    }) => ownerSensorService.update(sensorId, iotDeviceId, body),
    onSuccess: (_res, { iotDeviceId }) => {
      toast.success("Cập nhật cảm biến thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.owner.sensors.list(iotDeviceId),
      });
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(
        error?.response?.data?.message ?? "Cập nhật cảm biến thất bại",
      );
    },
  });
};

// ── Delete ─────────────────────────────────────────────────────────────

export const useOwnerDeleteSensor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sensorId,
      iotDeviceId,
    }: {
      sensorId: string;
      iotDeviceId: string;
    }) => ownerSensorService.delete(sensorId, iotDeviceId),
    onSuccess: (_res, { iotDeviceId }) => {
      toast.success("Xóa cảm biến thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.owner.sensors.list(iotDeviceId),
      });
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(error?.response?.data?.message ?? "Xóa cảm biến thất bại");
    },
  });
};
