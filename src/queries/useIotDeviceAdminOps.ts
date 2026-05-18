import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/constants";
import { onMutationError } from "@/lib/axios";
import { iotDeviceAdminOpsService } from "@/services/iotDeviceAdminOpsService";
import type {
  AdminSwapBoardBodyType,
  BulkSetStatusBodyType,
  DeviceTimelineQueryType,
  InstallMarkBlockedBodyType,
  InstallQueueQueryType,
  RecoveryBulkCompleteBodyType,
  RecoveryQueueQueryType,
} from "@/schemaValidatation/iotDeviceAdminOps";

// ─────────────────────────────────────────────────────────────
// A1 — Dashboard overview
// ─────────────────────────────────────────────────────────────
export const useAdminIotOverview = (enabled = true) =>
  useQuery({
    queryKey: QUERY_KEYS.admin.iotDevices.iotOverview(),
    queryFn: () => iotDeviceAdminOpsService.getIotOverview(),
    enabled,
  });

// ─────────────────────────────────────────────────────────────
// A2 — Decision context for 1 device
// ─────────────────────────────────────────────────────────────
export const useAdminDecisionContext = (deviceId: string, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEYS.admin.iotDevices.decisionContext(deviceId),
    queryFn: () => iotDeviceAdminOpsService.getDecisionContext(deviceId),
    enabled: !!deviceId && enabled,
  });

// ─────────────────────────────────────────────────────────────
// A3a — Install queue grouped
// ─────────────────────────────────────────────────────────────
export const useAdminInstallQueue = (
  query?: InstallQueueQueryType,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.admin.iotDevices.installQueue(query),
    queryFn: () => iotDeviceAdminOpsService.getInstallQueue(query),
    enabled,
    placeholderData: keepPreviousData,
  });

// ─────────────────────────────────────────────────────────────
// A3b — Bulk set status (partial-fail allowed)
// ─────────────────────────────────────────────────────────────
export const useAdminBulkSetStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BulkSetStatusBodyType) =>
      iotDeviceAdminOpsService.bulkSetStatus(body),
    onSuccess: async (res) => {
      // Invalidate install queue + list + overview để UI cập nhật.
      await Promise.all([
        qc.invalidateQueries({
          queryKey: QUERY_KEYS.admin.iotDevices.installQueue(),
        }),
        qc.invalidateQueries({
          queryKey: QUERY_KEYS.admin.iotDevices.list(),
        }),
        qc.invalidateQueries({
          queryKey: QUERY_KEYS.admin.iotDevices.iotOverview(),
        }),
      ]);
      const body = res?.data;
      if (body && body.failureCount === 0) {
        toast.success(
          `Đã cập nhật ${body.successCount}/${body.total} thiết bị`,
        );
      } else if (body) {
        toast.warning(
          `Hoàn tất: ${body.successCount} thành công, ${body.failureCount} thất bại`,
        );
      }
    },
    onError: (error) => onMutationError(error, "Cập nhật hàng loạt thất bại"),
  });
};

// ─────────────────────────────────────────────────────────────
// A4 — Owner 360° overview
// ─────────────────────────────────────────────────────────────
export const useAdminOwnerOverview = (ownerId: string, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEYS.admin.iotDevices.ownerOverview(ownerId),
    queryFn: () => iotDeviceAdminOpsService.getOwnerOverview(ownerId),
    enabled: !!ownerId && enabled,
  });

// ─────────────────────────────────────────────────────────────
// Swap board (action từ A2)
// ─────────────────────────────────────────────────────────────
export const useAdminSwapBoard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AdminSwapBoardBodyType) =>
      iotDeviceAdminOpsService.swapBoard(body),
    onSuccess: async (_res, body) => {
      await Promise.all([
        qc.invalidateQueries({
          queryKey: QUERY_KEYS.admin.iotDevices.decisionContext(body.oldBoardId),
        }),
        qc.invalidateQueries({
          queryKey: QUERY_KEYS.admin.iotDevices.list(),
        }),
        qc.invalidateQueries({
          queryKey: QUERY_KEYS.admin.iotDevices.iotOverview(),
        }),
      ]);
      toast.success("Đã thay vi xử lý thành công");
    },
    onError: (error) => onMutationError(error, "Thay vi xử lý thất bại"),
  });
};

// ─────────────────────────────────────────────────────────────
// A5 — Device timeline (cursor pagination via `before`)
// ─────────────────────────────────────────────────────────────
export const useAdminDeviceTimeline = (
  deviceId: string,
  query?: DeviceTimelineQueryType,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.admin.iotDevices.timeline(deviceId, query),
    queryFn: () => iotDeviceAdminOpsService.getDeviceTimeline(deviceId, query),
    enabled: !!deviceId && enabled,
  });

// ─────────────────────────────────────────────────────────────
// A6 — Recovery queue
// ─────────────────────────────────────────────────────────────
export const useAdminRecoveryQueue = (
  query?: RecoveryQueueQueryType,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.admin.iotDevices.recoveryQueue(query),
    queryFn: () => iotDeviceAdminOpsService.getRecoveryQueue(query),
    enabled,
    placeholderData: keepPreviousData,
  });

// ─────────────────────────────────────────────────────────────
// A7 — Recovery bulk complete (2-outcome atomic)
// ─────────────────────────────────────────────────────────────
export const useAdminRecoveryBulkComplete = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RecoveryBulkCompleteBodyType) =>
      iotDeviceAdminOpsService.recoveryBulkComplete(body),
    onSuccess: async (res) => {
      await Promise.all([
        qc.invalidateQueries({
          queryKey: QUERY_KEYS.admin.iotDevices.recoveryQueue(),
        }),
        qc.invalidateQueries({
          queryKey: QUERY_KEYS.admin.iotDevices.list(),
        }),
        qc.invalidateQueries({
          queryKey: QUERY_KEYS.admin.iotDevices.iotOverview(),
        }),
      ]);
      const body = res?.data;
      if (body && body.failureCount === 0) {
        toast.success(
          `Đã hoàn tất thu hồi ${body.successCount}/${body.total} thiết bị`,
        );
      } else if (body) {
        toast.warning(
          `Hoàn tất: ${body.successCount} thành công, ${body.failureCount} thất bại`,
        );
      }
    },
    onError: (error) => onMutationError(error, "Hoàn tất thu hồi thất bại"),
  });
};

// ─────────────────────────────────────────────────────────────
// A8 — Install mark blocked
// ─────────────────────────────────────────────────────────────
export const useAdminInstallMarkBlocked = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: InstallMarkBlockedBodyType) =>
      iotDeviceAdminOpsService.installMarkBlocked(body),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: QUERY_KEYS.admin.iotDevices.installQueue(),
      });
      toast.success("Đã đánh dấu thiết bị bị chặn lắp");
    },
    onError: (error) => onMutationError(error, "Đánh dấu thất bại"),
  });
};
