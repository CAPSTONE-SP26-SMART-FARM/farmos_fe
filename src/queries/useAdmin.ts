import type {
  CreateAssignmentBodyType,
  ListAssignmentsQueryType,
} from "@/schemaValidatation/doctorAssignment";
import type {
  ListDoctorRequestsQueryType,
  UpdateDoctorRequestStatusBodyType,
} from "@/schemaValidatation/doctorProfile";
import type { ListFarmsQueryType } from "@/schemaValidatation/farmManagement";
import type { ListUsersQueryType } from "@/schemaValidatation/user";
import type {
  CreateMilestoneTemplateBodyType,
  ListMilestoneTemplatesQueryType,
  UpdateMilestoneTemplateBodyType,
} from "@/schemaValidatation/milestoneTemplate";
import type {
  ListAdminWithdrawalsQueryType,
  MarkPaidBodyType,
  RejectWithdrawalBodyType,
  ResolveNotReceivedBodyType,
} from "@/schemaValidatation/doctorWithdrawal";
import { QUERY_KEYS } from "@/constants";
import adminService from "@/services/adminService";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

export const useAdminListDoctorRequest = (
  query: ListDoctorRequestsQueryType,
  options?: { keepPreviousData?: boolean },
) => {
  return useQuery({
    queryKey: ["admin-doctor-requests", query],
    queryFn: () => adminService.listDoctorRequest(query),
    placeholderData: options?.keepPreviousData ? keepPreviousData : undefined,
  });
};

export const useAdminDoctorRequestDetail = (id: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["admin-doctor-requests", id],
    queryFn: () => adminService.doctorRequestDetail(id),
    enabled,
  });
};

export const useAdminChangeStatusDoctorRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      data: UpdateDoctorRequestStatusBodyType & {
        id: string;
      },
    ) =>
      adminService.changeStatus(data.id, {
        status: data.status,
        reason: data.reason,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-doctor-requests"] });
    },
  });
};

export const useAdminAsignDoctor = () => {
  return useMutation({
    mutationFn: (data: CreateAssignmentBodyType) =>
      adminService.assignDoctor(data),
  });
};

export const useAdminListDoctorAssignment = (
  query: ListAssignmentsQueryType,
) => {
  return useQuery({
    queryKey: ["admin-doctor-assignment", query],
    queryFn: () => adminService.listDoctorAssignment(query),
  });
};

export const useAdminDoctorAssginmentDetail = (id: string) => {
  return useQuery({
    queryKey: ["admin-doctor-assignment", id],
    queryFn: () => adminService.detailDoctorAssignment(id),
  });
};

export const useAdminListFarms = (query: ListFarmsQueryType) => {
  return useQuery({
    queryKey: QUERY_KEYS.admin.farms.list(query),
    queryFn: () => adminService.listFarms(query),
  });
};

export const useAdminFarmDetail = (id: string, enabled: boolean) => {
  return useQuery({
    queryKey: QUERY_KEYS.admin.farms.detail(id),
    queryFn: () => adminService.farmDetail(id),
    enabled,
  });
};

export const useAdminListUsers = (query: ListUsersQueryType) => {
  return useQuery({
    queryKey: QUERY_KEYS.admin.users.list(query),
    queryFn: () => adminService.listUsers(query),
  });
};

export const useAdminUserDetail = (id: string, enabled: boolean) => {
  return useQuery({
    queryKey: QUERY_KEYS.admin.users.detail(id),
    queryFn: () => adminService.userDetail(id),
    enabled,
  });
};

export const useAdminListMilestoneTemplates = (
  query: ListMilestoneTemplatesQueryType,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.admin.milestoneTemplates.list(query),
    queryFn: () => adminService.listMilestoneTemplates(query),
  });
};

export const useAdminCreateMilestoneTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMilestoneTemplateBodyType) =>
      adminService.createMilestoneTemplate(data),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.admin.milestoneTemplates.list(),
      });
    },
  });
};

export const useAdminUpdateMilestoneTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMilestoneTemplateBodyType;
    }) => adminService.updateMilestoneTemplate(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.admin.milestoneTemplates.list(),
      });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.admin.milestoneTemplates.detail(id),
      });
    },
  });
};

export const useAdminDeleteMilestoneTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.deleteMilestoneTemplate(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.admin.milestoneTemplates.list(),
      });
      qc.removeQueries({
        queryKey: QUERY_KEYS.admin.milestoneTemplates.detail(id),
      });
    },
  });
};

// ── Doctor Withdrawals ────────────────────────────────────────────────────
export const useAdminListWithdrawals = (
  query: ListAdminWithdrawalsQueryType,
) =>
  useQuery({
    queryKey: QUERY_KEYS.admin.withdrawals.list(query),
    queryFn: () => adminService.listWithdrawals(query),
  });

export const useAdminWithdrawalDetail = (id: string, enabled: boolean) =>
  useQuery({
    queryKey: QUERY_KEYS.admin.withdrawals.detail(id),
    queryFn: () => adminService.withdrawalDetail(id),
    enabled,
  });

export const useAdminWithdrawalAudit = (id: string, enabled: boolean) =>
  useQuery({
    queryKey: QUERY_KEYS.admin.withdrawals.audit(id),
    queryFn: () => adminService.withdrawalAudit(id),
    enabled,
  });

const invalidateWithdrawals = (
  qc: ReturnType<typeof useQueryClient>,
  id: string,
) => {
  qc.invalidateQueries({ queryKey: QUERY_KEYS.admin.withdrawals.list() });
  qc.invalidateQueries({ queryKey: QUERY_KEYS.admin.withdrawals.detail(id) });
};

export const useAdminApproveWithdrawal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.approveWithdrawal(id),
    onSuccess: (_res, id) => {
      invalidateWithdrawals(qc, id);
      toast.success("Đã duyệt yêu cầu rút tiền");
    },
  });
};

export const useAdminRejectWithdrawal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: RejectWithdrawalBodyType }) =>
      adminService.rejectWithdrawal(id, body),
    onSuccess: (_res, { id }) => {
      invalidateWithdrawals(qc, id);
      toast.success("Đã từ chối yêu cầu rút tiền");
    },
  });
};

export const useAdminMarkPaidWithdrawal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: MarkPaidBodyType }) =>
      adminService.markPaidWithdrawal(id, body),
    onSuccess: (_res, { id }) => {
      invalidateWithdrawals(qc, id);
      toast.success("Đã đánh dấu đã chuyển khoản");
    },
  });
};

export const useAdminResolveNotReceived = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: ResolveNotReceivedBodyType;
    }) => adminService.resolveNotReceived(id, body),
    onSuccess: (_res, { id }) => {
      invalidateWithdrawals(qc, id);
      toast.success("Đã xử lý yêu cầu chưa nhận tiền");
    },
  });
};
