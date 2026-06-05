import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CalendarClock,
  CalendarDays,
  Gauge,
  Ruler,
  Sprout,
  Trees,
} from "lucide-react";
import { differenceInCalendarDays, startOfDay } from "date-fns";
import { type CropSeasonType, ProductionStatusName } from "@/types/cropSeason";
import { useActiveCropCategoryList } from "@/queries/useCropCategory";
import { StatusBadge } from "./StatusBadge";
import { findCategory, formatDate, formatDensity, parseBackendDate } from "./helpers";
import { SendRequestDialog } from "./SendRequestDialog";
import { cn } from "@/lib/utils";

// Thẻ tóm tắt mùa vụ — dùng chung cho cả Manager & Owner.
//  - Layout: header (icon + tên cây + trạng thái) → dải tiến độ sinh trưởng
//    (ngày trồng → thu hoạch) → các ô chỉ số (ẩn ô rỗng) → ghi chú → footer.
//  - `actions` undefined ⇒ render SendRequestDialog mặc định (Manager) khi mùa
//    vụ đang ở planning/rejected. Owner luôn truyền `actions` nên không bao giờ
//    chạm nhánh mặc định này.

function StatCell({
  icon: Icon,
  label,
  value,
  valueClassName,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border bg-card/40 px-3 py-2.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("font-semibold leading-tight mt-0.5 truncate", valueClassName)}>
          {value}
        </p>
        {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}

export function CropSeasonSummaryCard({
  season,
  actions,
  footer,
  hideSendRequest = false,
}: {
  season: CropSeasonType;
  zoneId?: string;
  /** Slot góc phải tiêu đề — nếu undefined sẽ render SendRequestDialog mặc định (Manager). */
  actions?: React.ReactNode;
  /** Slot cuối thẻ — secondary action (Kế hoạch vs Thực tế, Thu hoạch…). */
  footer?: React.ReactNode;
  /** Ẩn hẳn SendRequest mặc định khi không truyền actions (vd: view read-only). */
  hideSendRequest?: boolean;
}) {
  const { data: catData } = useActiveCropCategoryList(!!season.cropCategoryId);
  const category = findCategory(catData?.data?.data, season.cropCategoryId);

  const currentDensity = season.currentDensity ?? null;
  const minD = season.minDensitySnapshot ?? null;
  const maxD = season.maxDensitySnapshot ?? null;
  const densityOutOfRange =
    currentDensity != null &&
    ((minD != null && currentDensity < minD) ||
      (maxD != null && currentDensity > maxD));

  const canSend =
    season.status === ProductionStatusName.Planning ||
    season.status === ProductionStatusName.Rejected;

  // ── Dải tiến độ sinh trưởng: ngày trồng → thu hoạch dự kiến ──────────────
  const plant = parseBackendDate(season.plantDate);
  const harvest = parseBackendDate(season.expectedHarvestDate);
  const actualHarvest = parseBackendDate(season.actualHarvestDate);
  const today = startOfDay(new Date());

  let progressPct = 0;
  let remainingLabel = "";
  if (actualHarvest) {
    progressPct = 100;
    remainingLabel = `Đã thu hoạch ${formatDate(season.actualHarvestDate)}`;
  } else if (plant && harvest) {
    const total = differenceInCalendarDays(harvest, plant);
    const elapsed = differenceInCalendarDays(today, plant);
    progressPct =
      total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
    const daysLeft = differenceInCalendarDays(harvest, today);
    remainingLabel =
      daysLeft > 0
        ? `Còn ${daysLeft} ngày tới thu hoạch dự kiến`
        : daysLeft === 0
          ? "Đến hạn thu hoạch dự kiến hôm nay"
          : `Trễ ${Math.abs(daysLeft)} ngày so với dự kiến`;
  }

  const subtitleParts = [
    category?.name && `Loại cây: ${category.name}`,
    season.variety && `Giống: ${season.variety}`,
  ].filter(Boolean) as string[];

  // Nhánh action mặc định (Manager) khi caller không truyền `actions`.
  const resolvedActions =
    actions !== undefined
      ? actions
      : !hideSendRequest && canSend
        ? <SendRequestDialog season={season} />
        : null;

  return (
    <Card className="overflow-hidden border-l-4 border-l-primary py-0">
      <CardContent className="p-5 space-y-5">
        {/* ── Tiêu đề ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sprout className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold leading-tight truncate">
                  {season.cropName}
                </h2>
                <StatusBadge status={season.status} />
              </div>
              {subtitleParts.length > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {subtitleParts.join("  ·  ")}
                </p>
              )}
            </div>
          </div>
          {resolvedActions && (
            <div className="flex gap-2 shrink-0 flex-wrap">{resolvedActions}</div>
          )}
        </div>

        {/* ── Dải tiến độ sinh trưởng ────────────────────────────────────── */}
        {plant && harvest && (
          <div className="rounded-lg border bg-muted/30 px-4 py-3">
            <div className="flex items-center justify-between gap-2 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                Trồng {formatDate(season.plantDate)}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                Thu hoạch {formatDate(season.expectedHarvestDate)}
                <CalendarClock className="h-3.5 w-3.5" />
              </span>
            </div>
            <Progress value={progressPct} className="mt-2 h-1.5" />
            {remainingLabel && (
              <p className="mt-2 text-xs text-muted-foreground">{remainingLabel}</p>
            )}
          </div>
        )}

        {/* ── Chỉ số ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {season.totalAreaSqm != null && (
            <StatCell
              icon={Ruler}
              label="Diện tích"
              value={`${season.totalAreaSqm.toLocaleString("vi-VN")} m²`}
            />
          )}
          {season.plantCount != null && (
            <StatCell
              icon={Trees}
              label="Số cây"
              value={season.plantCount.toLocaleString("vi-VN")}
            />
          )}
          {currentDensity != null && (
            <StatCell
              icon={Gauge}
              label="Mật độ hiện tại"
              value={
                <>
                  {formatDensity(currentDensity)}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    cây/m²
                  </span>
                </>
              }
              valueClassName={densityOutOfRange ? "text-destructive" : undefined}
              hint={
                densityOutOfRange && (minD != null || maxD != null)
                  ? `Ngoài ngưỡng ${minD != null ? formatDensity(minD) : "?"}–${
                      maxD != null ? formatDensity(maxD) : "?"
                    } cây/m²`
                  : undefined
              }
            />
          )}
        </div>

        {/* ── Ghi chú ────────────────────────────────────────────────────── */}
        {season.notes && (
          <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            {season.notes}
          </div>
        )}

        {/* ── Footer actions ─────────────────────────────────────────────── */}
        {footer !== undefined && footer !== null && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
