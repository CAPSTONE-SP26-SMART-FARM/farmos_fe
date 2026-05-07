import { QUERY_KEYS } from "@/constants";
import type {
  CreateServicePackageBodyType,
  CreditHistoryQueryType,
  ListServicePackagesQueryType,
  UpdateServicePackageBodyType,
} from "@/schemaValidatation/credit";
import creditService from "@/services/creditService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useOwnerCredits = (enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.credits.my(),
    queryFn: () => creditService.getMyCredits(),
    enabled,
  });
};

export const useOwnerCreditHistory = (
  query: CreditHistoryQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.credits.myHistory(query),
    queryFn: () => creditService.getMyCreditHistory(query),
    enabled,
  });
};

export const useServicePackages = (
  query: ListServicePackagesQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.servicePackages.list(query),
    queryFn: () => creditService.listServicePackages(query),
    enabled,
  });
};

export const usePurchaseServicePackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => creditService.purchaseServicePackage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.servicePackages.all,
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.credits.all });
    },
  });
};

export const useCreateServicePackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateServicePackageBodyType) =>
      creditService.createServicePackage(body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.servicePackages.all,
      });
    },
  });
};

export const useUpdateServicePackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdateServicePackageBodyType;
    }) => creditService.updateServicePackage(id, body),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.servicePackages.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.servicePackages.detail(variables.id),
      });
    },
  });
};

export const useArchiveServicePackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => creditService.archiveServicePackage(id),
    onSuccess: (_res, id) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.servicePackages.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.servicePackages.detail(id),
      });
    },
  });
};

export const useUnarchiveServicePackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => creditService.unarchiveServicePackage(id),
    onSuccess: (_res, id) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.servicePackages.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.servicePackages.detail(id),
      });
    },
  });
};

export const useServicePackagePaymentStatus = (
  packageId: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.servicePackages.paymentStatus(packageId),
    queryFn: () => creditService.getServicePackagePaymentStatus(packageId),
    enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.latestTransaction?.status;
      if (!status || status === "PENDING") {
        return 3000;
      }
      return false;
    },
  });
};
