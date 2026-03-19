import { QUERY_KEYS } from "@/constants/endpoints";
import type { ListAssignmentsQueryType } from "@/schemaValidatation/doctorAssignment";
import type {
  CreateFarmBodyType,
  UpdateFarmBodyType,
} from "@/schemaValidatation/farmManagement";
import ownerService from "@/services/ownerService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
