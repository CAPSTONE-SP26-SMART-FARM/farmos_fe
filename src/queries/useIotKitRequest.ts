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
  CreateFaultReportBodyType,
  KitInstallBulkResType,
  ListKitRequestsQueryType,
  RejectRequestBodyType,
  ResolveFaultBodyType,
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
