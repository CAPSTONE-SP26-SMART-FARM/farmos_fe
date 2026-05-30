import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/constants";
import { onMutationError } from "@/lib/axios";
import type {
  CancelRequestBodyType,
  CompleteInstallBodyType,
  CompleteRecoveryBodyType,
  CompleteSwapBodyType,
  CreateFaultReportBodyType,
  KitInstallBulkResType,
  ListKitRequestsQueryType,
  ListReplacementDevicesQueryType,
  RejectRequestBodyType,
  ReportOverdueBodyType,
  ResolveFaultBodyType,
  ScheduleInstallBodyType,
  ScheduleRecoveryBodyType,
  ScheduleSwapBodyType,
} from "@/schemaValidatation/iotKitRequest";
import { iotKitRequestService } from "@/services/iotKitRequestService";

/**
 * React Query hooks cho module Iot Kit Request.
 *
 * Pattern invalidate:
 *  - Mọi mutation → invalidate `["iot-kit-requests"]` (cover cả listMy +
 *    listAdmin + detail).
 *  - `startInstall` / `completeInstall` → thêm invalidate cache device 3 role
 *    vì BE flip device status trong cùng tx.
 */

const KIT_KEY = QUERY_KEYS.iotKitRequests.all;
const DEVICE_KEYS_ALL = [
  ["owner", "iot-devices"] as const,
  ["manager", "iot-devices"] as const,
  ["admin", "iot-devices"] as const,
];

// ============================================================
// Queries
// ============================================================

export const useMyKitRequests = (
  query: ListKitRequestsQueryType,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.iotKitRequests.listMy(query),
    queryFn: () => iotKitRequestService.listMy(query),
    enabled,
    placeholderData: keepPreviousData,
  });

export const useAdminKitRequestList = (
  query: ListKitRequestsQueryType,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.iotKitRequests.listAdmin(query),
    queryFn: () => iotKitRequestService.listAdmin(query),
    enabled,
    placeholderData: keepPreviousData,
  });

export const useManagerKitRequestList = (
  query: ListKitRequestsQueryType,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.iotKitRequests.listManager(query),
    queryFn: () => iotKitRequestService.listManager(query),
    enabled,
    placeholderData: keepPreviousData,
  });

export const useKitRequestDetail = (id: string, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEYS.iotKitRequests.detail(id),
    queryFn: () => iotKitRequestService.detail(id),
    enabled: !!id && enabled,
  });

// ============================================================
// Mutations — FAULT_REPORT
// ============================================================

export const useCreateFaultReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateFaultReportBodyType) =>
      iotKitRequestService.createFaultReport(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: KIT_KEY });
      toast.success("Đã gửi yêu cầu báo lỗi tới quản trị");
    },
    onError: (error) => onMutationError(error, "Gửi yêu cầu báo lỗi thất bại"),
  });
};

export const useClaimKitRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => iotKitRequestService.claim(id),
    onSuccess: async (_res, id) => {
      await qc.invalidateQueries({ queryKey: KIT_KEY });
      await qc.invalidateQueries({
        queryKey: QUERY_KEYS.iotKitRequests.detail(id),
      });
      toast.success("Đã nhận xử lý yêu cầu");
    },
    onError: (error) => onMutationError(error, "Nhận xử lý thất bại"),
  });
};

export const useResolveFault = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ResolveFaultBodyType }) =>
      iotKitRequestService.resolveFault(id, body),
    onSuccess: async (_res, { id }) => {
      await qc.invalidateQueries({ queryKey: KIT_KEY });
      await qc.invalidateQueries({
        queryKey: QUERY_KEYS.iotKitRequests.detail(id),
      });
      toast.success("Đã đánh dấu yêu cầu đã xử lý");
    },
    onError: (error) => onMutationError(error, "Cập nhật yêu cầu thất bại"),
  });
};

export const useRejectKitRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: RejectRequestBodyType }) =>
      iotKitRequestService.reject(id, body),
    onSuccess: async (_res, { id }) => {
      await qc.invalidateQueries({ queryKey: KIT_KEY });
      await qc.invalidateQueries({
        queryKey: QUERY_KEYS.iotKitRequests.detail(id),
      });
      toast.success("Đã từ chối yêu cầu");
    },
    onError: (error) => onMutationError(error, "Từ chối yêu cầu thất bại"),
  });
};

// ============================================================
// Mutations — Cancel (shared)
// ============================================================

export const useCancelKitRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CancelRequestBodyType }) =>
      iotKitRequestService.cancel(id, body),
    onSuccess: async (_res, { id }) => {
      await qc.invalidateQueries({ queryKey: KIT_KEY });
      await qc.invalidateQueries({
        queryKey: QUERY_KEYS.iotKitRequests.detail(id),
      });
      toast.success("Đã hủy yêu cầu");
    },
    onError: (error) => onMutationError(error, "Hủy yêu cầu thất bại"),
  });
};

// ============================================================
// Mutations — INSTALL_SCHEDULE bulk actions
// ============================================================

/** Tổng kết kết quả bulk thành toast — hiển thị success + failure count. */
const toastBulkResult = (
  res: { data: KitInstallBulkResType },
  okMessage: string,
) => {
  const { successCount, failureCount, total } = res.data;
  if (failureCount === 0) {
    toast.success(`${okMessage} (${successCount}/${total} thiết bị)`);
  } else if (successCount === 0) {
    toast.error(
      `Không có thiết bị nào được cập nhật (${failureCount} lỗi)`,
    );
  } else {
    toast.warning(
      `${okMessage} một phần: ${successCount} thành công, ${failureCount} lỗi`,
    );
  }
};

