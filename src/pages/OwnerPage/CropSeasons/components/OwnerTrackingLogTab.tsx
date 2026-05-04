import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, XCircle } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTrackingLog } from "@/queries/useTracking";
import { TrackingLogList } from "@/pages/ManagerPage/CropSeasons/components/TrackingLogList";
import type { TrackingEntityType } from "@/schemaValidatation/tracking";

const ENTITY_TYPE_OPTIONS: Array<{ value: TrackingEntityType | "all"; label: string }> = [
  { value: "all", label: "Tất cả loại" },
  { value: "crop_season", label: "Mùa vụ" },
  { value: "production_milestone", label: "Mốc công việc" },
  { value: "employee_task", label: "Công việc" },
  { value: "harvest_record", label: "Bản ghi thu hoạch" },
  { value: "iot_device_assignment", label: "Thiết bị IoT" },
];

interface Props {
  cropSeasonId: string;
}

export function OwnerTrackingLogTab({ cropSeasonId }: Props) {
  const [entityType, setEntityType] = useState<TrackingEntityType | "all">("all");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [page, setPage] = useState(1);
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const logQuery = useTrackingLog(
    cropSeasonId,
    {
      page,
      limit: 30,
      ...(entityType !== "all" && { entityType }),
      ...(fromDate && { from: startOfDay(fromDate).toISOString() }),
      ...(toDate && { to: endOfDay(toDate).toISOString() }),
    },
    true,
  );

  const logs = logQuery.data?.data.data ?? [];
  const meta = logQuery.data?.data.meta;
  const hasFilters = entityType !== "all" || !!fromDate || !!toDate;

  const clearFilters = () => {
    setEntityType("all");
    setFromDate(undefined);
    setToDate(undefined);
    setPage(1);
  };

  const handleEntityChange = (v: string) => {
    setEntityType(v as TrackingEntityType | "all");
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Loại đối tượng</span>
          <Select value={entityType} onValueChange={handleEntityChange}>
            <SelectTrigger className="w-48 h-9">
              <SelectValue placeholder="Tất cả loại" />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Từ ngày</span>
          <Popover open={fromOpen} onOpenChange={setFromOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-36 h-9 justify-start text-left text-sm font-normal",
                  !fromDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                {fromDate ? format(fromDate, "dd/MM/yyyy", { locale: vi }) : "Từ ngày"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={fromDate}
                onSelect={(d) => { setFromDate(d); setFromOpen(false); setPage(1); }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Đến ngày</span>
          <Popover open={toOpen} onOpenChange={setToOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-36 h-9 justify-start text-left text-sm font-normal",
                  !toDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                {toDate ? format(toDate, "dd/MM/yyyy", { locale: vi }) : "Đến ngày"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={toDate}
                onSelect={(d) => { setToDate(d); setToOpen(false); setPage(1); }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-end gap-2 ml-auto self-end">
          {hasFilters && (
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

      <TrackingLogList logs={logs} isLoading={logQuery.isLoading} isError={logQuery.isError} />

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Trước
          </Button>
          <span className="text-sm text-muted-foreground">{meta.page} / {meta.totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
