import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TaskProgressBar } from "@/components/common/TaskProgressBar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  EligibleFarmerResType,
  EmployeeTaskResType,
} from "@/schemaValidatation/employeeTask";
import { format } from "date-fns";
import { CheckCircle2, Trash2, UserMinus, UserPlus } from "lucide-react";
import { memo, useState } from "react";
import {
  PRIORITY_META,
  getTaskDisplayStatus,
  isTaskLocked,
} from "./task-meta";

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy");
  } catch {
    return d;
  }
}

interface Props {
  task: EmployeeTaskResType;
  farmers: EligibleFarmerResType[];
  isSelected: boolean;
  onToggleSelect: () => void;
  canEdit: boolean;
  onAssign: (farmerId: string) => void;
  onUnassign: () => void;
  onDelete: () => void;
  isPending: boolean;
  /** Chỉ hiện thanh tiến độ khi mốc đang thực hiện — lúc khác task chưa chạy nên ẩn. */
  showProgress: boolean;
}

function TaskRowBase({
  task,
  farmers,
  isSelected,
  onToggleSelect,
  canEdit,
  onAssign,
  onUnassign,
  onDelete,
  isPending,
  showProgress,
}: Props) {
  const status = getTaskDisplayStatus(task);
  const priority = PRIORITY_META[task.priority];
  const PriorityIcon = priority.icon;
  const locked = isTaskLocked(task);

  const [draftFarmerId, setDraftFarmerId] = useState<string>("");

  const farmerName = task.assignedTo
    ? (farmers.find((f) => f.userId === task.assignedTo)?.fullName ??
      "Nông dân không còn trong vùng")
    : null;

  const canSelect = canEdit && !locked;
  const canAssign = canEdit && !locked && !!draftFarmerId && !isPending;
  const canUnassign = canEdit && !locked && !!task.assignedTo && !isPending;
  const canDelete = canEdit && !locked && !isPending;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-md border p-3",
        isSelected && "border-primary/50 bg-primary/5",
      )}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggleSelect}
        disabled={!canSelect}
        aria-label={`Chọn nhiệm vụ ${task.title}`}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium">{task.title}</p>
          <Badge
            variant={status.variant}
            className="text-xs"
          >
            {status.label}
          </Badge>
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs",
              priority.className,
            )}
          >
            <PriorityIcon
              className="h-3 w-3"
              aria-hidden="true"
            />
            {priority.label}
          </span>
        </div>

        {task.description && (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>Bắt đầu: {formatDate(task.startDate)}</span>
          <span>Hạn: {formatDate(task.dueDate)}</span>
          {showProgress && (
            <span className="flex items-center gap-1.5">
              <span>Tiến độ:</span>
              <TaskProgressBar value={task.progress} barClassName="w-20" />
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {task.assignedTo ? (
          <>
            <span className="inline-flex items-center gap-1 text-sm">
              <CheckCircle2
                className="h-4 w-4 text-emerald-600"
                aria-hidden="true"
              />
              <span className="font-medium">{farmerName}</span>
            </span>
            {canUnassign && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={onUnassign}
                disabled={isPending}
              >
                <UserMinus
                  className="mr-1 h-3.5 w-3.5"
                  aria-hidden="true"
                />
                Hủy gán
              </Button>
            )}
          </>
        ) : (
          <>
            <Select
              value={draftFarmerId}
              onValueChange={setDraftFarmerId}
              disabled={!canEdit || locked}
            >
              <SelectTrigger
                className="h-9 w-[200px]"
                aria-label={`Chọn người làm cho ${task.title}`}
              >
                <SelectValue placeholder="Chọn người làm" />
              </SelectTrigger>
              <SelectContent>
                {farmers.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    Chưa có nông dân nào đủ điều kiện
                  </div>
                ) : (
                  farmers.map((f) => (
                    <SelectItem
                      key={f.userId}
                      value={f.userId}
                    >
                      {f.fullName}
                      {f.phone ? ` · ${f.phone}` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              type="button"
              size="sm"
              disabled={!canAssign}
              onClick={() => {
                onAssign(draftFarmerId);
                setDraftFarmerId("");
              }}
            >
              <UserPlus
                className="mr-1 h-3.5 w-3.5"
                aria-hidden="true"
              />
              Gán
            </Button>
          </>
        )}

        {canDelete && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onDelete}
            aria-label={`Xóa nhiệm vụ ${task.title}`}
          >
            <Trash2
              className="h-4 w-4"
              aria-hidden="true"
            />
          </Button>
        )}
      </div>
    </div>
  );
}

const TaskRow = memo(TaskRowBase);

export default TaskRow;
