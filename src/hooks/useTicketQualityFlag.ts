import { useFeatureFlagsConfigs } from "@/queries/useSystemConfig";
import { parseSystemConfigValue } from "@/queries/useSystemConfig";

/**
 * Module 3 — Feature flag gating cho luồng "Ticket Resolve Quality v2".
 *
 * BR Changes mục 3.4 quy tắc 8: cơ chế 30k cũ phải tương thích ngược trong
 * giai đoạn rollout. Khi flag tắt → giữ luồng cũ (`endIncident` = end-of-chat,
 * 30k payout ngay khi resolved). Khi flag bật → bật toàn bộ Module 3 UI mới
 * (`TicketDetailPanelV2`, `CloseAndRateModal`, `AbandonResolutionModal`,
 * `AutoCloseCountdown`, panel solution/prescription/addenda/rating).
 *
 * Nguồn dữ liệu: lưu trong **SystemConfig** với key `feature.ticket_resolve_quality_v2`,
 * `valueType: "boolean"`, `value: "true"|"false"` (xem
 * `farm_os_be/src/modules/system-config/system-config.model.ts:43`).
 *
 * QUAN TRỌNG: khi `isLoading=true` → luôn trả `enabled=false` để tránh lộ
 * UI mới trong khi đang fetch flag (avoid flicker).
 */
export const TICKET_QUALITY_V2_FEATURE_KEY =
  "feature.ticket_resolve_quality_v2";

export function useTicketQualityFlag(): {
  enabled: boolean;
  isLoading: boolean;
} {
  const { data, isLoading } = useFeatureFlagsConfigs();

  if (isLoading) {
    return { enabled: false, isLoading: true };
  }

  const item = data?.data?.data?.find(
    (x) => x.key === TICKET_QUALITY_V2_FEATURE_KEY,
  );
  const value = parseSystemConfigValue(item);

  return {
    enabled: value === true,
    isLoading: false,
  };
}
