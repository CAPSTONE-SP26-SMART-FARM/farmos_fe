import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  AvailableSlotsResType,
  CreateIotKitBodyType,
  IotDeviceKitResType,
  IotKitOrderPaymentStatusResType,
  IotQuotaResType,
  ListIotDeviceKitsResType,
  ListIotKitsQueryType,
  PurchaseIotKitBodyType,
  PurchaseIotKitResType,
  UpdateIotKitBodyType,
} from "@/schemaValidatation/iotKit";
import queryString from "query-string";

const E = API_ENDPOINTS.IOT_KITS;

export const adminIotKitService = {
  list: (query: ListIotKitsQueryType) =>
    api.get<ListIotDeviceKitsResType>(
      `${E.ADMIN_LIST}?${queryString.stringify(query, {
        skipNull: true,
        skipEmptyString: true,
      })}`,
    ),

  detail: (id: string) =>
    api.get<IotDeviceKitResType>(E.ADMIN_DETAIL(id)),

  create: (data: CreateIotKitBodyType) =>
    api.post<IotDeviceKitResType, CreateIotKitBodyType>(E.ADMIN_CREATE, data),

  update: (id: string, data: UpdateIotKitBodyType) =>
    api.patch<IotDeviceKitResType, UpdateIotKitBodyType>(
      E.ADMIN_UPDATE(id),
      data,
    ),

  archive: (id: string) =>
    api.patch<IotDeviceKitResType>(E.ADMIN_ARCHIVE(id)),

  unarchive: (id: string) =>
    api.patch<IotDeviceKitResType>(E.ADMIN_UNARCHIVE(id)),

  // BE B10 hiện đang comment — gọi sẽ trả 404. Hook xử lý fallback.
  availableSlots: (ownerId: string) =>
    api.get<AvailableSlotsResType>(
      `${E.ADMIN_AVAILABLE_SLOTS}?${queryString.stringify({ ownerId })}`,
    ),
};

export const ownerIotKitService = {
  list: (query: ListIotKitsQueryType) =>
    api.get<ListIotDeviceKitsResType>(
      `${E.OWNER_LIST}?${queryString.stringify(query, {
        skipNull: true,
        skipEmptyString: true,
      })}`,
    ),

  detail: (id: string) =>
    api.get<IotDeviceKitResType>(E.OWNER_DETAIL(id)),

  purchase: (id: string, data: PurchaseIotKitBodyType) =>
    api.post<PurchaseIotKitResType, PurchaseIotKitBodyType>(
      E.OWNER_PURCHASE(id),
      data,
    ),

  paymentStatus: (orderId: string) =>
    api.get<IotKitOrderPaymentStatusResType>(E.OWNER_PAYMENT_STATUS(orderId)),

  myQuota: () => api.get<IotQuotaResType>(E.OWNER_MY_QUOTA),
};
