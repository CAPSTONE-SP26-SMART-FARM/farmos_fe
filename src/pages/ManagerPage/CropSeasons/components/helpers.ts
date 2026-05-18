import { ProductionStatusName } from "@/types/cropSeason";
import type { CropCategoryType } from "@/schemaValidatation/cropCategory";
import {
  format,
  parse,
  isValid,
  addDays,
  startOfDay,
  isBefore,
  differenceInCalendarDays,
} from "date-fns";

export const STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  planning: { label: "Lên kế hoạch", variant: "secondary" },
  sent: { label: "Đã gửi", variant: "default" },
  approved: { label: "Đã duyệt", variant: "default" },
  rejected: { label: "Bị từ chối", variant: "destructive" },
  active: { label: "Đang hoạt động", variant: "default" },
  completed: { label: "Hoàn thành", variant: "outline" },
  cancelled: { label: "Đã hủy", variant: "destructive" },
};

export const REQUEST_STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  pending: { label: "Chờ duyệt", variant: "secondary" },
  approved: { label: "Đã duyệt", variant: "default" },
  rejected: { label: "Từ chối", variant: "destructive" },
};

export function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  const parsed = parseBackendDate(d);
  return parsed ? format(parsed, "dd/MM/yyyy") : d;
}

export function parseBackendDate(value: string | null | undefined) {
  if (!value) return undefined;
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  if (isValid(parsed)) return parsed;
  const fallback = new Date(value);
  return isValid(fallback) ? fallback : undefined;
}

export function formatPickerDate(value: string | null | undefined) {
  const parsed = parseBackendDate(value);
  return parsed ? format(parsed, "dd/MM/yyyy") : "";
}

export function getMinPlantDate() {
  return startOfDay(new Date());
}

export function validateCropSeasonFormDates({
  plantDate,
  expectedHarvestDate,
  requirePlantDate,
  requireExpectedHarvestDate,
}: {
  plantDate?: string;
  expectedHarvestDate?: string;
  requirePlantDate: boolean;
  requireExpectedHarvestDate: boolean;
}) {
  const errors: { plantDate?: string; expectedHarvestDate?: string } = {};
  const minPlantDate = getMinPlantDate();

  if (requirePlantDate && !plantDate) errors.plantDate = "Vui lòng chọn ngày trồng.";
  if (requireExpectedHarvestDate && !expectedHarvestDate)
    errors.expectedHarvestDate = "Vui lòng chọn ngày thu hoạch dự kiến.";

  const parsedPlantDate = parseBackendDate(plantDate);
  const parsedExpectedHarvestDate = parseBackendDate(expectedHarvestDate);

  if (plantDate && !parsedPlantDate) errors.plantDate = "Ngày trồng không hợp lệ.";
  if (expectedHarvestDate && !parsedExpectedHarvestDate)
    errors.expectedHarvestDate = "Ngày thu hoạch dự kiến không hợp lệ.";

  if (parsedPlantDate && isBefore(startOfDay(parsedPlantDate), startOfDay(minPlantDate)))
    errors.plantDate = `Ngày trồng phải từ ${format(minPlantDate, "dd/MM/yyyy")} trở đi.`;

  if (parsedPlantDate && parsedExpectedHarvestDate) {
    const minExpectedHarvestDate = addDays(startOfDay(parsedPlantDate), 1);
    if (isBefore(startOfDay(parsedExpectedHarvestDate), startOfDay(minExpectedHarvestDate)))
      errors.expectedHarvestDate = "Ngày thu hoạch dự kiến phải sau ngày trồng.";
  }

  return errors;
}

// ── Density helper ─────────────────────────────────────────────────────────
export type DensityHint =
  | { status: "ok"; density: number }
  | { status: "below" | "above"; density: number; min: number; max: number }
  | { status: "missing" };

export function computeDensityHint(
  totalAreaSqm: number | undefined,
  plantCount: number | undefined,
  category: CropCategoryType | undefined,
): DensityHint {
  // `valueAsNumber` của RHF biến input rỗng thành NaN — vẫn là `typeof "number"`.
  // Dùng Number.isFinite để loại NaN/Infinity ra khỏi điều kiện hợp lệ.
  if (
    !category ||
    !Number.isFinite(totalAreaSqm) ||
    !Number.isFinite(plantCount) ||
    (totalAreaSqm as number) <= 0 ||
    (plantCount as number) <= 0
  ) {
    return { status: "missing" };
  }

  const density = (plantCount as number) / (totalAreaSqm as number);
  const min = category.minPlantingDensity;
  const max = category.maxPlantingDensity;

  if (density < min) return { status: "below", density, min, max };
  if (density > max) return { status: "above", density, min, max };
  return { status: "ok", density };
}

