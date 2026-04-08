import { QUERY_KEYS } from "@/constants/endpoints";
import type { ListAssignmentsQueryType } from "@/schemaValidatation/doctorAssignment";
import type {
  CreateFarmBodyType,
  UpdateFarmBodyType,
} from "@/schemaValidatation/farmManagement";
import type {
  CreateFarmMemberBodyType,
  ListFarmMembersQueryType,
  UpdateFarmMemberBodyType,
} from "@/schemaValidatation/farmMember";
import ownerService from "@/services/ownerService";
import { useFarmStore } from "@/stores/farmStore";
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
    onSuccess: (result) => {
      useFarmStore.getState().setFarm(result.data);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.owner.farm.my() });
    },
  });
};

export const useOwnerUpdateFarm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFarmBodyType }) =>
      ownerService.updateFarm(id, data),
    onSuccess: (result) => {
      useFarmStore.getState().setFarm(result.data);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.owner.farm.my() });
    },
  });
};

// ── Farm Members ──────────────────────────────────────────────

export const useOwnerListFarmMembers = (query: ListFarmMembersQueryType) => {
  return useQuery({
    queryKey: QUERY_KEYS.farmMembers.list(query),
    queryFn: () => ownerService.listFarmMembers(query),
  });
};

export const useOwnerGetFarmMemberDetail = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.farmMembers.detail(id),
    queryFn: () => ownerService.getFarmMemberDetail(id),
  });
};

export const useOwnerCreateFarmMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFarmMemberBodyType) =>
      ownerService.createFarmMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.farmMembers.all,
      });
    },
  });
};

export const useOwnerUpdateFarmMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateFarmMemberBodyType;
    }) => ownerService.updateFarmMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.farmMembers.all,
      });
    },
  });
};
