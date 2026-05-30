import { QUERY_KEYS } from "@/constants";
import {
  managerSensorService,
  milestoneIotDeviceService,
  milestoneSensorBindingService,
  ownerMilestoneIotDeviceService,
  ownerMilestoneSensorBindingService,
  ownerSensorService,
} from "@/services/milestoneIotDeviceService";
import { productionMilestoneService } from "@/services/productionMilestoneService";
import {
  ownerSensorThresholdService,
  sensorThresholdService,
} from "@/services/sensorThresholdService";
import type {
  CreateProductionMilestoneBatchBodyType,
  CreateProductionMilestoneItemBodyType,
  IotConfigPutBodyType,
  ListProductionMilestonesQueryType,
  UpdateProductionMilestoneBodyType,
} from "@/schemaValidatation/productionMilestone";
import type {
  AssignIotDeviceBodyType,
  BindSensorsBodyType,
  BulkAssignIotDevicesBodyType,
  ListAvailableIotDevicesQueryType,
  SearchMilestoneAssignmentsQueryType,
  UnassignIotDeviceBodyType,
  UnbindSensorsBodyType,
} from "@/schemaValidatation/milestoneIotDevice";
import type { UpsertSensorThresholdBodyType } from "@/schemaValidatation/sensorThreshold";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import type { ApiResponseType } from "@/types/api";
import { invalidateManagerEmployeeTasksQueriesForMilestone } from "@/queries/useEmployeeTask";

const invalidateAllManagerSensorThresholdQueries = (
  qc: ReturnType<typeof useQueryClient>,
) => {
  qc.invalidateQueries({
    predicate: (query) => {
      const k = query.queryKey;
      return (
        Array.isArray(k) &&
        k[0] === "manager" &&
        k[1] === "production-milestones" &&
        k[2] === "assignment" &&
        k[4] === "thresholds"
      );
    },
  });
};

// ============================================================
// Production Milestones
// ============================================================

export const useManagerListProductionMilestones = (
  cropSeasonId: string,
  query: ListProductionMilestonesQueryType,
) =>
  useQuery({
    queryKey: QUERY_KEYS.manager.productionMilestones.list(cropSeasonId, query),
    queryFn: () => productionMilestoneService.list(cropSeasonId, query),
    enabled: !!cropSeasonId,
  });

export const useManagerGetMilestoneDetail = (
  milestoneId: string,
  cropSeasonId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.manager.productionMilestones.detail(milestoneId),
    queryFn: () => productionMilestoneService.detail(milestoneId, cropSeasonId),
    enabled: !!milestoneId && !!cropSeasonId && enabled,
  });

export const useOwnerListProductionMilestones = (
  cropSeasonId: string,
  query: ListProductionMilestonesQueryType,
) =>
  useQuery({
    queryKey: QUERY_KEYS.owner.productionMilestones.list(cropSeasonId, query),
    queryFn: () =>
      productionMilestoneService.ownerListByCropSeason(cropSeasonId, query),
    enabled: !!cropSeasonId,
  });

export const useManagerCreateProductionMilestone = (cropSeasonId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProductionMilestoneItemBodyType) =>
      productionMilestoneService.createItem(cropSeasonId, body),
    onSuccess: () => {
      toast.success("Tạo milestone thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.manager.productionMilestones.list(cropSeasonId),
      });
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(error?.response?.data?.message ?? "Tạo milestone thất bại");
    },
  });
};

export const useManagerCreateProductionMilestoneBatch = (
  cropSeasonId: string,
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProductionMilestoneBatchBodyType) =>
      productionMilestoneService.createBatch(cropSeasonId, body),
    onSuccess: () => {
      toast.success("Tạo milestones thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.manager.productionMilestones.list(cropSeasonId),
      });
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(error?.response?.data?.message ?? "Tạo milestones thất bại");
    },
  });
};

type UpdateMilestoneMutationOptions = {
  silent?: boolean;
  invalidateOnSuccess?: boolean;
};

