import { ProductionStatusName } from "@/types/cropSeason";
import { format, parse, isValid, addMonths, startOfDay, isBefore } from "date-fns";

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
  return addMonths(startOfDay(new Date()), 1);
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
    const minExpectedHarvestDate = addMonths(startOfDay(parsedPlantDate), 1);
    if (isBefore(startOfDay(parsedExpectedHarvestDate), startOfDay(minExpectedHarvestDate)))
      errors.expectedHarvestDate = `Ngày thu hoạch dự kiến phải từ ${format(minExpectedHarvestDate, "dd/MM/yyyy")} trở đi.`;
  }

  return errors;
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
