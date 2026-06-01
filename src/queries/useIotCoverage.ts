import { QUERY_KEYS } from "@/constants";
import { zoneService } from "@/services/zoneService";
import { useQuery } from "@tanstack/react-query";

// Độ phủ thiết bị IoT cho 1 zone. Dữ liệu phụ thuộc trạng thái assignment
// nên giữ staleTime ngắn — vừa lắp / vừa gỡ thiết bị là cần refetch.
//
// Caller không cần truyền kitId — khi đó BE chỉ trả zoneArea + currentActive
// + status (không có requiredKitCount).
export const useIotCoverage = (
  zoneId: string | null | undefined,
  kitId?: string | null,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.iotCoverage.byZone(zoneId ?? "", kitId ?? null),
    queryFn: () => zoneService.getIotCoverage(zoneId ?? "", kitId ?? null),
    enabled: !!zoneId && enabled,
    staleTime: 30 * 1000,
    retry: false, // 404 zone / 404 kit không phải lỗi tạm thời.
  });
};

// Crop-season scoped coverage. Dùng cho UI nằm dưới 1 crop season cụ thể:
// denominator là `cropSeason.totalAreaSqm` chứ không phải `zone.areaSqm`,
// và `activeDeviceCount` đã dedupe per device qua các milestone overlap.
export const useCropSeasonIotCoverage = (
  cropSeasonId: string | null | undefined,
  kitId?: string | null,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.iotCoverage.byCropSeason(
      cropSeasonId ?? "",
      kitId ?? null,
    ),
    queryFn: () =>
      zoneService.getCropSeasonIotCoverage(cropSeasonId ?? "", kitId ?? null),
    enabled: !!cropSeasonId && enabled,
    staleTime: 30 * 1000,
    retry: false,
  });
};
