import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  CheckoutBodyType,
  CheckoutResType,
  InvoiceDetailResType,
  ListInvoicesQueryType,
  ListInvoicesResType,
  PaymentStatusResType,
  TransactionType,
} from "@/schemaValidatation/invoice";
import queryString from "query-string";

const INVOICES = API_ENDPOINTS.INVOICES;
const TRANSACTIONS = API_ENDPOINTS.TRANSACTIONS;
const SUBSCRIPTIONS = API_ENDPOINTS.SUBSCRIPTIONS;

const invoiceService = {
  listAllInvoices: (query: ListInvoicesQueryType) =>
    api.get<ListInvoicesResType>(
      `${INVOICES.BASE}?${queryString.stringify({ ...query })}`,
    ),

  listMyInvoices: (query: ListInvoicesQueryType) =>
    api.get<ListInvoicesResType>(
      `${INVOICES.MY}?${queryString.stringify({ ...query })}`,
    ),

  getInvoiceDetail: (id: string) =>
    api.get<InvoiceDetailResType>(INVOICES.BY_ID(id)),

  checkoutInvoice: (id: string, data: CheckoutBodyType = { gateway: "PAYOS" }) =>
    api.post<CheckoutResType, CheckoutBodyType>(INVOICES.CHECKOUT(id), data),

  getTransactionDetail: (id: string) =>
    api.get<TransactionType>(TRANSACTIONS.BY_ID(id)),

  getSubscriptionPaymentStatus: (subscriptionId: string) =>
    api.get<PaymentStatusResType>(SUBSCRIPTIONS.PAYMENT_STATUS(subscriptionId)),
};

export default invoiceService;
