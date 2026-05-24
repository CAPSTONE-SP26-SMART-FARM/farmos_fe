import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type CropSeasonType, ProductionStatusName } from "@/types/cropSeason";
import { useActiveCropCategoryList } from "@/queries/useCropCategory";
import { StatusBadge } from "./StatusBadge";
import { formatDate, findCategory, formatDensity } from "./helpers";
import { SendRequestDialog } from "./SendRequestDialog";

function InfoCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium mt-0.5 truncate">{value ?? "—"}</p>
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
  /** Top-right slot — nếu undefined sẽ render SendRequestDialog mặc định (Manager) */
  actions?: React.ReactNode;
  /** Footer-right slot — chứa các secondary action (Kế hoạch vs Thực tế, Thu hoạch, …) */
  footer?: React.ReactNode;
  /** Ẩn hẳn SendRequest mặc định khi không truyền actions (vd: view read-only) */
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

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-xl leading-tight">
                {season.cropName}
              </CardTitle>
              <StatusBadge status={season.status} />
            </div>
            <div className="mt-1 text-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5">
              {category && (
                <span>
                  Loại cây:{" "}
                  <span className="font-medium text-foreground">
                    {category.name}
                  </span>
                </span>
              )}
              {season.variety && <span>Giống: {season.variety}</span>}
            </div>
          </div>

          <div className="flex gap-2 shrink-0 flex-wrap">
            {actions !== undefined
              ? actions
              : !hideSendRequest && canSend && (
                  <SendRequestDialog season={season} />
                )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-3 lg:grid-cols-6">
          <InfoCell label="Ngày trồng" value={formatDate(season.plantDate)} />
          <InfoCell
            label="Thu hoạch dự kiến"
            value={formatDate(season.expectedHarvestDate)}
          />
          <InfoCell
            label="Thu hoạch thực tế"
            value={formatDate(season.actualHarvestDate)}
          />
          <InfoCell
            label="Diện tích"
            value={
              season.totalAreaSqm != null
                ? `${season.totalAreaSqm.toLocaleString("vi-VN")} m²`
                : null
            }
          />
          <InfoCell
            label="Số cây"
            value={
              season.plantCount != null
                ? season.plantCount.toLocaleString("vi-VN")
                : null
            }
          />
          <InfoCell
            label="Mật độ hiện tại"
            value={
              currentDensity != null ? (
                <span
                  className={
                    densityOutOfRange
                      ? "text-destructive font-semibold"
                      : undefined
                  }
                  title={
                    densityOutOfRange && (minD != null || maxD != null)
                      ? `Ngoài ngưỡng khuyến nghị (${
                          minD != null ? formatDensity(minD) : "?"
                        } – ${maxD != null ? formatDensity(maxD) : "?"} cây/m²)`
                      : undefined
                  }
                >
                  {formatDensity(currentDensity)}{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    cây/m²
                  </span>
                </span>
              ) : null
            }
          />
        </div>

        {season.notes && (
          <div className="mt-3 rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {season.notes}
          </div>
        )}

        {footer !== undefined && footer !== null && (
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
