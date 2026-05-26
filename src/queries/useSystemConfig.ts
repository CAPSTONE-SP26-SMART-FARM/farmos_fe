import { QUERY_KEYS } from "@/constants";
import type {
  SystemConfigItemType,
  UpsertSystemConfigBodyType,
} from "@/schemaValidatation/systemConfig";
import systemConfigService from "@/services/systemConfigService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ── B18 — list system configs với prefix ──────────────────────────────────
// `useTicketSystemConfigs()` là helper cho Module 3 (prefix `ticket.`).

export const useSystemConfigs = (prefix?: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.systemConfigs.list(prefix),
    queryFn: () => systemConfigService.list({ prefix }),
    enabled,
  });
};

export const useTicketSystemConfigs = (enabled = true) =>
  useSystemConfigs("ticket.", enabled);

export const useWithdrawalSystemConfigs = (enabled = true) =>
  useSystemConfigs("withdrawal.", enabled);

export const useFeatureFlagsConfigs = (enabled = true) =>
  useSystemConfigs("feature.", enabled);

// ── Helper: parse value theo `valueType` ──────────────────────────────────
// SystemConfig BE lưu value dạng string; FE parse khi consume.
export function parseSystemConfigValue(
  item: SystemConfigItemType | undefined,
): string | number | boolean | unknown {
  if (!item) return undefined;
  switch (item.valueType) {
    case "number":
      return Number.parseFloat(item.value);
    case "boolean":
      return item.value === "true" || item.value === "1";
    case "json":
      try {
        return JSON.parse(item.value);
      } catch {
        return item.value;
      }
    default:
      return item.value;
  }
}

// Hook tiện lợi: lấy value 1 key sau khi đã có list trong cache.
export function useSystemConfigValue<T = unknown>(
  prefix: string,
  key: string,
): { value: T | undefined; isLoading: boolean } {
  const { data, isLoading } = useSystemConfigs(prefix);
  const item = data?.data?.data?.find((x) => x.key === key);
  return {
    value: item ? (parseSystemConfigValue(item) as T) : undefined,
    isLoading,
  };
}

// ── Upsert single-key ─────────────────────────────────────────────────────
// BE endpoint là `PATCH /admin/system-configs/:key`. Caller (A3 form) sẽ
// gọi tuần tự N lần (1 lần mỗi key thay đổi).
export const useUpsertSystemConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      key,
      body,
    }: {
      key: string;
      body: UpsertSystemConfigBodyType;
    }) => systemConfigService.upsert(key, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.systemConfigs.root });
    },
  });
};
