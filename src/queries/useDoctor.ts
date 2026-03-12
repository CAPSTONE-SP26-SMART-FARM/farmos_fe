import type { ListAssignmentsQueryType } from "@/schemaValidatation/doctorAssignment";
import type {
	ListDoctorRequestsQueryType,
	SubmitDoctorRequestBodyType,
	UpsertDoctorProfileBodyType,
} from "@/schemaValidatation/doctorProfile";
import doctorService from "@/services/doctorService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useDoctorUpsertProfile = () => {
	return useMutation({
		mutationFn: (data: UpsertDoctorProfileBodyType) =>
			doctorService.upsertProfile(data),
	});
};

export const useDoctorRequest = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: SubmitDoctorRequestBodyType) =>
			doctorService.request(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["doctors-request"] });
		},
	});
};

export const useDoctorListRequest = (query?: ListDoctorRequestsQueryType) => {
	return useQuery({
		queryKey: ["doctors-request", query],
		queryFn: () => doctorService.listRequest(query),
	});
};

export const useDoctorRequestDetail = (id: string) => {
	return useQuery({
		queryKey: ["doctors-request", id],
		queryFn: () => doctorService.requestDetail(id),
	});
};

export const useDoctorMyAssignmentDetail = (id: string) => {
	return useQuery({
		queryKey: ["doctors-assignment", id],
		queryFn: () => doctorService.detailAssignment(id),
	});
};

export const useDoctorListAssignment = (query: ListAssignmentsQueryType) => {
	return useQuery({
		queryKey: ["doctors-assignments", query],
		queryFn: () => doctorService.assignMe(query),
	});
};
