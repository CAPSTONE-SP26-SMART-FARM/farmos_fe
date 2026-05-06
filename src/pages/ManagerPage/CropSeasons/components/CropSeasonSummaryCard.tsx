import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers } from "lucide-react";
import { useNavigate } from "react-router";
import { type CropSeasonType, ProductionStatusName } from "@/types/cropSeason";
import { StatusBadge } from "./StatusBadge";
import { formatDate } from "./helpers";
import { UpdateCropSeasonDialog } from "./UpdateCropSeasonDialog";
import { SendRequestDialog } from "./SendRequestDialog";

export function CropSeasonSummaryCard({
  season,
  zoneId,
  actions,
  footer,
}: {
  season: CropSeasonType;
  zoneId?: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const navigate = useNavigate();
  const showDefaultManagerActions = actions === undefined;
  const showDefaultManagerFooter =
    footer === undefined &&
    (season.status === ProductionStatusName.Planning ||
      season.status === ProductionStatusName.Rejected);

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-xl leading-tight">{season.cropName}</CardTitle>
              <StatusBadge status={season.status} />
            </div>
            {season.variety && (
              <p className="text-sm text-muted-foreground mt-0.5">Giống: {season.variety}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            {showDefaultManagerActions ? (
              <>
                <UpdateCropSeasonDialog season={season} />
                <SendRequestDialog season={season} />
              </>
            ) : (
              actions
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Ngày trồng</p>
            <p className="font-medium mt-0.5">{formatDate(season.plantDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Thu hoạch dự kiến</p>
            <p className="font-medium mt-0.5">{formatDate(season.expectedHarvestDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Thu hoạch thực tế</p>
            <p className="font-medium mt-0.5">{formatDate(season.actualHarvestDate)}</p>
          </div>
          {season.plantCount != null && (
            <div>
              <p className="text-xs text-muted-foreground">Số cây</p>
              <p className="font-medium mt-0.5">{season.plantCount}</p>
            </div>
          )}
        </div>
        {season.notes && (
          <div className="mt-3 rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {season.notes}
          </div>
        )}
        {footer !== undefined ? (
          <div className="mt-4">{footer}</div>
        ) : showDefaultManagerFooter ? (
          <div className="mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const params = new URLSearchParams();
                if (zoneId) params.set("zoneId", zoneId);
                navigate(
                  `/dashboard/manager/crop-seasons/${season.id}/milestones${params.toString() ? `?${params}` : ""}`,
                );
              }}
            >
              <Layers className="h-3 w-3 mr-1.5" />
              Quản lý mốc công việc
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
