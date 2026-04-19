import { QUERY_KEYS } from "@/constants";
import {
  managerSensorService,
  ownerSensorService,
} from "@/services/sensorService";
import type {
  CreateSensorBatchBodyType,
  ListSensorsQueryType,
  UpdateSensorBodyType,
} from "@/schemaValidatation/sensor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { onMutationError } from "@/lib/axios";

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
    onError: (error) => onMutationError(error, "Cập nhật cảm biến thất bại"),
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
    onError: (error) => onMutationError(error, "Xóa cảm biến thất bại"),
  });
};

// ── Manager hooks ─────────────────────────────────────────────────────

export const useManagerListSensors = (
  iotDeviceId: string,
  query: ListSensorsQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.manager.sensors.list(iotDeviceId, query),
    queryFn: () => managerSensorService.list(iotDeviceId, query),
    enabled: !!iotDeviceId && enabled,
  });
};

export const useManagerCreateSensors = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      iotDeviceId,
      body,
    }: {
      iotDeviceId: string;
      body: CreateSensorBatchBodyType;
    }) => managerSensorService.create(iotDeviceId, body),
    onSuccess: (_res, { iotDeviceId }) => {
      toast.success("Tạo cảm biến thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.manager.sensors.list(iotDeviceId),
      });
    },
  });
};

export const useManagerUpdateSensor = () => {
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
    }) => managerSensorService.update(sensorId, iotDeviceId, body),
    onSuccess: (_res, { iotDeviceId }) => {
      toast.success("Cập nhật cảm biến thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.manager.sensors.list(iotDeviceId),
      });
    },
    onError: (error) => onMutationError(error, "Cập nhật cảm biến thất bại"),
  });
};

export const useManagerDeleteSensor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sensorId,
      iotDeviceId,
    }: {
      sensorId: string;
      iotDeviceId: string;
    }) => managerSensorService.delete(sensorId, iotDeviceId),
    onSuccess: (_res, { iotDeviceId }) => {
      toast.success("Xóa cảm biến thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.manager.sensors.list(iotDeviceId),
      });
    },
    onError: (error) => onMutationError(error, "Xóa cảm biến thất bại"),
  });
};