export const useManagerUpdateProductionMilestone = (
  cropSeasonId: string,
  options?: UpdateMilestoneMutationOptions,
) => {
  const qc = useQueryClient();
  const silent = options?.silent ?? false;
  const invalidateOnSuccess = options?.invalidateOnSuccess ?? true;

  return useMutation({
    mutationFn: ({
      milestoneId,
      body,
    }: {
      milestoneId: string;
      body: UpdateProductionMilestoneBodyType;
    }) => productionMilestoneService.update(milestoneId, cropSeasonId, body),
    onSuccess: (_res, { milestoneId, body }) => {
      if (!silent) {
        toast.success("Cập nhật milestone thành công!");
      }

      if (invalidateOnSuccess) {
        qc.invalidateQueries({
          queryKey: QUERY_KEYS.manager.productionMilestones.list(cropSeasonId),
        });
        qc.invalidateQueries({
          queryKey: QUERY_KEYS.manager.productionMilestones.detail(milestoneId),
        });
        // BE auto-completes cropSeason khi milestone cuối được set "completed".
        // Invalidate cropSeason cache để UI cập nhật status mới.
        if (body.status === "completed" || body.status === "in_progress") {
          qc.invalidateQueries({ queryKey: ["crop-seasons"] });
        }
      }
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      if (!silent) {
        toast.error(
          error?.response?.data?.message ?? "Cập nhật milestone thất bại",
        );
      }
    },
  });
};

export const useManagerDeleteProductionMilestone = (cropSeasonId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (milestoneId: string) =>
      productionMilestoneService.delete(milestoneId, cropSeasonId),
    onSuccess: (_res, milestoneId) => {
      toast.success("Xóa milestone thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.manager.productionMilestones.list(cropSeasonId),
      });
      qc.removeQueries({
        queryKey: QUERY_KEYS.manager.productionMilestones.detail(milestoneId),
      });
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(error?.response?.data?.message ?? "Xóa milestone thất bại");
    },
  });
};

// ============================================================
// IoT Device Assignment (#80)
// ============================================================

export const useManagerMilestoneAssignment = (
  milestoneId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.manager.productionMilestones.assignment(milestoneId),
    queryFn: () => milestoneIotDeviceService.getAssignment(milestoneId),
    enabled: !!milestoneId && enabled,
  });

export const useManagerListMilestoneAssignments = (
  milestoneId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.manager.productionMilestones.assignments(milestoneId),
    queryFn: () => milestoneIotDeviceService.listAssignments(milestoneId),
    enabled: !!milestoneId && enabled,
  });

export const useManagerSearchMilestoneAssignments = (
  milestoneId: string,
  query: SearchMilestoneAssignmentsQueryType,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.manager.productionMilestones.assignmentsSearch(
      milestoneId,
      query,
    ),
    queryFn: () =>
      milestoneIotDeviceService.searchAssignments(milestoneId, query),
    enabled: !!milestoneId && enabled,
  });

export const useManagerListAvailableIotDevices = (
  milestoneId: string,
  query: ListAvailableIotDevicesQueryType,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.manager.productionMilestones.availableDevices(
      milestoneId,
      query,
    ),
    queryFn: () => milestoneIotDeviceService.listAvailable(milestoneId, query),
    enabled: !!milestoneId && enabled,
  });

export const useManagerAssignIotDevice = (milestoneId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AssignIotDeviceBodyType) =>
      milestoneIotDeviceService.assign(milestoneId, body),
    onSuccess: () => {
      toast.success("Gán thiết bị IoT thành công!");
      qc.invalidateQueries({
        queryKey:
          QUERY_KEYS.manager.productionMilestones.assignment(milestoneId),
      });
      qc.invalidateQueries({
        queryKey:
          QUERY_KEYS.manager.productionMilestones.assignments(milestoneId),
      });
      qc.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey;
          return (
            Array.isArray(k) &&
            k[0] === "manager" &&
            k[1] === "production-milestones" &&
            k[2] === milestoneId &&
            k[3] === "assignments-search"
          );
        },
      });
      invalidateAllManagerSensorThresholdQueries(qc);
      invalidateManagerEmployeeTasksQueriesForMilestone(qc, milestoneId);
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(error?.response?.data?.message ?? "Gán thiết bị thất bại");
    },
  });
};

