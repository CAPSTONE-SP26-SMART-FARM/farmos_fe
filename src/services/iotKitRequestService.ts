import queryString from "query-string";
import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  CancelRequestBodyType,
  CompleteInstallBodyType,
  CompleteRecoveryBodyType,
  CompleteSwapBodyType,
  CreateFaultReportBodyType,
  KitInstallBulkResType,
  KitRequestDetailResType,
  KitRequestResType,
  ListKitRequestsQueryType,
  ListKitRequestsResType,
  ListReplacementDevicesQueryType,
  ListReplacementDevicesResType,
  RejectRequestBodyType,
  ResolveFaultBodyType,
  ScheduleRecoveryBodyType,
  ScheduleSwapBodyType,
} from "@/schemaValidatation/iotKitRequest";

/**
 * Service layer cho module `iot-kit-request`.
 *
 * Flow mới (2026-05-24): INSTALL_SCHEDULE auto-create khi owner approve season.
 * Admin chỉ có start-install + complete-install (bulk theo request scope).
 * Owner KHÔNG có endpoint action với INSTALL_SCHEDULE.
 */

const EP = API_ENDPOINTS.IOT_KIT_REQUEST;

const QS_OPTIONS: queryString.StringifyOptions = {
  skipEmptyString: true,
  skipNull: true,
};

const buildListUrl = (base: string, query: ListKitRequestsQueryType): string =>
  `${base}?${queryString.stringify({ ...query }, QS_OPTIONS)}`;

export const iotKitRequestService = {
  // ── FAULT_REPORT ────────────────────────────────────────────────────
  createFaultReport: (body: CreateFaultReportBodyType) =>
    api.post<KitRequestResType, CreateFaultReportBodyType>(
      EP.CREATE_FAULT_REPORT,
      body,
    ),

  claim: (id: string) =>
    api.post<KitRequestResType, Record<string, never>>(EP.CLAIM(id), {}),

  resolveFault: (id: string, body: ResolveFaultBodyType) =>
    api.post<KitRequestResType, ResolveFaultBodyType>(EP.RESOLVE(id), body),

  reject: (id: string, body: RejectRequestBodyType) =>
    api.post<KitRequestResType, RejectRequestBodyType>(EP.REJECT(id), body),

  // ── INSTALL_SCHEDULE — Admin bulk actions ───────────────────────────
  startInstall: (id: string) =>
    api.post<KitInstallBulkResType, Record<string, never>>(
      EP.START_INSTALL(id),
      {},
    ),

  completeInstall: (id: string, body: CompleteInstallBodyType) =>
    api.post<KitInstallBulkResType, CompleteInstallBodyType>(
      EP.COMPLETE_INSTALL(id),
      body,
    ),

  // ── SWAP workflow — admin (FAULT_REPORT) ────────────────────────────
  listReplacementDevices: (query: ListReplacementDevicesQueryType) =>
    api.get<ListReplacementDevicesResType>(
      `${EP.REPLACEMENT_DEVICES}?${queryString.stringify({ ...query }, QS_OPTIONS)}`,
    ),

  scheduleSwap: (id: string, body: ScheduleSwapBodyType) =>
    api.post<KitRequestResType, ScheduleSwapBodyType>(
      EP.SCHEDULE_SWAP(id),
      body,
    ),

  completeSwap: (id: string, body: CompleteSwapBodyType) =>
    api.post<KitRequestResType, CompleteSwapBodyType>(
      EP.COMPLETE_SWAP(id),
      body,
    ),

  // ── RECOVERY workflow — admin (RECOVERY_SCHEDULE) ───────────────────
  scheduleRecovery: (id: string, body: ScheduleRecoveryBodyType) =>
    api.post<KitRequestResType, ScheduleRecoveryBodyType>(
      EP.SCHEDULE_RECOVERY(id),
      body,
    ),

  completeRecovery: (id: string, body: CompleteRecoveryBodyType) =>
    api.post<KitRequestResType, CompleteRecoveryBodyType>(
      EP.COMPLETE_RECOVERY(id),
      body,
    ),

  // ── Shared ──────────────────────────────────────────────────────────
  listMy: (query: ListKitRequestsQueryType) =>
    api.get<ListKitRequestsResType>(buildListUrl(EP.LIST_MY, query)),

  listAdmin: (query: ListKitRequestsQueryType) =>
    api.get<ListKitRequestsResType>(buildListUrl(EP.LIST_ADMIN, query)),

  /** Detail trả thêm `devices[]` khi type=INSTALL_SCHEDULE. */
  detail: (id: string) => api.get<KitRequestDetailResType>(EP.DETAIL(id)),

  cancel: (id: string, body: CancelRequestBodyType) =>
    api.post<KitRequestResType, CancelRequestBodyType>(EP.CANCEL(id), body),
};
