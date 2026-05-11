import { QUERY_KEYS } from "@/constants";
import {
  adminIotDeviceService,
  managerIotDeviceService,
  ownerIotDeviceService,
} from "@/services/iotDeviceService";
import type {
  AdminAssignFromKitBodyType,
  AdminAssignOwnerBodyType,
  AdminCreateIotDeviceBatchBodyType,
  AdminCreateSensorBatchBodyType,
  AdminUnassignOwnerBodyType,
  AdminUpdateSensorBodyType,
  CreateIotDeviceBatchBodyType,
  ListIotDeviceLogsQueryType,
  ListIotDevicesQueryType,
  UpdateIotDeviceBodyType,
} from "@/schemaValidatation/iotDevice";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { onMutationError } from "@/lib/axios";
import { toast } from "sonner";

// ── Admin hooks (provisioning write authority) ───────────────────────

export const useAdminListIotDevices = (
  query: ListIotDevicesQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.admin.iotDevices.list(query),
    queryFn: () => adminIotDeviceService.list(query),
    enabled,
  });
};

export const useAdminIotDeviceDetail = (deviceId: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.admin.iotDevices.detail(deviceId),
    queryFn: () => adminIotDeviceService.detail(deviceId),
    enabled: !!deviceId && enabled,
  });
};

export const useAdminCreateIotDeviceBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      farmId,
    }: {
      body: AdminCreateIotDeviceBatchBodyType;
      farmId?: string;
    }) =>
      farmId
        ? adminIotDeviceService.createBatchByFarm(farmId, body)
        : adminIotDeviceService.createBatch(body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.admin.iotDevices.list(),
      });
      toast.success("Tạo thiết bị IoT thành công!");
    },
    onError: (error) =>
      onMutationError(error, "Tạo batch thiết bị IoT thất bại"),
  });
};

export const useAdminUpdateIotDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      deviceId,
      body,
    }: {
      deviceId: string;
      body: UpdateIotDeviceBodyType;
    }) => adminIotDeviceService.update(deviceId, body),
    onSuccess: (_res, { deviceId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.admin.iotDevices.list(),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.admin.iotDevices.detail(deviceId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.iotKits.all,
      });
      toast.success("Cập nhật thiết bị IoT thành công!");
    },
    onError: (error) =>
      onMutationError(error, "Cập nhật thiết bị IoT thất bại"),
  });
};

export const useAdminDeleteIotDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deviceId: string) => adminIotDeviceService.delete(deviceId),
    onSuccess: (_res, deviceId) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.admin.iotDevices.list(),
      });
      queryClient.removeQueries({
        queryKey: QUERY_KEYS.admin.iotDevices.detail(deviceId),
      });
    },
    onError: (error) => onMutationError(error, "Xóa thiết bị IoT thất bại"),
  });
};

export const useAdminCreateSensorBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      deviceId,
      body,
    }: {
      deviceId: string;
      body: AdminCreateSensorBatchBodyType;
    }) => adminIotDeviceService.createSensorBatch(deviceId, body),
    onSuccess: (_res, { deviceId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.admin.iotDevices.detail(deviceId),
      });
    },
    onError: (error) => onMutationError(error, "Thêm cảm biến thất bại"),
  });
};

export const useAdminUpdateSensor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      deviceId,
      sensorId,
      body,
    }: {
      deviceId: string;
      sensorId: string;
      body: AdminUpdateSensorBodyType;
    }) => adminIotDeviceService.updateSensor(deviceId, sensorId, body),
    onSuccess: (_res, { deviceId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.admin.iotDevices.detail(deviceId),
      });
    },
    onError: (error) => onMutationError(error, "Cập nhật cảm biến thất bại"),
  });
};

export const useAdminDeleteSensor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      deviceId,
      sensorId,
    }: {
      deviceId: string;
      sensorId: string;
    }) => adminIotDeviceService.deleteSensor(deviceId, sensorId),
    onSuccess: (_res, { deviceId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.admin.iotDevices.detail(deviceId),
      });
    },
    onError: (error) => onMutationError(error, "Xóa cảm biến thất bại"),
  });
};

export const useAdminAssignIotOwner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AdminAssignOwnerBodyType) =>
      adminIotDeviceService.assignOwner(body),
    onSuccess: (_res, body) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.admin.iotDevices.list(),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.admin.iotDevices.detail(body.iotDeviceId),
      });
    },
    onError: (error) =>
      onMutationError(error, "Gán Chủ trang trại cho thiết bị thất bại"),
  });
};

export const useAdminAssignIotFromKit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AdminAssignFromKitBodyType) =>
      adminIotDeviceService.assignFromKit(body),
    onSuccess: (_res, body) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.admin.iotDevices.list(),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.admin.iotDevices.detail(body.iotDeviceId),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.iotKits.all });
    },
    onError: (error) =>
      onMutationError(error, "Gán thiết bị từ bộ kit thất bại"),
  });
};

export const useAdminUnassignIotOwner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AdminUnassignOwnerBodyType) =>
      adminIotDeviceService.unassignOwner(body),
    onSuccess: (_res, body) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.admin.iotDevices.list(),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.admin.iotDevices.detail(body.iotDeviceId),
      });
    },
    onError: (error) =>
      onMutationError(error, "Thu hồi Chủ trang trại khỏi thiết bị thất bại"),
  });
};

function unsupportedProvisioningWrite(role: "owner" | "manager") {
  return Promise.reject(
    new Error(
      `Luồng đã ngừng hỗ trợ: vai trò ${role} không còn được phép thao tác ghi IoT. Vui lòng sử dụng API gán Iot kit của quản trị viên.`,
    ),
  );
}