export const useManagerUnassignIotDevice = (milestoneId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UnassignIotDeviceBodyType) =>
      milestoneIotDeviceService.unassign(milestoneId, body),
    onSuccess: () => {
      toast.success("Gỡ thiết bị IoT thành công!");
      qc.invalidateQueries({
        queryKey:
          QUERY_KEYS.manager.productionMilestones.assignment(milestoneId),
      });
      qc.invalidateQueries({
        queryKey:
          QUERY_KEYS.manager.productionMilestones.assignments(milestoneId),
      });
      qc.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey;
          return (
            Array.isArray(k) &&
            k[0] === "manager" &&
            k[1] === "production-milestones" &&
            k[2] === milestoneId &&
            k[3] === "assignments-search"
          );
        },
      });
      invalidateAllManagerSensorThresholdQueries(qc);
      qc.invalidateQueries({
        queryKey: [
          "manager",
          "production-milestones",
          milestoneId,
          "available-devices",
        ],
      });
      qc.invalidateQueries({
        queryKey: [
          "manager",
          "production-milestones",
          milestoneId,
          "purchase-boards",
        ],
      });
      qc.invalidateQueries({
        queryKey: ["manager", "production-milestones", "assignment"],
      });
      invalidateManagerEmployeeTasksQueriesForMilestone(qc, milestoneId);
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(error?.response?.data?.message ?? "Gỡ thiết bị thất bại");
    },
  });
};

export const useOwnerMilestoneAssignment = (
  milestoneId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.owner.productionMilestones.assignment(milestoneId),
    queryFn: () => ownerMilestoneIotDeviceService.getAssignment(milestoneId),
    enabled: !!milestoneId && enabled,
  });

export const useOwnerListMilestoneAssignments = (
  milestoneId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.owner.productionMilestones.assignments(milestoneId),
    queryFn: () => ownerMilestoneIotDeviceService.listAssignments(milestoneId),
    enabled: !!milestoneId && enabled,
  });

export const useOwnerSearchMilestoneAssignments = (
  milestoneId: string,
  query: SearchMilestoneAssignmentsQueryType,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.owner.productionMilestones.assignmentsSearch(
      milestoneId,
      query,
    ),
    queryFn: () =>
      ownerMilestoneIotDeviceService.searchAssignments(milestoneId, query),
    enabled: !!milestoneId && enabled,
  });

export const useOwnerListAvailableIotDevices = (
  milestoneId: string,
  query: ListAvailableIotDevicesQueryType,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.owner.productionMilestones.availableDevices(
      milestoneId,
      query,
    ),
    queryFn: () =>
      ownerMilestoneIotDeviceService.listAvailable(milestoneId, query),
    enabled: !!milestoneId && enabled,
  });

export const useOwnerAssignIotDevice = (milestoneId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AssignIotDeviceBodyType) =>
      ownerMilestoneIotDeviceService.assign(milestoneId, body),
    onSuccess: () => {
      toast.success("Gán thiết bị IoT thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.owner.productionMilestones.assignment(milestoneId),
      });
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(error?.response?.data?.message ?? "Gán thiết bị thất bại");
    },
  });
};

export const useOwnerUnassignIotDevice = (milestoneId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UnassignIotDeviceBodyType) =>
      ownerMilestoneIotDeviceService.unassign(milestoneId, body),
    onSuccess: () => {
      toast.success("Gỡ thiết bị IoT thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.owner.productionMilestones.assignment(milestoneId),
      });
      qc.invalidateQueries({
        queryKey:
          QUERY_KEYS.owner.productionMilestones.assignments(milestoneId),
      });
      qc.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey;
          return (
            Array.isArray(k) &&
            k[0] === "owner" &&
            k[1] === "production-milestones" &&
            k[2] === milestoneId &&
            k[3] === "assignments-search"
          );
        },
      });
      qc.invalidateQueries({
        queryKey: [
          "owner",
          "production-milestones",
          milestoneId,
          "available-devices",
        ],
      });
      qc.invalidateQueries({
        queryKey: [
          "owner",
          "production-milestones",
          milestoneId,
          "purchase-boards",
        ],
      });
      qc.invalidateQueries({
        queryKey: ["owner", "production-milestones", "assignment"],
      });
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(error?.response?.data?.message ?? "Gỡ thiết bị thất bại");
    },
  });
};

// ============================================================
// Sensor List for IoT Device (manager)
// ============================================================

export const useManagerListSensorsForDevice = (
  iotDeviceId: string | undefined,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.manager.sensors.list(iotDeviceId ?? ""),
    queryFn: () => managerSensorService.list(iotDeviceId!),
    enabled: !!iotDeviceId && enabled,
  });

export const useOwnerListSensorsForDevice = (
  iotDeviceId: string | undefined,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.owner.sensors.list(iotDeviceId ?? ""),
    queryFn: () => ownerSensorService.list(iotDeviceId!),
    enabled: !!iotDeviceId && enabled,
  });

// ============================================================
// Sensor Binding (#81)
// ============================================================

