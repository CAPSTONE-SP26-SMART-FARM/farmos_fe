import { QUERY_KEYS } from "@/constants";
import type {
  CheckoutBodyType,
  ListInvoicesQueryType,
} from "@/schemaValidatation/invoice";
import invoiceService from "@/services/invoiceService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useOwnerInvoices = (
  query: ListInvoicesQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.invoices.listMy(query),
    queryFn: () => invoiceService.listMyInvoices(query),
    enabled,
  });
};

export const useAdminInvoices = (
  query: ListInvoicesQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.invoices.listMy(query), "admin"],
    queryFn: () => invoiceService.listAllInvoices(query),
    enabled,
  });
};

export const useInvoiceDetail = (id: string, enabled: boolean) => {
  return useQuery({
    queryKey: QUERY_KEYS.invoices.detail(id),
    queryFn: () => invoiceService.getInvoiceDetail(id),
    enabled,
  });
};

export const useSubscriptionPaymentStatus = (
  subscriptionId: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.subscriptions.paymentStatus(subscriptionId),
    queryFn: () => invoiceService.getSubscriptionPaymentStatus(subscriptionId),
    enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.subscriptionStatus;
      if (!status || status === "PENDING") {
        return 3000;
      }
      return false;
    },
  });
};

export const useInvoiceCheckout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: CheckoutBodyType }) =>
      invoiceService.checkoutInvoice(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.invoices.detail(variables.id),
      });
    },
  });
};
