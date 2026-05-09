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
import { onMutationError } from "@/lib/axios";

function unsupportedProvisioningSensorWrite(role: "owner" | "manager") {
  return Promise.reject(
    new Error(
      `Luồng đã ngừng hỗ trợ: vai trò ${role} không còn được phép thao tác ghi cảm biến. Vui lòng sử dụng API gán Iot kit của quản trị viên.`,
    ),
  );
}

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
    }) => {
      void iotDeviceId;
      void body;
      return unsupportedProvisioningSensorWrite("owner");
    },
    onError: (error, { iotDeviceId }) => {
      onMutationError(
        error,
        "Owner không thể tạo cảm biến ở luồng provisioning",
      );
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
    }) => {
      void sensorId;
      void iotDeviceId;
      void body;
      return unsupportedProvisioningSensorWrite("owner");
    },
    onError: (error, { iotDeviceId }) => {
      onMutationError(
        error,
        "Owner không thể cập nhật cảm biến ở luồng provisioning",
      );
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.owner.sensors.list(iotDeviceId),
      });
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
    }) => {
      void sensorId;
      void iotDeviceId;
      return unsupportedProvisioningSensorWrite("owner");
    },
    onError: (error, { iotDeviceId }) => {
      onMutationError(
        error,
        "Owner không thể xóa cảm biến ở luồng provisioning",
      );
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.owner.sensors.list(iotDeviceId),
      });
    },
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
    }) => {
      void iotDeviceId;
      void body;
      return unsupportedProvisioningSensorWrite("manager");
    },
    onError: (error, { iotDeviceId }) => {
      onMutationError(
        error,
        "Quản lý không thể tạo cảm biến ở luồng provisioning",
      );
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
    }) => {
      void sensorId;
      void iotDeviceId;
      void body;
      return unsupportedProvisioningSensorWrite("manager");
    },
    onError: (error, { iotDeviceId }) => {
      onMutationError(
        error,
        "Quản lý không thể cập nhật cảm biến ở luồng provisioning",
      );
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.manager.sensors.list(iotDeviceId),
      });
    },
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
    }) => {
      void sensorId;
      void iotDeviceId;
      return unsupportedProvisioningSensorWrite("manager");
    },
    onError: (error, { iotDeviceId }) => {
      onMutationError(
        error,
        "Quản lý không thể xóa cảm biến ở luồng provisioning",
      );
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.manager.sensors.list(iotDeviceId),
      });
    },
  });
};