export const useManagerListBoundSensors = (
  assignmentId: string,
  enabled = true,
) =>
  useQuery({
    queryKey:
      QUERY_KEYS.manager.productionMilestones.boundSensors(assignmentId),
    queryFn: () => milestoneSensorBindingService.listBound(assignmentId),
    enabled: !!assignmentId && enabled,
  });

export const useManagerBindSensors = (assignmentId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BindSensorsBodyType) =>
      milestoneSensorBindingService.bind(assignmentId, body),
    onSuccess: () => {
      toast.success("Bind sensor thành công!");
      qc.invalidateQueries({
        queryKey:
          QUERY_KEYS.manager.productionMilestones.boundSensors(assignmentId),
      });
      qc.invalidateQueries({
        queryKey:
          QUERY_KEYS.manager.productionMilestones.thresholds(assignmentId),
      });
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(error?.response?.data?.message ?? "Bind sensor thất bại");
    },
  });
};

export const useManagerUnbindSensors = (assignmentId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UnbindSensorsBodyType) =>
      milestoneSensorBindingService.unbind(assignmentId, body),
    onSuccess: () => {
      toast.success("Unbind sensor thành công!");
      qc.invalidateQueries({
        queryKey:
          QUERY_KEYS.manager.productionMilestones.boundSensors(assignmentId),
      });
      qc.invalidateQueries({
        queryKey:
          QUERY_KEYS.manager.productionMilestones.thresholds(assignmentId),
      });
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(error?.response?.data?.message ?? "Unbind sensor thất bại");
    },
  });
};

export const useOwnerListBoundSensors = (
  assignmentId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.owner.productionMilestones.boundSensors(assignmentId),
    queryFn: () => ownerMilestoneSensorBindingService.listBound(assignmentId),
    enabled: !!assignmentId && enabled,
  });

export const useOwnerBindSensors = (assignmentId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BindSensorsBodyType) =>
      ownerMilestoneSensorBindingService.bind(assignmentId, body),
    onSuccess: () => {
      toast.success("Bind sensor thành công!");
      qc.invalidateQueries({
        queryKey:
          QUERY_KEYS.owner.productionMilestones.boundSensors(assignmentId),
      });
      qc.invalidateQueries({
        queryKey:
          QUERY_KEYS.owner.productionMilestones.thresholds(assignmentId),
      });
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(error?.response?.data?.message ?? "Bind sensor thất bại");
    },
  });
};

export const useOwnerUnbindSensors = (assignmentId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UnbindSensorsBodyType) =>
      ownerMilestoneSensorBindingService.unbind(assignmentId, body),
    onSuccess: () => {
      toast.success("Unbind sensor thành công!");
      qc.invalidateQueries({
        queryKey:
          QUERY_KEYS.owner.productionMilestones.boundSensors(assignmentId),
      });
      qc.invalidateQueries({
        queryKey:
          QUERY_KEYS.owner.productionMilestones.thresholds(assignmentId),
      });
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(error?.response?.data?.message ?? "Unbind sensor thất bại");
    },
  });
};

// ============================================================
// Sensor Threshold (#82)
// ============================================================

export const useManagerSensorThresholds = (
  assignmentId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.manager.productionMilestones.thresholds(assignmentId),
    queryFn: () => sensorThresholdService.get(assignmentId),
    enabled: !!assignmentId && enabled,
  });

export const useManagerUpsertSensorThreshold = (
  assignmentId: string,
  options?: { invalidateMilestoneId?: string },
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      isUpdate,
    }: {
      body: UpsertSensorThresholdBodyType;
      isUpdate?: boolean;
    }) =>
      isUpdate
        ? sensorThresholdService.update(assignmentId, body)
        : sensorThresholdService.create(assignmentId, body),
    onSuccess: () => {
      toast.success("Đã lưu ngưỡng");
      qc.invalidateQueries({
        queryKey:
          QUERY_KEYS.manager.productionMilestones.thresholds(assignmentId),
      });
      const msId = options?.invalidateMilestoneId;
      if (msId) {
        qc.invalidateQueries({
          queryKey:
            QUERY_KEYS.manager.productionMilestones.assignments(msId),
        });
        invalidateManagerEmployeeTasksQueriesForMilestone(qc, msId);
      }
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(
        error?.response?.data?.message ?? "Không lưu được ngưỡng",
      );
    },
  });
};

export const useOwnerSensorThresholds = (
  assignmentId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.owner.productionMilestones.thresholds(assignmentId),
    queryFn: () => ownerSensorThresholdService.get(assignmentId),
    enabled: !!assignmentId && enabled,
  });

