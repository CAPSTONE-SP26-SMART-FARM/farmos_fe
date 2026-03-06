import type {
	CreateAssignmentBodyType,
	ListAssignmentsQueryType,
} from "@/schemaValidatation/doctorAssignment";
import type {
	ListDoctorRequestsQueryType,
	UpdateDoctorRequestStatusBodyType,
} from "@/schemaValidatation/doctorProfile";
import adminService from "@/services/adminService";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useAdminListDoctorRequest = (
	query: ListDoctorRequestsQueryType,
) => {
	return useQuery({
		queryKey: ["admin-doctor-requests", query],
		queryFn: () => adminService.listDoctorRequest(query),
	});
};

export const useAdminDoctorRequestDetail = (id: string) => {
	return useQuery({
		queryKey: ["admin-doctor-requests", id],
		queryFn: () => adminService.doctorRequestDetail(id),
	});
};

export const useAdminChangeStatusDoctorRequest = () => {
	return useMutation({
		mutationFn: (
			data: UpdateDoctorRequestStatusBodyType & {
				id: string;
			},
		) =>
			adminService.changeStatus(data.id, {
				...data,
			}),
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