// ── Cycle helper ───────────────────────────────────────────────────────────
export type CycleHint =
  | { status: "ok"; days: number }
  | {
      status: "below" | "above";
      days: number;
      allowedMinDays: number;
      allowedMaxDays: number;
    }
  | { status: "missing" };

export function computeCycleHint(
  plantDate: string | undefined,
  expectedHarvestDate: string | undefined,
  category: CropCategoryType | undefined,
): CycleHint {
  const parsedPlant = parseBackendDate(plantDate);
  const parsedHarvest = parseBackendDate(expectedHarvestDate);
  const cycleDays = category?.defaultCycleDays ?? null;

  if (!parsedPlant || !parsedHarvest || cycleDays == null) {
    return { status: "missing" };
  }

  const days = differenceInCalendarDays(
    startOfDay(parsedHarvest),
    startOfDay(parsedPlant),
  );
  const allowedMinDays = Math.ceil(cycleDays * 0.5);
  const allowedMaxDays = Math.floor(cycleDays * 2);

  if (days < allowedMinDays)
    return { status: "below", days, allowedMinDays, allowedMaxDays };
  if (days > allowedMaxDays)
    return { status: "above", days, allowedMinDays, allowedMaxDays };
  return { status: "ok", days };
}

// ── 422 path mapping ───────────────────────────────────────────────────────
// BE doc nói rõ density error gửi path "plantCount", nhưng cycle/area
// error có thể không kèm `path`. Helper này lấp khoảng trống đó để form
// vẫn highlight đúng input.
export function mapCropSeasonServerError(
  errors:
    | Array<{ field?: string; message?: string } & Record<string, unknown>>
    | undefined,
) {
  if (!errors) return errors;
  return errors.map((e) => {
    if (e.field) return e;
    const msg = String(e.message ?? "").toLowerCase();
    if (msg.includes("cropdensity")) return { ...e, field: "plantCount" };
    if (msg.includes("cropcycleoutofdefaultrange"))
      return { ...e, field: "expectedHarvestDate" };
    if (msg.includes("cropareaexceedszonearea"))
      return { ...e, field: "totalAreaSqm" };
    if (msg.includes("cropcategorynotfound"))
      return { ...e, field: "cropCategoryId" };
    return e;
  });
}

// ── Sort & lookup category ─────────────────────────────────────────────────
// BE seed code `OTHER` cho giống lạ — đẩy xuống cuối list cho gọn.
export function sortActiveCategories(
  list: CropCategoryType[] | undefined,
): CropCategoryType[] {
  if (!list) return [];
  const others = list.filter((c) => c.code === "OTHER");
  const rest = list
    .filter((c) => c.code !== "OTHER")
    .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  return [...rest, ...others];
}

export function findCategory(
  list: CropCategoryType[] | undefined,
  id: string | null | undefined,
): CropCategoryType | undefined {
  if (!id || !list) return undefined;
  return list.find((c) => c.id === id);
}

// ── Format helpers ─────────────────────────────────────────────────────────
const NUMBER_FORMATTER = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 2,
});

export function formatDensity(value: number) {
  return NUMBER_FORMATTER.format(value);
}

export type CropSeasonEditMode = "all" | "operational" | "none";

export function getCropSeasonEditMode(status: string): CropSeasonEditMode {
  if (status === ProductionStatusName.Planning) return "all";
  if (status === ProductionStatusName.Approved || status === ProductionStatusName.Active) return "operational";
  return "none";
}

export const canEdit = (status: string) => getCropSeasonEditMode(status) !== "none";

export const canSend = (status: string) =>
  status === ProductionStatusName.Planning || status === ProductionStatusName.Rejected;

export const MILESTONE_STATUS_META: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  pending: { label: "Chưa diễn ra", variant: "secondary" },
  in_progress: { label: "Đang thực hiện", variant: "default" },
  completed: { label: "Hoàn thành", variant: "outline" },
};
