import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  TaskPriorityType,
  TaskStatusType,
} from "@/schemaValidatation/employeeTask";
import {
  PencilLine,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";

const STATUS_OPTIONS: Array<{ value: TaskStatusType; label: string }> = [
  { value: "pending", label: "Chờ xử lý" },
  { value: "in_progress", label: "Đang thực hiện" },
  { value: "completed", label: "Hoàn thành" },
  { value: "verified", label: "Đã xác minh" },
  { value: "cancelled", label: "Đã hủy" },
];

const PRIORITY_OPTIONS: Array<{ value: TaskPriorityType; label: string }> = [
  { value: "low", label: "Thấp" },
  { value: "normal", label: "Bình thường" },
  { value: "high", label: "Cao" },
  { value: "urgent", label: "Khẩn cấp" },
];

const ASSIGN_OPTIONS = [
  { value: "all", label: "Tất cả người làm" },
  { value: "assigned", label: "Đã có người làm" },
  { value: "unassigned", label: "Chưa có người làm" },
] as const;

export type AssignFilter = (typeof ASSIGN_OPTIONS)[number]["value"];

interface Props {
  totalCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  status: TaskStatusType | "all";
  onStatusChange: (value: TaskStatusType | "all") => void;
  priority: TaskPriorityType | "all";
  onPriorityChange: (value: TaskPriorityType | "all") => void;
  assignFilter: AssignFilter;
  onAssignFilterChange: (value: AssignFilter) => void;
  hasActiveFilter: boolean;
  onClearFilters: () => void;
  isFetching: boolean;
  onRefresh: () => void;
  canEdit: boolean;
  onApplyTemplate: () => void;
  onAddManual: () => void;
}

function TasksToolbar({
  totalCount,
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  assignFilter,
  onAssignFilterChange,
  hasActiveFilter,
  onClearFilters,
  isFetching,
  onRefresh,
  canEdit,
  onApplyTemplate,
  onAddManual,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">
            Nhiệm vụ <span className="text-muted-foreground">({totalCount})</span>
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onRefresh}
            disabled={isFetching}
            aria-label="Làm mới danh sách nhiệm vụ"
          >
            <RefreshCw
              className={cn("h-4 w-4", isFetching && "animate-spin")}
              aria-hidden="true"
            />
          </Button>
        </div>

        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={onApplyTemplate}
            >
              <Sparkles
                className="mr-1 h-4 w-4"
                aria-hidden="true"
              />
              Thêm từ mẫu
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onAddManual}
            >
              <PencilLine
                className="mr-1 h-4 w-4"
                aria-hidden="true"
              />
              Thêm tay
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm tên nhiệm vụ..."
            className="h-9 pl-8"
          />
        </div>

        <Select
          value={status}
          onValueChange={(v) => onStatusChange(v as TaskStatusType | "all")}
        >
          <SelectTrigger
            className="h-9 w-[180px]"
            aria-label="Lọc theo trạng thái"
          >
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={priority}
          onValueChange={(v) =>
            onPriorityChange(v as TaskPriorityType | "all")
          }
        >
          <SelectTrigger
            className="h-9 w-[160px]"
            aria-label="Lọc theo ưu tiên"
          >
            <SelectValue placeholder="Ưu tiên" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả ưu tiên</SelectItem>
            {PRIORITY_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={assignFilter}
          onValueChange={(v) => onAssignFilterChange(v as AssignFilter)}
        >
          <SelectTrigger
            className="h-9 w-[200px]"
            aria-label="Lọc theo người làm"
          >
            <SelectValue placeholder="Người làm" />
          </SelectTrigger>
          <SelectContent>
            {ASSIGN_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilter && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
          >
            <X
              className="mr-1 h-3.5 w-3.5"
              aria-hidden="true"
            />
            Xóa bộ lọc
          </Button>
        )}
      </div>
    </div>
  );
}

export default TasksToolbar;
