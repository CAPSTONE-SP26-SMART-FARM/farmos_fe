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
    queryKey: [["owner-doctors"], query],
    queryFn: () => ownerService.listDoctor(query),
  });
};

export const useOwnerGetDoctorDetail = (id: string) => {
  return useQuery({
    queryKey: ["owner-doctors", id],
    queryFn: () => ownerService.detailDoctor(id),
  });
};

export const useOwnerGetMyFarm = () => {
  return useQuery({
    queryKey: QUERY_KEYS.owner.farm.my(),
    queryFn: () => ownerService.getMyFarm(),
  });
};

export const useOwnerCreateFarm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFarmBodyType) => ownerService.createFarm(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.owner.farm.my() });
    },
  });
};

export const useOwnerUpdateFarm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFarmBodyType }) =>
      ownerService.updateFarm(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.owner.farm.my() });
    },
  });
};
