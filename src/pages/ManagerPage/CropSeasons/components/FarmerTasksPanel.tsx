import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import TableSkeleton from "@/components/common/TableSkeleton";
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
  pending: { label: "Chờ xử lý", variant: "secondary" },
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
            <SelectItem value="pending">Chờ xử lý</SelectItem>
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
      ) : tasksQuery.isLoading ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mốc</TableHead>
              <TableHead>Nhiệm vụ</TableHead>
              <TableHead>Nông dân</TableHead>
              <TableHead>Ưu tiên</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableSkeleton />
          </TableBody>
        </Table>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Chưa có nhiệm vụ"
          description="Không có nhiệm vụ nào phù hợp bộ lọc."
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Mốc</TableHead>
                  <TableHead>Nhiệm vụ</TableHead>
                  <TableHead className="w-40">Nông dân</TableHead>
                  <TableHead className="w-28">Ưu tiên</TableHead>
                  <TableHead className="w-36">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => {
                  const statusMeta =
                    STATUS_META[task.status] ?? { label: task.status, variant: "secondary" as const };
                  return (
                    <TableRow
                      key={task.id}
                      className="transition-colors hover:bg-muted/40"
                    >
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {task.milestoneOrder != null ? `#${task.milestoneOrder} ` : ""}
                        {task.milestoneName ?? "—"}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {task.description}
                          </p>
                        )}
                        {task.createdInPlan === false && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-purple-100 text-purple-700 mt-0.5"
                          >
                            Phát sinh
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.farmerName ? (
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-sm truncate">{task.farmerName}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Chưa gán</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            PRIORITY_CLASS[task.priority] ?? "bg-slate-100 text-slate-600"
                          }
                        >
                          {PRIORITY_LABEL[task.priority] ?? task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusMeta.variant} className="text-xs">
                          {statusMeta.label}
                        </Badge>
                        {task.completedAt && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Hoàn thành: {new Date(task.completedAt).toLocaleDateString("vi-VN")}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
