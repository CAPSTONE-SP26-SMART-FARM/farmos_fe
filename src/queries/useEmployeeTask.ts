import { QUERY_KEYS } from "@/constants";
import {
  managerEmployeeTaskService,
  ownerEmployeeTaskService,
} from "@/services/employeeTaskService";
import type {
  AssignFarmerToTaskBodyType,
  CreateEmployeeTaskBatchBodyType,
  ListEmployeeTasksQueryType,
  ListTasksWithContextQueryType,
  UpdateEmployeeTaskBodyType,
} from "@/schemaValidatation/employeeTask";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { onMutationError } from "@/lib/axios";

export function invalidateManagerEmployeeTasksQueriesForMilestone(
  qc: QueryClient,
  milestoneId: string,
) {
  const predicate = (query: { queryKey: unknown }) => {
    const k = query.queryKey as unknown;
    return (
      Array.isArray(k) &&
      k[0] === "manager" &&
      k[1] === "employee-tasks" &&
      (k[2] === milestoneId || k[3] === milestoneId)
    );
  };
  qc.invalidateQueries({ predicate });
  // Force refetch for active queries to avoid "still cached" UX.
  qc.refetchQueries({ predicate, type: "active" });
}

// ============================================================
// Manager
// ============================================================

// ── List ───────────────────────────────────────────────────────────────

export const useManagerListEmployeeTasks = (
  milestoneId: string,
  query: ListEmployeeTasksQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.manager.employeeTasks.list(milestoneId, query),
    queryFn: () => managerEmployeeTaskService.list(milestoneId, query),
    enabled,
  });
};

// ── Detail ─────────────────────────────────────────────────────────────

export const useManagerEmployeeTaskDetail = (
  taskId: string,
  milestoneId: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.manager.employeeTasks.detail(taskId, milestoneId),
    queryFn: () => managerEmployeeTaskService.detail(taskId, milestoneId),
    enabled,
  });
};

// ── Create Batch ───────────────────────────────────────────────────────

export const useManagerCreateEmployeeTaskBatch = (milestoneId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateEmployeeTaskBatchBodyType) =>
      managerEmployeeTaskService.createBatch(milestoneId, body),
    onSuccess: () => {
      toast.success("Tạo nhiệm vụ thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.manager.employeeTasks.list(milestoneId),
      });
    },
    onError: (error) => onMutationError(error, "Tạo nhiệm vụ thất bại"),
  });
};

// ── Update ─────────────────────────────────────────────────────────────

export const useManagerUpdateEmployeeTask = (milestoneId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      body,
    }: {
      taskId: string;
      body: UpdateEmployeeTaskBodyType;
    }) => managerEmployeeTaskService.update(taskId, milestoneId, body),
    onSuccess: (_res, { taskId }) => {
      toast.success("Cập nhật nhiệm vụ thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.manager.employeeTasks.list(milestoneId),
      });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.manager.employeeTasks.detail(taskId, milestoneId),
      });
    },
    onError: (error) => onMutationError(error, "Cập nhật nhiệm vụ thất bại"),
  });
};

// ── Delete ─────────────────────────────────────────────────────────────

export const useManagerDeleteEmployeeTask = (milestoneId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      managerEmployeeTaskService.delete(taskId, milestoneId),
    onSuccess: (_res, taskId) => {
      toast.success("Xóa nhiệm vụ thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.manager.employeeTasks.list(milestoneId),
      });
      qc.removeQueries({
        queryKey: QUERY_KEYS.manager.employeeTasks.detail(taskId, milestoneId),
      });
    },
    onError: (error) => onMutationError(error, "Xóa nhiệm vụ thất bại"),
  });
};

// ── Assign Farmer ──────────────────────────────────────────────────────

export const useManagerAssignFarmerToTask = (milestoneId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      body,
    }: {
      taskId: string;
      body: AssignFarmerToTaskBodyType;
    }) => managerEmployeeTaskService.assign(taskId, milestoneId, body),
    onSuccess: (_res, { taskId }) => {
      toast.success("Gán nông dân thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.manager.employeeTasks.list(milestoneId),
      });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.manager.employeeTasks.detail(taskId, milestoneId),
      });
    },
    onError: (error) => onMutationError(error, "Gán nông dân thất bại"),
  });
};

