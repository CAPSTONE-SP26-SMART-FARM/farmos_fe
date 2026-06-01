import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DatePickerField from "@/components/common/DatePickerField";
import { DataTable } from "@/components/common/DataTable";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { SubmitLogDialog } from "@/pages/ManagerPage/CropSeasons/components/SubmitLogDialog";
import OwnerMilestoneTasksSection from "@/pages/OwnerPage/EmployeeTasks/OwnerMilestoneTasksSection";
import { useOwnerGetMyFarm } from "@/queries/useOwner";
import {
  useDailyLogTasksToday,
  useOwnerDailyLogsByFarm,
} from "@/queries/useDailyLog";
import { useOwnerListProductionMilestones } from "@/queries/useProductionMilestone";
import { formatDateTimeVi, formatDateVi } from "@/lib/format";
import type { CropSeasonType } from "@/types/cropSeason";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ListTodo,
  NotebookPen,
} from "lucide-react";
import { useMemo, useState } from "react";

// ─────────────────────────────────────────────────────────────
// Owner phiên bản DailyLogsTab — 3 sub-tab giống manager
// ─────────────────────────────────────────────────────────────
//
// BE permissions cho owner (đã verify ở `daily-log.controller.ts` +
// `employee-task.controller.ts` + `production-milestone.controller.ts`):
//
//   ✓ GET  /daily-log/owner/farm/:farmId       (list logs theo farm)
//   ✓ GET  /daily-log/tasks                    (generic — task cần ghi log
//                                               hôm nay; KHÁC schema với
//                                               manager `/zone/:id/today`,
//                                               không có `hasLoggedToday`)
//   ✓ POST /daily-log/submit                   (submit log)
//   ✓ Owner endpoints cho production-milestone (list per crop-season) +
//      employee-task (CRUD per milestone) → reuse `OwnerMilestoneTasksSection`.
//
// Owner KHÔNG có:
//   ✗ GET /daily-log/manager/zone/:zoneId/today (manager-only, có log status)
//
// → Tab "Nhiệm vụ hôm nay" cho owner dùng generic endpoint, hiển thị danh
//   sách task cần ghi log nhưng KHÔNG có cờ `hasLoggedToday` chi tiết.

const DEFAULT_LIMIT = 10;