export const useOwnerUpsertSensorThreshold = (
  assignmentId: string,
  options?: { invalidateMilestoneId?: string },
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      isUpdate,
    }: {
      body: UpsertSensorThresholdBodyType;
      isUpdate?: boolean;
    }) =>
      isUpdate
        ? ownerSensorThresholdService.update(assignmentId, body)
        : ownerSensorThresholdService.create(assignmentId, body),
    onSuccess: () => {
      toast.success("Đã lưu ngưỡng");
      qc.invalidateQueries({
        queryKey:
          QUERY_KEYS.owner.productionMilestones.thresholds(assignmentId),
      });
      const msId = options?.invalidateMilestoneId;
      if (msId) {
        qc.invalidateQueries({
          queryKey: QUERY_KEYS.owner.productionMilestones.assignments(msId),
        });
      }
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(
        error?.response?.data?.message ?? "Không lưu được ngưỡng",
      );
    },
  });
};

// ============================================================
// IoT Config (per-milestone)
// ============================================================

export const useManagerIotConfig = (
  cropSeasonId: string,
  milestoneId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.manager.productionMilestones.iotConfig(
      cropSeasonId,
      milestoneId,
    ),
    queryFn: () =>
      productionMilestoneService.getIotConfig(cropSeasonId, milestoneId),
    enabled: !!cropSeasonId && !!milestoneId && enabled,
  });

export const useManagerUpdateIotConfig = (
  cropSeasonId: string,
  milestoneId: string,
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: IotConfigPutBodyType) =>
      productionMilestoneService.updateIotConfig(
        cropSeasonId,
        milestoneId,
        body,
      ),
    onSuccess: () => {
      toast.success("Đã lưu cấu hình IoT");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.manager.productionMilestones.iotConfig(
          cropSeasonId,
          milestoneId,
        ),
      });
      // Sensor binding may be regenerated when sensorTypes change in planning.
      // Invalidate the LIST query (plural) that Step 1 threshold panel consumes
      // via useManagerListMilestoneAssignments. Singular `assignment(id)` is a
      // different key (detail of one assignment) and was a stale typo here.
      qc.invalidateQueries({
        queryKey:
          QUERY_KEYS.manager.productionMilestones.assignments(milestoneId),
      });
      invalidateAllManagerSensorThresholdQueries(qc);
      invalidateManagerEmployeeTasksQueriesForMilestone(qc, milestoneId);
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(
        error?.response?.data?.message ?? "Lưu cấu hình IoT thất bại",
      );
    },
  });
};

export const useOwnerIotConfig = (
  cropSeasonId: string,
  milestoneId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.owner.productionMilestones.iotConfig(
      cropSeasonId,
      milestoneId,
    ),
    queryFn: () =>
      productionMilestoneService.ownerGetIotConfig(cropSeasonId, milestoneId),
    enabled: !!cropSeasonId && !!milestoneId && enabled,
  });

export const useOwnerUpdateIotConfig = (
  cropSeasonId: string,
  milestoneId: string,
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: IotConfigPutBodyType) =>
      productionMilestoneService.ownerUpdateIotConfig(
        cropSeasonId,
        milestoneId,
        body,
      ),
    onSuccess: () => {
      toast.success("Đã lưu cấu hình IoT");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.owner.productionMilestones.iotConfig(
          cropSeasonId,
          milestoneId,
        ),
      });
      qc.invalidateQueries({
        queryKey:
          QUERY_KEYS.owner.productionMilestones.assignment(milestoneId),
      });
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(
        error?.response?.data?.message ?? "Lưu cấu hình IoT thất bại",
      );
    },
  });
};

// ============================================================
// Purchase Boards listing (eligible for bulk assign)
// ============================================================

export const useManagerListPurchaseBoards = (
  milestoneId: string,
  query: ListAvailableIotDevicesQueryType,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.manager.productionMilestones.purchaseBoards(
      milestoneId,
      query,
    ),
    queryFn: () =>
      milestoneIotDeviceService.listPurchaseBoards(milestoneId, query),
    enabled: !!milestoneId && enabled,
  });

export const useOwnerListPurchaseBoards = (
  milestoneId: string,
  query: ListAvailableIotDevicesQueryType,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.owner.productionMilestones.purchaseBoards(
      milestoneId,
      query,
    ),
    queryFn: () =>
      ownerMilestoneIotDeviceService.listPurchaseBoards(milestoneId, query),
    enabled: !!milestoneId && enabled,
  });

