import { QUERY_KEYS } from "@/constants";
import type {
  CreateIotKitBodyType,
  ListIotKitsQueryType,
  PurchaseIotKitBodyType,
  UpdateIotKitBodyType,
} from "@/schemaValidatation/iotKit";
import {
  adminIotKitService,
  ownerIotKitService,
} from "@/services/iotKitService";
import { isApiErrorResponse } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ============================================================
// Admin queries
// ============================================================
export const useAdminIotKits = (
  query: ListIotKitsQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.iotKits.adminList(query),
    queryFn: () => adminIotKitService.list(query),
    enabled,
  });
};

export const useAdminIotKitDetail = (id: string, enabled: boolean) => {
  return useQuery({
    queryKey: QUERY_KEYS.iotKits.adminDetail(id),
    queryFn: () => adminIotKitService.detail(id),
    enabled,
  });
};

export const useAdminCreateIotKit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateIotKitBodyType) => adminIotKitService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.iotKits.all });
    },
  });
};

export const useAdminUpdateIotKit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIotKitBodyType }) =>
      adminIotKitService.update(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.iotKits.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.iotKits.adminDetail(variables.id),
      });
    },
  });
};

export const useAdminArchiveIotKit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminIotKitService.archive(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.iotKits.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.iotKits.adminDetail(id),
      });
    },
  });
};

export const useAdminUnarchiveIotKit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminIotKitService.unarchive(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.iotKits.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.iotKits.adminDetail(id),
      });
    },
  });
};

/**
 * BE B10 hiện đang comment. Hook tự catch 404 và trả `{ data: { data: [] } }`
 * để UI có thể hiển thị fallback (input UUID thủ công) thay vì crash.
 */
export const useIotKitAvailableSlots = (ownerId: string, enabled: boolean) => {
  return useQuery({
    queryKey: QUERY_KEYS.iotKits.availableSlots(ownerId),
    queryFn: async () => {
      try {
        return await adminIotKitService.availableSlots(ownerId);
      } catch (error) {
        if (isApiErrorResponse(error) && error.response?.status === 404) {
          return {
            statusCode: 200,
            message: "Available slots endpoint not yet enabled",
            data: { data: [] },
          };
        }
        throw error;
      }
    },
    enabled,
  });
};

// ============================================================
// Owner queries
// ============================================================
export const useOwnerIotKits = (
  query: ListIotKitsQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.iotKits.ownerList(query),
    queryFn: () => ownerIotKitService.list(query),
    enabled,
  });
};

export const useOwnerIotKitDetail = (id: string, enabled: boolean) => {
  return useQuery({
    queryKey: QUERY_KEYS.iotKits.ownerDetail(id),
    queryFn: () => ownerIotKitService.detail(id),
    enabled,
  });
};

export const useOwnerPurchaseIotKit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PurchaseIotKitBodyType }) =>
      ownerIotKitService.purchase(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.iotKits.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices.all });
    },
  });
};

export const useIotKitOrderPaymentStatus = (
  orderId: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.iotKits.paymentStatus(orderId),
    queryFn: () => ownerIotKitService.paymentStatus(orderId),
    enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.orderStatus;
      if (!status || status === "PENDING") {
        return 3000;
      }
      return false;
    },
  });
};

/**
 * Owner without active subscription → BE returns 422 OwnerNoActiveSubscription.
 * Hook lets that propagate; widget catches and shows EmptyState.
 */
export const useMyIotQuota = (enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.iotKits.myQuota(),
    queryFn: () => ownerIotKitService.myQuota(),
    enabled,
    retry: false,
  });
};
