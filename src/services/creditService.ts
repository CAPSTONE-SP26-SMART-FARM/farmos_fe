import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  CreateServicePackageBodyType,
  CreditHistoryQueryType,
  ListCreditHistoryResType,
  ListServicePackagesQueryType,
  ListServicePackagesResType,
  OwnerCreditsResType,
  PurchaseCreditResType,
  ServicePackagePaymentStatusResType,
  ServicePackageType,
  UpdateServicePackageBodyType,
} from "@/schemaValidatation/credit";
import queryString from "query-string";

const CREDITS = API_ENDPOINTS.CREDITS;
const SERVICE_PACKAGES = API_ENDPOINTS.SERVICE_PACKAGES;

const creditService = {
  getMyCredits: () => api.get<OwnerCreditsResType>(CREDITS.MY),

  getMyCreditHistory: (query: CreditHistoryQueryType) =>
    api.get<ListCreditHistoryResType>(
      `${CREDITS.MY_HISTORY}?${queryString.stringify({ ...query })}`,
    ),

  listServicePackages: (query: ListServicePackagesQueryType) =>
    api.get<ListServicePackagesResType>(
      `${SERVICE_PACKAGES.BASE}?${queryString.stringify({ ...query })}`,
    ),

  getServicePackageDetail: (id: string) =>
    api.get<ServicePackageType>(SERVICE_PACKAGES.BY_ID(id)),

  purchaseServicePackage: (id: string) =>
    api.post<PurchaseCreditResType>(SERVICE_PACKAGES.PURCHASE(id)),

  getServicePackagePaymentStatus: (id: string) =>
    api.get<ServicePackagePaymentStatusResType>(
      SERVICE_PACKAGES.PAYMENT_STATUS(id),
    ),

  createServicePackage: (body: CreateServicePackageBodyType) =>
    api.post<ServicePackageType, CreateServicePackageBodyType>(
      SERVICE_PACKAGES.BASE,
      body,
    ),

  updateServicePackage: (id: string, body: UpdateServicePackageBodyType) =>
    api.patch<ServicePackageType, UpdateServicePackageBodyType>(
      SERVICE_PACKAGES.BY_ID(id),
      body,
    ),

  archiveServicePackage: (id: string) =>
    api.patch<ServicePackageType, undefined>(SERVICE_PACKAGES.ARCHIVE(id)),

  unarchiveServicePackage: (id: string) =>
    api.patch<ServicePackageType, undefined>(SERVICE_PACKAGES.UNARCHIVE(id)),
};

export default creditService;
