import { differenceInCalendarDays, format, isValid, parse } from "date-fns";

export const formatCurrencyVnd = (value: number): string =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

export const formatDateTimeVi = (value: string | null | undefined): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (!isValid(date)) return "-";
  return format(date, "dd/MM/yyyy HH:mm");
};

export const formatDateVi = (value: string | null | undefined): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (!isValid(date)) return "-";
  return format(date, "dd/MM/yyyy");
};

export const formatRelativeVi = (value: string | null | undefined): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (!isValid(date)) return "-";
  const diff = differenceInCalendarDays(date, new Date());
  if (diff === 0) return "hôm nay";
  if (diff > 0) return `còn ${diff} ngày`;
  return `đã qua ${Math.abs(diff)} ngày`;
};

export const toISO = (yyyyMmDd: string): string =>
  yyyyMmDd ? `${yyyyMmDd}T00:00:00.000Z` : yyyyMmDd;

export const toISOOrNull = (v: string | null | undefined): string | null =>
  v ? `${v}T00:00:00.000Z` : null;

export const parseBackendDate = (
  value: string | null | undefined,
): Date | undefined => {
  if (!value) return undefined;
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  if (isValid(parsed)) return parsed;
  const fallback = new Date(value);
  return isValid(fallback) ? fallback : undefined;
};
