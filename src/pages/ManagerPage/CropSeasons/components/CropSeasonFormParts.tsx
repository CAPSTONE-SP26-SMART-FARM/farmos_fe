import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { useActiveCropCategoryList } from "@/queries/useCropCategory";
import type { CropCategoryType } from "@/schemaValidatation/cropCategory";
import { Field } from "./Field";
import {
  computeDensityHint,
  computeCycleHint,
  findCategory,
  formatDensity,
  sortActiveCategories,
} from "./helpers";

// ── Category picker ───────────────────────────────────────────────────────
export function CropCategoryPicker({
  value,
  onChange,
  error,
  disabled,
  required = true,
}: {
  value: string | undefined;
  onChange: (id: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  const { data, isLoading } = useActiveCropCategoryList();
  const list = sortActiveCategories(data?.data?.data);
  const selected = findCategory(list, value);

  return (
    <Field
      label={`Loại cây trồng${required ? " *" : ""}`}
      error={error}
    >
      <Select
        value={value || undefined}
        onValueChange={onChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="w-full">
          {isLoading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Đang tải danh sách...
            </span>
          ) : selected ? (
            <span>{selected.name}</span>
          ) : (
            <span className="text-muted-foreground">
              Chọn loại cây để hệ thống kiểm tra mật độ
            </span>
          )}
        </SelectTrigger>
        <SelectContent position="popper" className="z-60 w-(--radix-select-trigger-width)">
          {list.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              <div className="flex flex-col">
                <span className="font-medium">{cat.name}</span>
                <span className="text-xs text-muted-foreground">
                  {cat.code}
                  {cat.code !== "OTHER" && (
                    <>
                      {" · "}
                      {formatDensity(cat.minPlantingDensity)}–
                      {formatDensity(cat.maxPlantingDensity)} cây/m²
                    </>
                  )}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected && selected.code !== "OTHER" && (
        <p className="text-xs text-muted-foreground">
          Mật độ chuẩn: {formatDensity(selected.minPlantingDensity)} –{" "}
          {formatDensity(selected.maxPlantingDensity)} cây/m²
          {selected.recommendedDensity != null && (
            <> (khuyến nghị {formatDensity(selected.recommendedDensity)})</>
          )}
          {selected.defaultCycleDays != null && (
            <> · Chu kỳ điển hình {selected.defaultCycleDays} ngày</>
          )}
        </p>
      )}
      {selected?.code === "OTHER" && (
        <p className="text-xs text-muted-foreground">
          Dùng cho giống cây chưa có trong danh mục. Hệ thống không gợi ý
          mật độ chuẩn cho lựa chọn này.
        </p>
      )}
    </Field>
  );
}

// ── Density badge real-time ───────────────────────────────────────────────
export function DensityBadge({
  totalAreaSqm,
  plantCount,
  category,
  onSuggestCount,
}: {
  totalAreaSqm: number | undefined;
  plantCount: number | undefined;
  category: CropCategoryType | undefined;
  onSuggestCount?: (count: number) => void;
}) {
  const hint = computeDensityHint(totalAreaSqm, plantCount, category);

  if (hint.status === "missing") {
    if (
      category &&
      category.recommendedDensity != null &&
      Number.isFinite(totalAreaSqm) &&
      (totalAreaSqm as number) > 0 &&
      onSuggestCount
    ) {
      const suggested = Math.max(
        1,
        Math.round((totalAreaSqm as number) * category.recommendedDensity),
      );
      return (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => onSuggestCount(suggested)}
        >
          <Sparkles className="h-3 w-3" />
          Gợi ý: {suggested.toLocaleString("vi-VN")} cây
        </Button>
      );
    }
    return null;
  }

  if (hint.status === "ok") {
    return (
      <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50">
        ✓ Mật độ phù hợp: {formatDensity(hint.density)} cây/m²
      </Badge>
    );
  }

  if (hint.status === "below") {
    return (
      <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">
        ⚠ Mật độ {formatDensity(hint.density)} cây/m² – quá thưa (tối thiểu{" "}
        {formatDensity(hint.min)})
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">
      ⚠ Mật độ {formatDensity(hint.density)} cây/m² – quá dày (tối đa{" "}
      {formatDensity(hint.max)})
    </Badge>
  );
}

// ── Cycle range warning ────────────────────────────────────────────────────
export function CycleHintLine({
  plantDate,
  expectedHarvestDate,
  category,
}: {
  plantDate: string | undefined;
  expectedHarvestDate: string | undefined;
  category: CropCategoryType | undefined;
}) {
  const hint = computeCycleHint(plantDate, expectedHarvestDate, category);

  if (hint.status === "missing" || hint.status === "ok") return null;

  return (
    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
      ⚠ Chu kỳ vụ {hint.days} ngày nằm ngoài khoảng phù hợp của loại cây này
      ({hint.allowedMinDays} – {hint.allowedMaxDays} ngày). Hệ thống có thể
      từ chối khi bạn lưu — cân nhắc điều chỉnh ngày thu hoạch dự kiến.
    </p>
  );
}

// ── Cảnh báo khi diện tích trồng khác diện tích khu vực ────────────────────
export function AreaMismatchWarning({
  totalAreaSqm,
  zoneAreaSqm,
}: {
  totalAreaSqm: number | undefined;
  zoneAreaSqm: number | null | undefined;
}) {
  if (
    !Number.isFinite(totalAreaSqm) ||
    !Number.isFinite(zoneAreaSqm) ||
    (totalAreaSqm as number) <= 0 ||
    (zoneAreaSqm as number) <= 0
  ) {
    return null;
  }

  const area = totalAreaSqm as number;
  const zoneArea = zoneAreaSqm as number;
  // Coi như khớp khi chênh lệch < 0.5 m² (do làm tròn input)
  if (Math.abs(area - zoneArea) < 0.5) return null;

  const isOver = area > zoneArea;
  const fmt = (v: number) => v.toLocaleString("vi-VN");

  return (
    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
      ⚠ Diện tích bạn nhập ({fmt(area)} m²) {isOver ? "lớn hơn" : "nhỏ hơn"}{" "}
      diện tích khu vực ({fmt(zoneArea)} m²).{" "}
      {isOver
        ? "Hệ thống sẽ kiểm tra lại khi lưu — nếu vượt quá diện tích còn lại của khu vực sẽ bị từ chối."
        : "Bạn vẫn có thể lưu nếu chỉ muốn trồng trên một phần của khu vực."}
    </p>
  );
}

// ── Snapshot chip (read-only, hiển thị khoảng mật độ đã chốt) ─────────────
export function DensitySnapshotChip({
  minDensitySnapshot,
  maxDensitySnapshot,
}: {
  minDensitySnapshot: number | null | undefined;
  maxDensitySnapshot: number | null | undefined;
}) {
  if (minDensitySnapshot == null || maxDensitySnapshot == null) return null;
  return (
    <Badge variant="secondary" className="font-normal">
      Mật độ áp dụng: {formatDensity(minDensitySnapshot)} –{" "}
      {formatDensity(maxDensitySnapshot)} cây/m²
    </Badge>
  );
}
