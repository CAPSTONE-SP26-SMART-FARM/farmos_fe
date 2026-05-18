import queryString from "query-string";
import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  AdminSwapBoardBodyType,
  BulkActionResType,
  BulkSetStatusBodyType,
  DecisionContextResType,
  DeviceTimelineQueryType,
  DeviceTimelineResType,
  InstallMarkBlockedBodyType,
  InstallMarkBlockedResType,
  InstallQueueQueryType,
  InstallQueueResType,
  IotOverviewResType,
  OwnerOverviewResType,
  RecoveryBulkCompleteBodyType,
  RecoveryBulkCompleteResType,
  RecoveryQueueQueryType,
  RecoveryQueueResType,
} from "@/schemaValidatation/iotDeviceAdminOps";

const EP = API_ENDPOINTS.ADMIN.IOT_DEVICE;

const QS_OPTIONS: queryString.StringifyOptions = {
  skipEmptyString: true,
  skipNull: true,
};

export const iotDeviceAdminOpsService = {
  // A1
  getIotOverview: () => api.get<IotOverviewResType>(EP.IOT_OVERVIEW),

  // A2
  getDecisionContext: (deviceId: string) =>
    api.get<DecisionContextResType>(EP.DECISION_CONTEXT(deviceId)),

  // A3a
  getInstallQueue: (query?: InstallQueueQueryType) =>
    api.get<InstallQueueResType>(
      `${EP.INSTALL_QUEUE}?${queryString.stringify(query ?? {}, QS_OPTIONS)}`,
    ),

  // A3b
  bulkSetStatus: (body: BulkSetStatusBodyType) =>
    api.post<BulkActionResType, BulkSetStatusBodyType>(
      EP.BULK_SET_STATUS,
      body,
    ),

  // A4
  getOwnerOverview: (ownerId: string) =>
    api.get<OwnerOverviewResType>(EP.OWNER_OVERVIEW(ownerId)),

  // A5
  getDeviceTimeline: (deviceId: string, query?: DeviceTimelineQueryType) =>
    api.get<DeviceTimelineResType>(
      `${EP.TIMELINE(deviceId)}?${queryString.stringify(query ?? {}, QS_OPTIONS)}`,
    ),

  // Swap board (action từ A2 — POST)
  swapBoard: (body: AdminSwapBoardBodyType) =>
    api.post<unknown, AdminSwapBoardBodyType>(EP.SWAP, body),

  // A6 — Recovery queue
  getRecoveryQueue: (query?: RecoveryQueueQueryType) =>
    api.get<RecoveryQueueResType>(
      `${EP.RECOVERY_QUEUE}?${queryString.stringify(query ?? {}, QS_OPTIONS)}`,
    ),

  // A7 — Recovery bulk complete (2-outcome)
  recoveryBulkComplete: (body: RecoveryBulkCompleteBodyType) =>
    api.post<RecoveryBulkCompleteResType, RecoveryBulkCompleteBodyType>(
      EP.RECOVERY_BULK_COMPLETE,
      body,
    ),

  // A8 — Install mark blocked
  installMarkBlocked: (body: InstallMarkBlockedBodyType) =>
    api.post<InstallMarkBlockedResType, InstallMarkBlockedBodyType>(
      EP.INSTALL_MARK_BLOCKED,
      body,
    ),
};
