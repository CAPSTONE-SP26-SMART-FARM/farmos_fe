import { useEffect, useRef } from "react";

export interface FarmPickerOption {
  farmId: string;
  farmName: string;
  farmCode: string | null;
  ownerName: string;
}

/**
 * Cache danh sách farm từ lần fetch không lọc farmId — dùng cho picker.
 */
export function useFarmPickerOptions(
  farms: {
    farmId: string | null;
    farmName: string;
    farmCode?: string | null;
    ownerName: string;
  }[],
  farmIdFilter?: string,
) {
  const cacheRef = useRef<FarmPickerOption[]>([]);

  useEffect(() => {
    if (farmIdFilter) return;
    if (farms.length === 0) return;
    const next = farms
      .filter((f): f is typeof f & { farmId: string } => f.farmId != null)
      .map((f) => ({
        farmId: f.farmId,
        farmName: f.farmName,
        farmCode: f.farmCode ?? null,
        ownerName: f.ownerName,
      }));
    if (next.length > 0) cacheRef.current = next;
  }, [farms, farmIdFilter]);

  const fromCurrent = farms
    .filter((f): f is typeof f & { farmId: string } => f.farmId != null)
    .map((f) => ({
      farmId: f.farmId,
      farmName: f.farmName,
      farmCode: f.farmCode ?? null,
      ownerName: f.ownerName,
    }));

  return cacheRef.current.length > 0 ? cacheRef.current : fromCurrent;
}