// ── Unassign Farmer ────────────────────────────────────────────────────

export const useManagerUnassignFarmerFromTask = (milestoneId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      managerEmployeeTaskService.unassign(taskId, milestoneId),
    onSuccess: (_res, taskId) => {
      toast.success("Hủy gán nông dân thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.manager.employeeTasks.list(milestoneId),
      });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.manager.employeeTasks.detail(taskId, milestoneId),
      });
    },
    onError: (error) => onMutationError(error, "Hủy gán nông dân thất bại"),
  });
};

// ── Bulk operations ────────────────────────────────────────────────────
// Run single-task endpoints in parallel (BE has no bulk endpoint yet).
// Aggregate result and invalidate once to avoid N toasts / refetches.

type BulkResult = { ok: number; fail: number };

const summarizeBulk = (
  results: PromiseSettledResult<unknown>[],
  successLabel: string,
  failLabel: string,
): BulkResult => {
  const ok = results.filter((r) => r.status === "fulfilled").length;
  const fail = results.length - ok;
  if (fail === 0) toast.success(`${successLabel} ${ok} nhiệm vụ`);
  else if (ok === 0) toast.error(`${failLabel} ${fail} nhiệm vụ, mời thử lại`);
  else toast.warning(`${successLabel} ${ok} nhiệm vụ, ${fail} thất bại`);
  return { ok, fail };
};

export const useManagerBulkDeleteEmployeeTasks = (milestoneId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskIds: string[]): Promise<BulkResult> => {
      const results = await Promise.allSettled(
        taskIds.map((id) =>
          managerEmployeeTaskService.delete(id, milestoneId),
        ),
      );
      return summarizeBulk(results, "Đã xóa", "Xóa thất bại");
    },
    onSettled: () => {
      invalidateManagerEmployeeTasksQueriesForMilestone(qc, milestoneId);
    },
  });
};

export const useManagerBulkUnassignEmployeeTasks = (milestoneId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskIds: string[]): Promise<BulkResult> => {
      const results = await Promise.allSettled(
        taskIds.map((id) =>
          managerEmployeeTaskService.unassign(id, milestoneId),
        ),
      );
      return summarizeBulk(results, "Đã hủy gán", "Hủy gán thất bại");
    },
    onSettled: () => {
      invalidateManagerEmployeeTasksQueriesForMilestone(qc, milestoneId);
    },
  });
};

// ── Complete Task ──────────────────────────────────────────────────────

export const useManagerCompleteEmployeeTask = (milestoneId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      managerEmployeeTaskService.complete(taskId, milestoneId),
    onSuccess: (_res, taskId) => {
      toast.success("Đã hoàn thành nhiệm vụ!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.manager.employeeTasks.list(milestoneId),
      });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.manager.employeeTasks.detail(taskId, milestoneId),
      });
    },
    onError: (error) => onMutationError(error, "Hoàn thành nhiệm vụ thất bại"),
  });
};

// ── Eligible Farmers ───────────────────────────────────────────────────

export const useManagerEligibleFarmers = (
  milestoneId: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.manager.employeeTasks.eligibleFarmers(milestoneId),
    queryFn: () => managerEmployeeTaskService.eligibleFarmers(milestoneId),
    enabled: !!milestoneId && enabled,
  });
};

export const useManagerListCropSeasonTasks = (
  cropSeasonId: string,
  query: ListTasksWithContextQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.manager.employeeTasks.byCropSeason(
      cropSeasonId,
      query as Record<string, unknown>,
    ),
    queryFn: () =>
      managerEmployeeTaskService.listByCropSeason(cropSeasonId, query),
    enabled: !!cropSeasonId && enabled,
  });
};

// ============================================================
// Owner
// ============================================================

// ── List ───────────────────────────────────────────────────────────────

export const useOwnerListEmployeeTasks = (
  milestoneId: string,
  query: ListEmployeeTasksQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.owner.employeeTasks.list(milestoneId, query),
    queryFn: () => ownerEmployeeTaskService.list(milestoneId, query),
    enabled,
  });
};