// ── List ───────────────────────────────────────────────────────────────

export const useOwnerListIotDevices = (
  _farmId: string,
  query: ListIotDevicesQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.owner.iotDevices.list(query),
    queryFn: () => ownerIotDeviceService.list(query),
    enabled,
  });
};

// ── Detail ─────────────────────────────────────────────────────────────

export const useOwnerIotDeviceDetail = (
  deviceId: string,
  _farmId: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.owner.iotDevices.detail(deviceId),
    queryFn: () => ownerIotDeviceService.detail(deviceId),
    enabled: !!deviceId && enabled,
  });
};

// ── Create (batch) ─────────────────────────────────────────────────────

export const useOwnerCreateIotDevices = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      farmId,
      body,
    }: {
      farmId: string;
      body: CreateIotDeviceBatchBodyType;
    }) => {
      void farmId;
      void body;
      return unsupportedProvisioningWrite("owner");
    },
    onError: (error) => {
      onMutationError(
        error,
        "Owner không thể tạo thiết bị ở luồng provisioning",
      );
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.owner.iotDevices.list(),
      });
    },
  });
};

// ── Update ─────────────────────────────────────────────────────────────

export const useOwnerUpdateIotDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      deviceId,
      farmId,
      body,
    }: {
      deviceId: string;
      farmId: string;
      body: UpdateIotDeviceBodyType;
    }) => {
      void deviceId;
      void farmId;
      void body;
      return unsupportedProvisioningWrite("owner");
    },
    onError: (error) => {
      onMutationError(
        error,
        "Owner không thể cập nhật thiết bị ở luồng provisioning",
      );
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.owner.iotDevices.list(),
      });
    },
  });
};

// ── Delete ─────────────────────────────────────────────────────────────

export const useOwnerDeleteIotDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      deviceId,
      farmId,
    }: {
      deviceId: string;
      farmId: string;
    }) => {
      void deviceId;
      void farmId;
      return unsupportedProvisioningWrite("owner");
    },
    onError: (error) => {
      onMutationError(
        error,
        "Owner không thể xóa thiết bị ở luồng provisioning",
      );
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.owner.iotDevices.list(),
      });
    },
  });
};

// ── Lock Sensors ───────────────────────────────────────────────────────

export const useOwnerLockSensors = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      deviceId,
      farmId,
    }: {
      deviceId: string;
      farmId: string;
    }) => {
      void deviceId;
      void farmId;
      return unsupportedProvisioningWrite("owner");
    },
    onError: (error) => {
      onMutationError(
        error,
        "Owner không thể khóa cảm biến ở luồng provisioning",
      );
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.owner.iotDevices.list(),
      });
    },
  });
};

// ── Manager hooks ─────────────────────────────────────────────────────

export const useManagerListIotDevices = (
  _farmId: string,
  query: ListIotDevicesQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.manager.iotDevices.list(query),
    queryFn: () => managerIotDeviceService.list(query),
    enabled,
  });
};

export const useManagerIotDeviceDetail = (
  deviceId: string,
  _farmId: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.manager.iotDevices.detail(deviceId),
    queryFn: () => managerIotDeviceService.detail(deviceId),
    enabled: !!deviceId && enabled,
  });
};

export const useManagerCreateIotDevices = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      farmId,
      body,
    }: {
      farmId: string;
      body: CreateIotDeviceBatchBodyType;
    }) => {
      void farmId;
      void body;
      return unsupportedProvisioningWrite("manager");
    },
    onError: (error) => {
      onMutationError(
        error,
        "Quản lý không thể tạo thiết bị ở luồng provisioning",
      );
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.manager.iotDevices.list(),
      });
    },
  });
};

export const useManagerUpdateIotDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      deviceId,
      farmId,
      body,
    }: {
      deviceId: string;
      farmId: string;
      body: UpdateIotDeviceBodyType;
    }) => {
      void deviceId;
      void farmId;
      void body;
      return unsupportedProvisioningWrite("manager");
    },
    onError: (error) => {
      onMutationError(
        error,
        "Quản lý không thể cập nhật thiết bị ở luồng provisioning",
      );
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.manager.iotDevices.list(),
      });
    },
  });
};

export const useManagerDeleteIotDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      deviceId,
      farmId,
    }: {
      deviceId: string;
      farmId: string;
    }) => {
      void deviceId;
      void farmId;
      return unsupportedProvisioningWrite("manager");
    },
    onError: (error) => {
      onMutationError(
        error,
        "Quản lý không thể xóa thiết bị ở luồng provisioning",
      );
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.manager.iotDevices.list(),
      });
    },
  });
};

export const useManagerLockSensors = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      deviceId,
      farmId,
    }: {
      deviceId: string;
      farmId: string;
    }) => {
      void deviceId;
      void farmId;
      return unsupportedProvisioningWrite("manager");
    },
    onError: (error) => {
      onMutationError(
        error,
        "Quản lý không thể khóa cảm biến ở luồng provisioning",
      );
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.manager.iotDevices.list(),
      });
    },
  });
};

// ── Admin IoT Device Log hooks ───────────────────────────────────────

export const useAdminListIotDeviceLogs = (
  query: ListIotDeviceLogsQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.admin.iotDevices.logs(query),
    queryFn: () => adminIotDeviceService.listLogs(query),
    enabled,
  });
};

export const useAdminIotDeviceLogDetail = (logId: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.admin.iotDevices.logDetail(logId),
    queryFn: () => adminIotDeviceService.logDetail(logId),
    enabled: !!logId && enabled,
  });
};
