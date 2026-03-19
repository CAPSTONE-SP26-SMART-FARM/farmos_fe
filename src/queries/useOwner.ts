import type { ListAssignmentsQueryType } from "@/schemaValidatation/doctorAssignment";
import ownerService from "@/services/ownerService";
import { useQuery } from "@tanstack/react-query";

export const useOwnerGetListDoctor = (query: ListAssignmentsQueryType) => {
	return useQuery({
		queryKey: ["owner-doctors", "list", query],
		queryFn: () => ownerService.listDoctor(query),
	});
};

export const useOwnerGetDoctorDetail = (id: string) => {
	return useQuery({
		queryKey: ["owner-doctors", "detail", id],
		queryFn: () => ownerService.detailDoctor(id),
		enabled: Boolean(id),
	});
};
