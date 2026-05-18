import { useCallback } from "react";
import { useSearchParams } from "react-router";

function parseOptionalInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function useQueueUrlParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const clearParams = useCallback(
    (keys: string[]) => {
      const next = new URLSearchParams(searchParams);
      for (const key of keys) next.delete(key);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const farmId = searchParams.get("farmId") ?? undefined;

  return {
    searchParams,
    updateParams,
    clearParams,
    farmId,
    parseOptionalInt: (key: string) =>
      parseOptionalInt(searchParams.get(key)),
    parseBoolFlag: (key: string) => searchParams.get(key) === "1",
  };
}