// ============================================================
// Previous milestone IoT assignments (cross-milestone pre-select)
// ============================================================

export const useManagerListPreviousAssignments = (
  milestoneId: string,
  query: ListAvailableIotDevicesQueryType,
  enabled = true,
) =>
  useQuery({
    queryKey: [
      ...QUERY_KEYS.manager.productionMilestones.previousAssignments(
        milestoneId,
      ),
      query,
    ],
    queryFn: () =>
      milestoneIotDeviceService.listPreviousAssignments(milestoneId, query),
    enabled: !!milestoneId && enabled,
    placeholderData: keepPreviousData,
  });

export const useOwnerListPreviousAssignments = (
  milestoneId: string,
  query: ListAvailableIotDevicesQueryType,
  enabled = true,
) =>
  useQuery({
    queryKey: [
      ...QUERY_KEYS.owner.productionMilestones.previousAssignments(milestoneId),
      query,
    ],
    queryFn: () =>
      ownerMilestoneIotDeviceService.listPreviousAssignments(milestoneId, query),
    enabled: !!milestoneId && enabled,
    placeholderData: keepPreviousData,
  });

// ============================================================
// Bulk Assign IoT Devices
// ============================================================

export const useManagerBulkAssignIotDevices = (milestoneId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BulkAssignIotDevicesBodyType) =>
      milestoneIotDeviceService.bulkAssign(milestoneId, body),
    onSuccess: (res) => {
      const summary = res?.data?.summary;
      if (summary && summary.failed > 0) {
        toast.warning(
          `Đã gán ${summary.succeeded}/${summary.attempted} thiết bị (${summary.failed} thất bại)`,
        );
      } else if (summary) {
        toast.success(`Đã gán ${summary.succeeded} thiết bị`);
      } else {
        toast.success("Bulk assign thành công");
      }
      qc.invalidateQueries({
        queryKey:
          QUERY_KEYS.manager.productionMilestones.assignment(milestoneId),
      });
      qc.invalidateQueries({
        queryKey:
          QUERY_KEYS.manager.productionMilestones.assignments(milestoneId),
      });
      qc.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey;
          return (
            Array.isArray(k) &&
            k[0] === "manager" &&
            k[1] === "production-milestones" &&
            k[2] === milestoneId &&
            k[3] === "assignments-search"
          );
        },
      });
      qc.invalidateQueries({
        queryKey: [
          "manager",
          "production-milestones",
          milestoneId,
          "purchase-boards",
        ],
      });
      qc.invalidateQueries({
        queryKey: [
          "manager",
          "production-milestones",
          milestoneId,
          "available-devices",
        ],
      });
      invalidateAllManagerSensorThresholdQueries(qc);
      invalidateManagerEmployeeTasksQueriesForMilestone(qc, milestoneId);
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(
        error?.response?.data?.message ?? "Bulk assign thiết bị thất bại",
      );
    },
  });
};

export const useOwnerBulkAssignIotDevices = (milestoneId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BulkAssignIotDevicesBodyType) =>
      ownerMilestoneIotDeviceService.bulkAssign(milestoneId, body),
    onSuccess: (res) => {
      const summary = res?.data?.summary;
      if (summary && summary.failed > 0) {
        toast.warning(
          `Đã gán ${summary.succeeded}/${summary.attempted} thiết bị (${summary.failed} thất bại)`,
        );
      } else if (summary) {
        toast.success(`Đã gán ${summary.succeeded} thiết bị`);
      } else {
        toast.success("Bulk assign thành công");
      }
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.owner.productionMilestones.assignment(milestoneId),
      });
      qc.invalidateQueries({
        queryKey:
          QUERY_KEYS.owner.productionMilestones.assignments(milestoneId),
      });
      qc.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey;
          return (
            Array.isArray(k) &&
            k[0] === "owner" &&
            k[1] === "production-milestones" &&
            k[2] === milestoneId &&
            k[3] === "assignments-search"
          );
        },
      });
      qc.invalidateQueries({
        queryKey: [
          "owner",
          "production-milestones",
          milestoneId,
          "purchase-boards",
        ],
      });
      qc.invalidateQueries({
        queryKey: [
          "owner",
          "production-milestones",
          milestoneId,
          "available-devices",
        ],
      });
    },
    onError: (error: AxiosError<ApiResponseType>) => {
      toast.error(
        error?.response?.data?.message ?? "Bulk assign thiết bị thất bại",
      );
    },
  });
};
