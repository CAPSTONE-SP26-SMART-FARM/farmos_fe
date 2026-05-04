import { XCircle, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { addMonths, endOfDay, startOfDay } from "date-fns";
import { type CropSeasonType, ProductionStatusName } from "@/types/cropSeason";
import type { TrackingEntityType } from "@/schemaValidatation/tracking";
import { useTrackingLog } from "@/queries/useTracking";
import { EntityTypeCombobox, DatePickerInput } from "./TrackingFilterInputs";
import { TrackingLogList } from "./TrackingLogList";
import TrackingConfigPanel from "./TrackingConfigPanel";

function TrackingOperationalView({ cropSeason }: { cropSeason: CropSeasonType }) {
  const [filterEntity, setFilterEntity] = useState<string>("all");
  const [filterFrom, setFilterFrom] = useState<Date | undefined>(() => addMonths(new Date(), -1));
  const [filterTo, setFilterTo] = useState<Date | undefined>(() => new Date());

  const logQuery = useTrackingLog(
    cropSeason.id,
    {
      page: 1,
      limit: 100,
      ...(filterEntity !== "all" && { entityType: filterEntity as TrackingEntityType }),
      ...(filterFrom && { from: startOfDay(filterFrom).toISOString() }),
      ...(filterTo && { to: endOfDay(filterTo).toISOString() }),
    },
    true,
  );

  const logs = logQuery.data?.data.data ?? [];
  const hasActiveFilter = filterEntity !== "all" || !!filterFrom || !!filterTo;
  const isError = logQuery.isError;

  const clearFilters = () => {
    setFilterEntity("all");
    setFilterFrom(undefined);
    setFilterTo(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Loại đối tượng</span>
          <EntityTypeCombobox value={filterEntity} onValueChange={setFilterEntity} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Từ ngày</span>
          <DatePickerInput value={filterFrom} onValueChange={setFilterFrom} placeholder="Từ ngày" />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Đến ngày</span>
          <DatePickerInput value={filterTo} onValueChange={setFilterTo} placeholder="Đến ngày" />
        </div>
        <div className="flex items-end gap-2 ml-auto self-end">
          {hasActiveFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-xs text-muted-foreground"
              onClick={clearFilters}
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Xoá bộ lọc
            </Button>
          )}
          {!logQuery.isLoading && (
            <span className="text-xs text-muted-foreground">{logs.length} kết quả</span>
          )}
        </div>
      </div>
      <TrackingLogList logs={logs} isLoading={logQuery.isLoading} isError={isError} />
    </div>
  );
}

export function TrackingLogTab({ cropSeason }: { cropSeason: CropSeasonType }) {
  const isPlanningState =
    cropSeason.status === ProductionStatusName.Planning ||
    cropSeason.status === ProductionStatusName.Rejected;

  if (isPlanningState) {
    return (
      <TrackingConfigPanel
        cropSeasonId={cropSeason.id}
        readOnly={cropSeason.status === ProductionStatusName.Rejected}
      />
    );
  }

  return <TrackingOperationalView cropSeason={cropSeason} />;
}
