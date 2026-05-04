import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CropSeasonType } from "@/types/cropSeason";
import { formatDate, canEdit } from "./helpers";
import { UpdateCropSeasonDialog } from "./UpdateCropSeasonDialog";

export function HarvestRecordTab({ cropSeason }: { cropSeason: CropSeasonType }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Thu hoạch dự kiến</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatDate(cropSeason.expectedHarvestDate)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Thu hoạch thực tế</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatDate(cropSeason.actualHarvestDate)}</p>
            {!cropSeason.actualHarvestDate && (
              <p className="text-xs text-muted-foreground mt-1">Chưa có ngày thu hoạch thực tế</p>
            )}
          </CardContent>
        </Card>
      </div>

      {cropSeason.plantCount != null && (
        <div className="rounded-md border p-4">
          <p className="text-xs text-muted-foreground">Số lượng cây trồng</p>
          <p className="text-xl font-bold mt-1">{cropSeason.plantCount}</p>
        </div>
      )}

      {cropSeason.notes && (
        <div className="rounded-md border p-4">
          <p className="text-xs text-muted-foreground mb-2">Ghi chú</p>
          <p className="text-sm">{cropSeason.notes}</p>
        </div>
      )}

      {canEdit(cropSeason.status) && (
        <div className="flex gap-2">
          <UpdateCropSeasonDialog season={cropSeason} />
        </div>
      )}
    </div>
  );
}