// ── Detail ─────────────────────────────────────────────────────────────

export const useOwnerEmployeeTaskDetail = (
  taskId: string,
  milestoneId: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.owner.employeeTasks.detail(taskId, milestoneId),
    queryFn: () => ownerEmployeeTaskService.detail(taskId, milestoneId),
    enabled,
  });
};

// ── Create Batch ───────────────────────────────────────────────────────

export const useOwnerCreateEmployeeTaskBatch = (milestoneId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateEmployeeTaskBatchBodyType) =>
      ownerEmployeeTaskService.createBatch(milestoneId, body),
    onSuccess: () => {
      toast.success("Tạo nhiệm vụ thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.owner.employeeTasks.list(milestoneId),
      });
    },
    onError: (error) => onMutationError(error, "Tạo nhiệm vụ thất bại"),
  });
};

// ── Update ─────────────────────────────────────────────────────────────

export const useOwnerUpdateEmployeeTask = (milestoneId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      body,
    }: {
      taskId: string;
      body: UpdateEmployeeTaskBodyType;
    }) => ownerEmployeeTaskService.update(taskId, milestoneId, body),
    onSuccess: (_res, { taskId }) => {
      toast.success("Cập nhật nhiệm vụ thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.owner.employeeTasks.list(milestoneId),
      });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.owner.employeeTasks.detail(taskId, milestoneId),
      });
    },
    onError: (error) => onMutationError(error, "Cập nhật nhiệm vụ thất bại"),
  });
};

// ── Delete ─────────────────────────────────────────────────────────────

export const useOwnerDeleteEmployeeTask = (milestoneId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      ownerEmployeeTaskService.delete(taskId, milestoneId),
    onSuccess: (_res, taskId) => {
      toast.success("Xóa nhiệm vụ thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.owner.employeeTasks.list(milestoneId),
      });
      qc.removeQueries({
        queryKey: QUERY_KEYS.owner.employeeTasks.detail(taskId, milestoneId),
      });
    },
    onError: (error) => onMutationError(error, "Xóa nhiệm vụ thất bại"),
  });
};

// ── Assign Farmer ──────────────────────────────────────────────────────

export const useOwnerAssignFarmerToTask = (milestoneId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      body,
    }: {
      taskId: string;
      body: AssignFarmerToTaskBodyType;
    }) => ownerEmployeeTaskService.assign(taskId, milestoneId, body),
    onSuccess: (_res, { taskId }) => {
      toast.success("Gán nông dân thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.owner.employeeTasks.list(milestoneId),
      });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.owner.employeeTasks.detail(taskId, milestoneId),
      });
    },
    onError: (error) => onMutationError(error, "Gán nông dân thất bại"),
  });
};

// ── Unassign Farmer ────────────────────────────────────────────────────

export const useOwnerUnassignFarmerFromTask = (milestoneId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      ownerEmployeeTaskService.unassign(taskId, milestoneId),
    onSuccess: (_res, taskId) => {
      toast.success("Hủy gán nông dân thành công!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.owner.employeeTasks.list(milestoneId),
      });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.owner.employeeTasks.detail(taskId, milestoneId),
      });
    },
    onError: (error) => onMutationError(error, "Hủy gán nông dân thất bại"),
  });
};

// ── Complete Task ──────────────────────────────────────────────────────

export const useOwnerCompleteEmployeeTask = (milestoneId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      ownerEmployeeTaskService.complete(taskId, milestoneId),
    onSuccess: (_res, taskId) => {
      toast.success("Đã hoàn thành nhiệm vụ!");
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.owner.employeeTasks.list(milestoneId),
      });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.owner.employeeTasks.detail(taskId, milestoneId),
      });
    },
    onError: (error) => onMutationError(error, "Hoàn thành nhiệm vụ thất bại"),
  });
};

// ── Eligible Farmers ───────────────────────────────────────────────────

export const useOwnerEligibleFarmers = (
  milestoneId: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.owner.employeeTasks.eligibleFarmers(milestoneId),
    queryFn: () => ownerEmployeeTaskService.eligibleFarmers(milestoneId),
    enabled: !!milestoneId && enabled,
  });
};
