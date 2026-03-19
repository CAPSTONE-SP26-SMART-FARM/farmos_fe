import type {
	CreateAssignmentBodyType,
	ListAssignmentsQueryType,
} from "@/schemaValidatation/doctorAssignment";
import type {
	ListDoctorRequestsQueryType,
	UpdateDoctorRequestStatusBodyType,
} from "@/schemaValidatation/doctorProfile";
import type { ListFarmsQueryType } from "@/schemaValidatation/farmManagement";
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
