import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { useManagerListCropSeasonTasks } from "@/queries/useEmployeeTask";
import { useManagerListProductionMilestones } from "@/queries/useProductionMilestone";
import type { CropSeasonType } from "@/types/cropSeason";
import type { ListTasksWithContextQueryType } from "@/schemaValidatation/employeeTask";
import { ChevronLeft, ChevronRight, ClipboardList, User } from "lucide-react";
import { useMemo, useState } from "react";

const STATUS_META: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  pending: { label: "Chưa bắt đầu", variant: "secondary" },
  in_progress: { label: "Đang thực hiện", variant: "default" },
  completed: { label: "Hoàn thành", variant: "outline" },
  verified: { label: "Đã xác minh", variant: "default" },
  cancelled: { label: "Đã hủy", variant: "destructive" },
};

const PRIORITY_LABEL: Record<string, string> = {
  low: "Thấp",
  normal: "Bình thường",
  high: "Cao",
  urgent: "Khẩn",
};

const PRIORITY_CLASS: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  normal: "bg-sky-100 text-sky-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-rose-100 text-rose-700",
};

interface FarmerTasksPanelProps {
  cropSeason: CropSeasonType;
}

export function FarmerTasksPanel({ cropSeason }: FarmerTasksPanelProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [milestoneFilter, setMilestoneFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const milestonesQuery = useManagerListProductionMilestones(cropSeason.id, {
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

  const query = useMemo<ListTasksWithContextQueryType>(
    () => ({
      page,
      limit: 15,
      status: statusFilter !== "all" ? (statusFilter as ListTasksWithContextQueryType["status"]) : undefined,
      milestoneId: milestoneFilter !== "all" ? milestoneFilter : undefined,
    }),
    [page, statusFilter, milestoneFilter],
  );

  const tasksQuery = useManagerListCropSeasonTasks(cropSeason.id, query);
  const tasks = tasksQuery.data?.data.data ?? [];
  const meta = tasksQuery.data?.data.meta;

  const resetPage = () => setPage(1);

  type TaskRow = (typeof tasks)[number];

  const columns: ColumnDef<TaskRow>[] = [
    {
      accessorKey: "milestoneName",
      header: "Mốc",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {row.original.milestoneOrder != null
            ? `#${row.original.milestoneOrder} `
            : ""}
          {row.original.milestoneName ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "title",
      header: "Nhiệm vụ",
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium">{row.original.title}</p>
          {row.original.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {row.original.description}
            </p>
          )}
          {row.original.createdInPlan === false && (
            <Badge
              variant="secondary"
              className="text-[10px] bg-purple-100 text-purple-700 mt-0.5"
            >
              Phát sinh
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: "farmer",
      header: "Nông dân",
      cell: ({ row }) =>
        row.original.farmerName ? (
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm truncate">{row.original.farmerName}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            Chưa gán
          </span>
        ),
    },
    {
      accessorKey: "priority",
      header: "Ưu tiên",
      cell: ({ row }) => (
        <Badge
          className={
            PRIORITY_CLASS[row.original.priority] ?? "bg-slate-100 text-slate-600"
          }
        >
          {PRIORITY_LABEL[row.original.priority] ?? row.original.priority}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const statusMeta = STATUS_META[row.original.status] ?? {
          label: row.original.status,
          variant: "secondary" as const,
        };
        return (
          <div>
            <Badge variant={statusMeta.variant} className="text-xs">
              {statusMeta.label}
            </Badge>
            {row.original.completedAt && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Hoàn thành:{" "}
                {new Date(row.original.completedAt).toLocaleDateString("vi-VN")}
              </p>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Select
          value={milestoneFilter}
          onValueChange={(v) => { setMilestoneFilter(v); resetPage(); }}
        >
          <SelectTrigger className="h-8 text-xs w-52">
            <SelectValue placeholder="Tất cả mốc" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả mốc</SelectItem>
            {milestones.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                #{m.milestoneOrder} {m.stageName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v); resetPage(); }}
        >
          <SelectTrigger className="h-8 text-xs w-44">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="pending">Chưa bắt đầu</SelectItem>
            <SelectItem value="in_progress">Đang thực hiện</SelectItem>
            <SelectItem value="completed">Hoàn thành</SelectItem>
            <SelectItem value="verified">Đã xác minh</SelectItem>
            <SelectItem value="cancelled">Đã hủy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {tasksQuery.isError ? (
        <ErrorState
          message="Không thể tải nhiệm vụ."
          onRetry={() => tasksQuery.refetch()}
        />
      ) : !tasksQuery.isLoading && tasks.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Chưa có nhiệm vụ"
          description="Không có nhiệm vụ nào phù hợp bộ lọc."
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border">
            <DataTable
              columns={columns}
              data={tasks}
              isLoading={tasksQuery.isLoading}
              emptyText="Chưa có nhiệm vụ."
            />
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {meta.totalItems} nhiệm vụ
              </span>
              <div className="flex items-center gap-2">
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
                  {page} / {meta.totalPages}
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
            </div>
          )}
        </>
      )}
    </div>
  );
}
