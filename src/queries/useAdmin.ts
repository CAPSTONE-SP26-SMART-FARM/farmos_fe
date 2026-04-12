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
import { QUERY_KEYS } from "@/constants";
import adminService from "@/services/adminService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useAdminListDoctorRequest = (
  query: ListDoctorRequestsQueryType,
) => {
  return useQuery({
    queryKey: ["admin-doctor-requests", query],
    queryFn: () => adminService.listDoctorRequest(query),
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