const PRIORITY_META: Record<string, { label: string; className: string }> = {
  low: {
    label: "Thấp",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  normal: {
    label: "Bình thường",
    className: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
  },
  high: {
    label: "Cao",
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  },
  urgent: {
    label: "Khẩn cấp",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
  },
};

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
// Sub-tab 1: LogsPanel — Nhật ký nhiệm vụ
// ─────────────────────────────────────────────────────────────

function OwnerLogsPanel({
  zoneId,
  zoneName,
  readOnly = false,
}: {
  zoneId: string;
  zoneName?: string;
  readOnly?: boolean;
}) {
  const farmQuery = useOwnerGetMyFarm();
  const farmId = farmQuery.data?.data.id;

  const today = todayIso();
  const [page, setPage] = useState(1);
  const [fromDateInput, setFromDateInput] = useState(today);
  const [toDateInput, setToDateInput] = useState(today);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const logsQuery = useOwnerDailyLogsByFarm(farmId, {
    page,
    limit: DEFAULT_LIMIT,
    zoneId: zoneId || undefined,
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
      id: "zone",
      header: "Khu vực",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.zone?.name ?? "—"}
        </span>
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
          <DatePickerField
            label="Từ ngày"
            value={fromDateInput}
            onChange={setFromDateInput}
          />
        </div>
        <div className="w-44">
          <DatePickerField
            label="Đến ngày"
            value={toDateInput}
            onChange={setToDateInput}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleApply}
          >
            Áp dụng
          </Button>
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={handleReset}
            >
              Về hôm nay
            </Button>
          )}
        </div>
      </div>

      {/* Header + Submit */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">
            {zoneName ? `Nhật ký – ${zoneName}` : "Nhật ký công việc"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {logsQuery.isLoading
              ? "Đang tải..."
              : `${totalItems} nhật ký được ghi nhận`}
          </p>
        </div>
        {!readOnly && <SubmitLogDialog />}
      </div>

      {/* Table */}
      {logsQuery.isError ? (
        <ErrorState
          message="Không thể tải nhật ký."
          onRetry={() => logsQuery.refetch()}
        />
      ) : !logsQuery.isLoading && logs.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="Chưa có nhật ký"
          description={
            isFiltered
              ? "Không có nhật ký trong khoảng đã chọn."
              : "Chưa có nhật ký nào hôm nay."
          }
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
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Trước
              </Button>
              <span className="text-sm text-muted-foreground">
                Trang {page} / {meta.totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-tab 2: TodayTasksPanel — Nhiệm vụ hôm nay
// ─────────────────────────────────────────────────────────────
//
// Owner dùng endpoint generic `/daily-log/tasks`. Schema không có
// `hasLoggedToday` / `todayLog` — chỉ list task active + filter client-side
// theo zoneId.

function OwnerTodayTasksPanel({ zoneId }: { zoneId: string }) {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading, isError } = useDailyLogTasksToday({
    page,
    limit,
  });

  // Filter client-side theo zoneId vì BE generic endpoint không có filter
  // zoneId trong query schema (`ListFarmerTasksForDailyLogQuerySchema` chỉ
  // có page+limit). Server-side scope đã giới hạn theo role; FE chỉ lọc
  // hiển thị theo zone đang xem.
  const tasks = useMemo(() => {
    const all = data?.data?.data ?? [];
    return zoneId ? all.filter((t) => t.zoneId === zoneId) : all;
  }, [data?.data?.data, zoneId]);
  const meta = data?.data?.meta;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold flex items-center gap-1.5">
            <ListTodo className="h-4 w-4" />
            Nhiệm vụ hôm nay
          </p>
          {!isLoading && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {tasks.length} task active trong khu vực
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-4 text-center text-sm text-destructive">
          Không thể tải dữ liệu. Vui lòng thử lại.
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-md border bg-muted/20 px-3 py-8 text-center space-y-1">
          <AlertCircle className="h-8 w-8 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-medium">
            Không có nhiệm vụ nào đang thực hiện hôm nay
          </p>
          <p className="text-xs text-muted-foreground">
            Các task ở trạng thái pending / in_progress thuộc mốc đang chạy
            sẽ hiện ở đây.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const priorityMeta =
              PRIORITY_META[task.priority] ?? PRIORITY_META.normal;
            return (
              <div
                key={task.id}
                className="rounded-md border p-3 space-y-2 bg-muted/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <Badge className={`text-[10px] ${priorityMeta.className}`}>
                    {priorityMeta.label}
                  </Badge>
                </div>
                <Separator className="opacity-50" />
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span>Trạng thái: {task.status}</span>
                  {task.assignedDate && (
                    <span>
                      Bắt đầu:{" "}
                      {new Date(task.assignedDate).toLocaleDateString("vi-VN")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            Trang {meta.page} / {meta.totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={!meta.hasPreviousPage}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={!meta.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-tab 3: TaskManagementPanel — Quản lý task
// ─────────────────────────────────────────────────────────────
//
// Reuse `OwnerMilestoneTasksSection` — owner có quyền CRUD/Assign/Complete
// task theo từng milestone (xem `employee-task.controller.ts:32-167`).

function OwnerTaskManagementPanel({
  cropSeason,
  readOnly = false,
}: {
  cropSeason: CropSeasonType;
  readOnly?: boolean;
}) {
  const milestonesQuery = useOwnerListProductionMilestones(cropSeason.id, {
    page: 1,
    limit: 50,
  });
  const milestones = useMemo(
    () =>
      (milestonesQuery.data?.data.data ?? []).sort(
        (a, b) => a.milestoneOrder - b.milestoneOrder,
      ),
    [milestonesQuery.data],
  );

  const inProgressMilestone = useMemo(
    () => milestones.find((m) => m.status === "in_progress"),
    [milestones],
  );

  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>("");

  const activeMilestoneId =
    selectedMilestoneId || inProgressMilestone?.id || milestones[0]?.id || "";

  if (milestonesQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center border rounded-md bg-muted/20">
        <ClipboardList className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm font-medium">Chưa có mốc công việc</p>
        <p className="text-xs text-muted-foreground">
          Quản lý sẽ tạo mốc và task khi mùa vụ bắt đầu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select
          value={activeMilestoneId}
          onValueChange={setSelectedMilestoneId}
        >
          <SelectTrigger className="h-8 text-xs w-64">
            <SelectValue placeholder="Chọn mốc" />
          </SelectTrigger>
          <SelectContent>
            {milestones.map((m) => (
              <SelectItem
                key={m.id}
                value={m.id}
              >
                #{m.milestoneOrder} {m.stageName}
                {m.status === "in_progress" ? " — đang thực hiện" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeMilestoneId && (
        <OwnerMilestoneTasksSection
          milestoneId={activeMilestoneId}
          canEdit={!readOnly}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Parent — 3 sub-tabs giống manager DailyLogsTab
// ─────────────────────────────────────────────────────────────

interface OwnerDailyLogsTabProps {
  zoneId: string;
  zoneName?: string;
  cropSeason: CropSeasonType;
  readOnly?: boolean;
}

export function OwnerDailyLogsTab({
  zoneId,
  zoneName,
  cropSeason,
  readOnly = false,
}: OwnerDailyLogsTabProps) {
  return (
    <Card>
      <Tabs defaultValue="logs">
        <CardHeader className="pb-0">
          <TabsList className="flex-wrap h-auto gap-1 w-fit">
            <TabsTrigger
              value="logs"
              className="flex items-center gap-1.5"
            >
              <NotebookPen className="h-3.5 w-3.5" />
              Nhật ký nhiệm vụ
            </TabsTrigger>
            {!readOnly && (
              <TabsTrigger
                value="today"
                className="flex items-center gap-1.5"
              >
                <ListTodo className="h-3.5 w-3.5" />
                Nhiệm vụ hôm nay
              </TabsTrigger>
            )}
            <TabsTrigger
              value="tasks"
              className="flex items-center gap-1.5"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Quản lý task
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        <Separator className="mt-3" />

        <CardContent className="pt-4">
          <TabsContent
            value="logs"
            className="mt-0"
          >
            <OwnerLogsPanel
              zoneId={zoneId}
              zoneName={zoneName}
              readOnly={readOnly}
            />
          </TabsContent>

          {!readOnly && (
            <TabsContent
              value="today"
              className="mt-0"
            >
              <OwnerTodayTasksPanel zoneId={zoneId} />
            </TabsContent>
          )}

          <TabsContent
            value="tasks"
            className="mt-0"
          >
            <OwnerTaskManagementPanel
              cropSeason={cropSeason}
              readOnly={readOnly}
            />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