export const useStartInstall = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => iotKitRequestService.startInstall(id),
    onSuccess: async (res, id) => {
      await qc.invalidateQueries({ queryKey: KIT_KEY });
      await qc.invalidateQueries({
        queryKey: QUERY_KEYS.iotKitRequests.detail(id),
      });
      // BE flip purchase → install — invalidate device cache 3 role
      for (const key of DEVICE_KEYS_ALL) {
        await qc.invalidateQueries({ queryKey: key });
      }
      toastBulkResult(res, "Đã bắt đầu lắp đặt");
    },
    onError: (error) => onMutationError(error, "Bắt đầu lắp đặt thất bại"),
  });
};

// ============================================================
// SWAP workflow — admin (FAULT_REPORT lifecycle)
// ============================================================

export const useReplacementDevices = (
  query: ListReplacementDevicesQueryType,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.iotKitRequests.replacementDevices(query),
    queryFn: () => iotKitRequestService.listReplacementDevices(query),
    enabled,
    placeholderData: keepPreviousData,
  });

export const useScheduleSwap = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ScheduleSwapBodyType }) =>
      iotKitRequestService.scheduleSwap(id, body),
    onSuccess: async (_res, { id }) => {
      await qc.invalidateQueries({ queryKey: KIT_KEY });
      await qc.invalidateQueries({
        queryKey: QUERY_KEYS.iotKitRequests.detail(id),
      });
      // Replacement device reserved → list available cần refresh
      await qc.invalidateQueries({
        queryKey: ["iot-kit-requests", "replacement-devices"],
      });
      toast.success("Đã lên lịch thay thiết bị");
    },
    onError: (error) => onMutationError(error, "Lên lịch thay thất bại"),
  });
};

export const useCompleteSwap = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CompleteSwapBodyType }) =>
      iotKitRequestService.completeSwap(id, body),
    onSuccess: async (_res, { id }) => {
      await qc.invalidateQueries({ queryKey: KIT_KEY });
      await qc.invalidateQueries({
        queryKey: QUERY_KEYS.iotKitRequests.detail(id),
      });
      // BE swap board (old → revoked/available, new → inactive) — invalidate
      // device cache cả 3 role.
      for (const key of DEVICE_KEYS_ALL) {
        await qc.invalidateQueries({ queryKey: key });
      }
      await qc.invalidateQueries({
        queryKey: ["iot-kit-requests", "replacement-devices"],
      });
      toast.success("Đã hoàn tất thay thiết bị");
    },
    onError: (error) => onMutationError(error, "Hoàn tất thay thất bại"),
  });
};

// ── RECOVERY workflow — admin ─────────────────────────────────────────

export const useScheduleRecovery = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: ScheduleRecoveryBodyType;
    }) => iotKitRequestService.scheduleRecovery(id, body),
    onSuccess: async (_res, { id }) => {
      await qc.invalidateQueries({ queryKey: KIT_KEY });
      await qc.invalidateQueries({
        queryKey: QUERY_KEYS.iotKitRequests.detail(id),
      });
      toast.success("Đã lên lịch thu hồi");
    },
    onError: (error) => onMutationError(error, "Lên lịch thu hồi thất bại"),
  });
};

export const useCompleteRecovery = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: CompleteRecoveryBodyType;
    }) => iotKitRequestService.completeRecovery(id, body),
    onSuccess: async (_res, { id }) => {
      await qc.invalidateQueries({ queryKey: KIT_KEY });
      await qc.invalidateQueries({
        queryKey: QUERY_KEYS.iotKitRequests.detail(id),
      });
      // BE chưa flip device status ở phase 1 — không cần invalidate device cache
      toast.success("Đã hoàn tất thu hồi");
    },
    onError: (error) => onMutationError(error, "Hoàn tất thu hồi thất bại"),
  });
};

export const useScheduleInstall = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ScheduleInstallBodyType }) =>
      iotKitRequestService.scheduleInstall(id, body),
    onSuccess: async (_res, { id }) => {
      await qc.invalidateQueries({ queryKey: KIT_KEY });
      await qc.invalidateQueries({
        queryKey: QUERY_KEYS.iotKitRequests.detail(id),
      });
      toast.success("Đã lên lịch lắp đặt");
    },
    onError: (error) => onMutationError(error, "Lên lịch lắp đặt thất bại"),
  });
};

export const useReportOverdue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ReportOverdueBodyType }) =>
      iotKitRequestService.reportOverdue(id, body),
    onSuccess: async (_res, { id }) => {
      await qc.invalidateQueries({ queryKey: KIT_KEY });
      await qc.invalidateQueries({
        queryKey: QUERY_KEYS.iotKitRequests.detail(id),
      });
      toast.success("Đã báo quá hạn tới quản trị viên");
    },
    onError: (error) => onMutationError(error, "Báo quá hạn thất bại"),
  });
};

export const useCompleteInstall = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CompleteInstallBodyType }) =>
      iotKitRequestService.completeInstall(id, body),
    onSuccess: async (res, { id }) => {
      await qc.invalidateQueries({ queryKey: KIT_KEY });
      await qc.invalidateQueries({
        queryKey: QUERY_KEYS.iotKitRequests.detail(id),
      });
      // BE flip install → inactive — invalidate device cache 3 role
      for (const key of DEVICE_KEYS_ALL) {
        await qc.invalidateQueries({ queryKey: key });
      }
      toastBulkResult(res, "Đã báo lắp đặt hoàn tất");
    },
    onError: (error) => onMutationError(error, "Báo lắp đặt thất bại"),
  });
};
