import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DatePickerField from "@/components/common/DatePickerField";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { useManagerDailyLogsByZone } from "@/queries/useDailyLog";
import { formatDateTimeVi, formatDateVi } from "@/lib/format";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ListTodo,
  NotebookPen,
} from "lucide-react";
import { useState } from "react";
import type { CropSeasonType } from "@/types/cropSeason";
import { SubmitLogDialog } from "./SubmitLogDialog";
import { TaskManagementPanel } from "./TaskManagementPanel";
import { TodayZoneTasksPanel } from "./TodayZoneTasksPanel";

const DEFAULT_LIMIT = 10;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─────────────────────────────────────────────────────────────
// LogsPanel — nhật ký công việc theo ngày
// ─────────────────────────────────────────────────────────────

interface LogsPanelProps {
  zoneId: string;
  zoneName?: string;
}

function LogsPanel({ zoneId, zoneName }: LogsPanelProps) {
  const today = todayIso();
  const [page, setPage] = useState(1);
  const [fromDateInput, setFromDateInput] = useState(today);
  const [toDateInput, setToDateInput] = useState(today);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const logsQuery = useManagerDailyLogsByZone(zoneId, {
    page,
    limit: DEFAULT_LIMIT,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });

  const logs = logsQuery.data?.data.data ?? [];
  const meta = logsQuery.data?.data.meta;
  const totalItems = meta?.totalItems ?? 0;
  const isFiltered = fromDate !== today || toDate !== today;

  const handleApply = () => {
    setFromDate(fromDateInput);
    setToDate(toDateInput);
    setPage(1);
  };

  const handleReset = () => {
    setFromDateInput(today);
    setToDateInput(today);
    setFromDate(today);
    setToDate(today);
    setPage(1);
  };

  type DailyLogRow = (typeof logs)[number];

  const columns: ColumnDef<DailyLogRow>[] = [
    {
      id: "farmer",
      header: "Người ghi",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            {row.original.farmer.avatarUrl && (
              <AvatarImage
                src={row.original.farmer.avatarUrl}
                alt={row.original.farmer.fullName}
              />
            )}
            <AvatarFallback>
              {getInitials(row.original.farmer.fullName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium truncate">
            {row.original.farmer.fullName}
          </span>
        </div>
      ),
    },
    {
      id: "task",
      header: "Công việc",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.task?.title ?? (
            <span className="text-muted-foreground italic">—</span>
          )}
        </span>
      ),
    },
    {
      accessorKey: "activities",
      header: "Hoạt động",
      cell: ({ row }) => (
        <div className="text-sm max-w-md">
          <p className="line-clamp-2">{row.original.activities}</p>
          {row.original.notes && (
            <p className="text-xs italic text-muted-foreground line-clamp-1">
              Ghi chú: {row.original.notes}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "logDate",
      header: "Ngày ghi",
      cell: ({ row }) => (
        <span
          className="text-xs text-muted-foreground"
          title={formatDateTimeVi(row.original.createdAt)}
        >
          {formatDateVi(row.original.logDate)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Date filter */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end pb-4 border-b">
        <div className="w-44">
          <DatePickerField label="Từ ngày" value={fromDateInput} onChange={setFromDateInput} />
        </div>
        <div className="w-44">
          <DatePickerField label="Đến ngày" value={toDateInput} onChange={setToDateInput} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleApply}>Áp dụng</Button>
          {isFiltered && (
            <Button variant="ghost" onClick={handleReset}>Về hôm nay</Button>
          )}
        </div>
      </div>

      {/* Logs table */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">
              {zoneName ? `Nhật ký – ${zoneName}` : "Nhật ký công việc"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {logsQuery.isLoading ? "Đang tải..." : `${totalItems} nhật ký được ghi nhận`}
            </p>
          </div>
          <SubmitLogDialog />
        </div>
        <div>
          {logsQuery.isError ? (
            <ErrorState message="Không thể tải nhật ký." onRetry={() => logsQuery.refetch()} />
          ) : !logsQuery.isLoading && logs.length === 0 ? (
            <EmptyState
              icon={NotebookPen}
              title="Chưa có nhật ký"
              description={isFiltered ? "Không có nhật ký trong khoảng đã chọn." : "Chưa có nhật ký nào hôm nay."}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <DataTable
                  columns={columns}
                  data={logs}
                  isLoading={logsQuery.isLoading}
                  emptyText="Chưa có nhật ký."
                />
              </div>

              {meta && meta.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4 mr-1" />Trước
                  </Button>
                  <span className="text-sm text-muted-foreground">Trang {page} / {meta.totalPages}</span>
                  <Button variant="ghost" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                    Sau<ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DailyLogsTab — 3 tabs
// ─────────────────────────────────────────────────────────────

interface DailyLogsTabProps {
  zoneId: string;
  zoneName?: string;
  cropSeason: CropSeasonType;
}

export function DailyLogsTab({ zoneId, zoneName, cropSeason }: DailyLogsTabProps) {
  return (
    <Card>
      <Tabs defaultValue="logs">
        <CardHeader className="pb-0">
          <TabsList className="flex-wrap h-auto gap-1 w-fit">
            <TabsTrigger value="logs" className="flex items-center gap-1.5">
              <NotebookPen className="h-3.5 w-3.5" />
              Nhật ký nhiệm vụ
            </TabsTrigger>
            <TabsTrigger value="today" className="flex items-center gap-1.5">
              <ListTodo className="h-3.5 w-3.5" />
              Nhiệm vụ hôm nay
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" />
              Quản lý task
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        <Separator className="mt-3" />

        <CardContent className="pt-4">
          <TabsContent value="logs" className="mt-0">
            <LogsPanel zoneId={zoneId} zoneName={zoneName} />
          </TabsContent>

          <TabsContent value="today" className="mt-0">
            <TodayZoneTasksPanel zoneId={zoneId} />
          </TabsContent>

          <TabsContent value="tasks" className="mt-0">
            <TaskManagementPanel cropSeason={cropSeason} />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
