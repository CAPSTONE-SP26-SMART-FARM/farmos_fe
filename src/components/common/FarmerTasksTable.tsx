import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/common/DataTable";
import { cn } from "@/lib/utils";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import type {
  FarmerTaskForDailyLogType,
  TaskPriorityType,
  TaskStatusEnumType,
} from "@/schemaValidatation/dailyLog";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ClipboardList,
  Minus,
} from "lucide-react";
import { useMemo } from "react";

const PRIORITY_LABELS: Record<TaskPriorityType, string> = {
  urgent: "Khẩn cấp",
  high: "Cao",
  normal: "Trung bình",
  low: "Thấp",
};

const PRIORITY_STYLES: Record<TaskPriorityType, string> = {
  urgent: "bg-red-500/10 text-red-600 border-red-500/30",
  high: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  normal: "bg-muted text-muted-foreground border-transparent",
  low: "bg-muted/50 text-muted-foreground border-transparent",
};

const PRIORITY_RANK: Record<TaskPriorityType, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

const STATUS_LABELS: Record<TaskStatusEnumType, string> = {
  pending: "Chưa bắt đầu",
  in_progress: "Đang làm",
  completed: "Đã xong",
  verified: "Đã duyệt",
  cancelled: "Đã huỷ",
};

const STATUS_STYLES: Record<TaskStatusEnumType, string> = {
  pending: "border-border text-muted-foreground bg-transparent",
  in_progress: "bg-blue-500/10 text-blue-600 border-transparent",
  completed: "bg-emerald-500/10 text-emerald-700 border-transparent",
  verified: "bg-emerald-600 text-white border-transparent",
  cancelled:
    "border-border text-muted-foreground bg-transparent line-through",
};

function PriorityBadge({ priority }: { priority: TaskPriorityType }) {
  const Icon =
    priority === "urgent"
      ? AlertTriangle
      : priority === "high"
        ? ArrowUp
        : priority === "low"
          ? ArrowDown
          : Minus;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1", PRIORITY_STYLES[priority])}
    >
      <Icon className="h-3 w-3" />
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

function StatusBadge({ status }: { status: TaskStatusEnumType }) {
  return (
    <Badge
      variant="outline"
      className={cn(STATUS_STYLES[status])}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}

interface FarmerTasksTableProps {
  title?: string;
  description?: string;
  tasks: FarmerTaskForDailyLogType[];
  loggedTaskIds?: Set<string>;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  /** Limit how many rows to show; the rest are summarised below the table. */
  maxRows?: number;
  className?: string;
}

function FarmerTasksTable({
  title = "Công việc cần ghi nhật ký hôm nay",
  description,
  tasks,
  loggedTaskIds,
  isLoading,
  isError,
  onRetry,
  maxRows,
  className,
}: FarmerTasksTableProps) {
  const sorted = [...tasks].sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
  );
  const visible = maxRows ? sorted.slice(0, maxRows) : sorted;
  const hiddenCount = Math.max(0, sorted.length - visible.length);

  const columns = useMemo<ColumnDef<FarmerTaskForDailyLogType>[]>(
    () => [
      {
        accessorKey: "priority",
        header: "Ưu tiên",
        cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
      },
      {
        accessorKey: "title",
        header: "Công việc",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.title}</p>
            {row.original.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {row.original.description}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "logged",
        header: () => <div className="text-right">Nhật ký</div>,
        cell: ({ row }) => {
          const logged = loggedTaskIds?.has(row.original.id) ?? false;
          return (
            <div className="text-right">
              {logged ? (
                <Badge className="bg-emerald-500/10 text-emerald-700 border-transparent">
                  Đã ghi
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-muted-foreground"
                >
                  Chưa ghi
                </Badge>
              )}
            </div>
          );
        },
      },
    ],
    [loggedTaskIds],
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState
            message="Không thể tải danh sách công việc."
            onRetry={onRetry}
          />
        ) : !isLoading && visible.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Đã hoàn thành"
            description="Hôm nay chưa có công việc nào đang chờ ghi nhật ký."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <DataTable
                columns={columns}
                data={visible}
                isLoading={isLoading}
                pageSize={4}
                emptyText="Hôm nay chưa có công việc."
              />
            </div>
            {hiddenCount > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                Còn {hiddenCount} công việc khác đang chờ.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default FarmerTasksTable;
