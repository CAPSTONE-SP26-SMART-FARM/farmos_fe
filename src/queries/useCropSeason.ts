import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { onMutationError } from "@/lib/axios";
import { QUERY_KEYS } from "@/constants/endpoints";
import { cropSeasonService } from "@/services/cropSeasonService";
import type {
  CreateCropSeasonBodyType,
  UpdateCropSeasonBodyType,
  SendProductionRequestBodyType,
  ReplyProductionRequestBodyType,
  ListCropSeasonsQueryType,
  ListProductionRequestsQueryType,
} from "@/types/cropSeason";

export const useManagerListCropSeasons = (
  zoneId: string,
  query: ListCropSeasonsQueryType,
) =>
  useQuery({
    queryKey: QUERY_KEYS.cropSeasons.listByZone(zoneId, query),
    queryFn: () => cropSeasonService.listByZone(zoneId, query),
    enabled: !!zoneId,
  });

export const useManagerCropSeasonDetail = (id: string) =>
  useQuery({
    queryKey: QUERY_KEYS.cropSeasons.detail(id),
    queryFn: () => cropSeasonService.detail(id),
    enabled: !!id,
  });

export const useManagerListRequests = (
  cropSeasonId: string,
  query: ListProductionRequestsQueryType,
) =>
  useQuery({
    queryKey: QUERY_KEYS.cropSeasons.requests(cropSeasonId, query),
    queryFn: () => cropSeasonService.listRequests(cropSeasonId, query),
    enabled: !!cropSeasonId,
  });

export const useManagerRequestDetail = (requestId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.cropSeasons.requestDetail(requestId),
    queryFn: () => cropSeasonService.requestDetail(requestId),
    enabled: !!requestId,
  });

export const useCreateCropSeason = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCropSeasonBodyType) =>
      cropSeasonService.create(body),
    onSuccess: async (data) => {
      await qc.invalidateQueries({
        queryKey: ["crop-seasons", "zone", data.data.zoneId],
      });
      await qc.refetchQueries({
        queryKey: ["crop-seasons", "zone", data.data.zoneId],
      });
      toast.success("Tạo mùa vụ thành công!");
    },
  });
};

export const useUpdateCropSeason = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateCropSeasonBodyType) =>
      cropSeasonService.update(id, body),
    onSuccess: async (data) => {
      await qc.invalidateQueries({
        queryKey: QUERY_KEYS.cropSeasons.detail(id),
      });
      await qc.invalidateQueries({
        queryKey: ["crop-seasons", "zone", data.data.zoneId],
      });
      await qc.refetchQueries({
        queryKey: ["crop-seasons", "zone", data.data.zoneId],
      });
      toast.success("Cập nhật mùa vụ thành công!");
    },
  });
};

export const useDeleteCropSeason = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; zoneId: string }) =>
      cropSeasonService.delete(id),
    onSuccess: async (_data, variables) => {
      await qc.invalidateQueries({
        queryKey: QUERY_KEYS.cropSeasons.detail(variables.id),
      });
      await qc.invalidateQueries({
        queryKey: ["crop-seasons", "zone", variables.zoneId],
      });
      await qc.refetchQueries({
        queryKey: ["crop-seasons", "zone", variables.zoneId],
      });
      await qc.invalidateQueries({ queryKey: ["manager", "zones"] });
      toast.success("Xóa mùa vụ thành công!");
    },
    onError: (error) => onMutationError(error, "Xóa mùa vụ thất bại"),
  });
};

export const useCompleteCropSeason = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => cropSeasonService.complete(id),
    onSuccess: async (data) => {
      await qc.invalidateQueries({
        queryKey: QUERY_KEYS.cropSeasons.detail(id),
      });
      await qc.invalidateQueries({
        queryKey: ["crop-seasons", "zone", data.data.zoneId],
      });
      await qc.refetchQueries({
        queryKey: ["crop-seasons", "zone", data.data.zoneId],
      });
      // Hoàn thành season → zone landing card (currentCropSeason) cần refresh
      // để hiển thị trạng thái mới / cho phép tạo vụ mới.
      await qc.invalidateQueries({ queryKey: ["manager", "zones"] });
      toast.success("Đã hoàn thành mùa vụ!");
    },
    onError: (error) => onMutationError(error, "Hoàn thành mùa vụ thất bại"),
  });
};

export const useSendProductionRequest = (cropSeasonId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SendProductionRequestBodyType) =>
      cropSeasonService.sendRequest(cropSeasonId, body),
    onSuccess: async () => {
      // Invalidate + refetch ngay để UI update trước khi dialog đóng
      await qc.invalidateQueries({ queryKey: ["crop-seasons"] });
      await qc.refetchQueries({ queryKey: ["crop-seasons"] });
      toast.success("Đã gửi yêu cầu phê duyệt lên Chủ trang trại!");
    },
    onError: (error) => onMutationError(error, "Gửi yêu cầu thất bại"),
  });
};

export const useOwnerListCropSeasons = (
  zoneId: string,
  query: ListCropSeasonsQueryType,
) =>
  useQuery({
    queryKey: [...QUERY_KEYS.cropSeasons.listByZone(zoneId, query), "owner"],
    queryFn: () => cropSeasonService.ownerListByZone(zoneId, query),
    enabled: !!zoneId,
  });

export const useOwnerCropSeasonDetail = (id: string) =>
  useQuery({
    queryKey: [...QUERY_KEYS.cropSeasons.detail(id), "owner"],
    queryFn: () => cropSeasonService.ownerDetail(id),
    enabled: !!id,
  });

export const useOwnerListRequests = (
  cropSeasonId: string,
  query: ListProductionRequestsQueryType,
) =>
  useQuery({
    queryKey: [
      ...QUERY_KEYS.cropSeasons.requests(cropSeasonId, query),
      "owner",
    ],
    queryFn: () => cropSeasonService.ownerListRequests(cropSeasonId, query),
    enabled: !!cropSeasonId,
  });

export const useOwnerRequestDetail = (requestId: string) =>
  useQuery({
    queryKey: [...QUERY_KEYS.cropSeasons.requestDetail(requestId), "owner"],
    queryFn: () => cropSeasonService.ownerRequestDetail(requestId),
    enabled: !!requestId,
  });

export const useReplyProductionRequest = (requestId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ReplyProductionRequestBodyType) =>
      cropSeasonService.replyRequest(requestId, body),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: QUERY_KEYS.cropSeasons.requestDetail(requestId),
      });
      await qc.invalidateQueries({ queryKey: ["crop-seasons"] });
      await qc.refetchQueries({ queryKey: ["crop-seasons"] });
      // Toast hiển thị ở component (ProductionRequestDetailPanel) để phân biệt
      // duyệt / từ chối và gắn link điều hướng tới trang Yêu cầu thiết bị.
    },
    onError: (error) => onMutationError(error, "Phản hồi thất bại"),
  });
};
