// src/pages/OwnerPage/CropSeasons/components/MilestoneChangesDialog.tsx
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, ListChecks, Workflow } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TableSkeleton from "@/components/common/TableSkeleton";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { useMilestoneChanges } from "@/queries/useTracking";
import {
  formatTrackingValue,
  getFieldLabel,
  getTrackingActorLines,
} from "@/lib/tracking-display";
import type {
  MilestoneChangeGroupType,
  TrackingEntityType,
  TrackingLogItemType,
} from "@/schemaValidatation/tracking";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cropSeasonId: string;
  milestone: { id: string; label: string } | null;
}

// Số nhóm công việc hiển thị mỗi trang trong dialog (tránh thanh cuộn).
const TASKS_PER_PAGE = 2;

function isEmptyValue(v: unknown): boolean {
  return v === null || v === undefined || v === "";
}

/** Render old → new transition for one tracked field change. */
function renderChange(item: {
  oldValueJson: unknown;
  newValueJson: unknown;
  oldValueLabel?: string | null;
  newValueLabel?: string | null;
  dataType: string;
  entityType: TrackingEntityType;
  fieldName: string;
  changeType?: string;
}) {
  const ctx = { entityType: item.entityType, fieldName: item.fieldName };
  // Ưu tiên label BE đã resolve (vd assignedTo → tên nông dân thật).
  const oldStr =
    item.oldValueLabel ?? formatTrackingValue(item.oldValueJson, item.dataType, ctx);
  const newStr =
    item.newValueLabel ?? formatTrackingValue(item.newValueJson, item.dataType, ctx);
  const oldEmpty = isEmptyValue(item.oldValueJson);
  const newEmpty = isEmptyValue(item.newValueJson);

  if (item.changeType === "snapshot") {
    return (
      <span>
        <span className="text-muted-foreground">Mốc ban đầu: </span>
        <span className="font-medium">{newStr}</span>
      </span>
    );
  }
  if (item.changeType === "create" || (oldEmpty && !newEmpty)) {
    return (
      <span>
        <span className="text-muted-foreground">Ghi nhận: </span>
        <span className="font-medium">{newStr}</span>
      </span>
    );
  }
  if (item.changeType === "delete" || (newEmpty && !oldEmpty)) {
    return (
      <span>
        <span className="text-muted-foreground">Đã xóa giá trị </span>
        <span className="text-muted-foreground/70">(trước đó: {oldStr})</span>
      </span>
    );
  }
  if (oldEmpty && newEmpty) {
    return <span className="text-muted-foreground">Không thay đổi</span>;
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground line-through decoration-muted-foreground/40">
        {oldStr}
      </span>
      <span>→</span>
      <span className="font-medium">{newStr}</span>
    </span>
  );
}

function LogRow({ item }: { item: TrackingLogItemType }) {
  const actor = getTrackingActorLines(item);
  return (
    <li className="flex items-start gap-3 px-3 py-2">
      <span className="w-24 shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">
        {format(parseISO(item.changedAt), "HH:mm dd/MM")}
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <span className="text-muted-foreground">
          {getFieldLabel(item.fieldName)}
        </span>
        <div className="mt-1 text-xs">{renderChange(item)}</div>
        {actor.primary ? (
          <div className="mt-0.5 text-[11px] text-muted-foreground/80">
            bởi {actor.primary}
          </div>
        ) : null}
      </div>
    </li>
  );
}

function ChangeGroup({
  title,
  icon,
  group,
}: {
  title: string;
  icon: ReactNode;
  group: MilestoneChangeGroupType;
}) {
  // Bỏ field kỹ thuật sensorBinding khỏi danh sách hiển thị.
  const logs = group.logs.filter((l) => l.fieldName !== "sensorBinding");
  if (logs.length === 0) return null;
  return (
    <div className="rounded-md border bg-background">
      <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2">
        {icon}
        <span className="truncate text-sm font-semibold">{title}</span>
        <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
          {logs.length} thay đổi
        </Badge>
      </div>
      <ul className="divide-y">
        {logs.map((item) => (
          <LogRow key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}

export default function MilestoneChangesDialog({
  open,
  onOpenChange,
  cropSeasonId,
  milestone,
}: Props) {
  const { data, isLoading, isError, refetch } = useMilestoneChanges(
    cropSeasonId,
    milestone?.id ?? null,
    open,
  );
  const [taskPage, setTaskPage] = useState(1);

  // Reset về trang đầu mỗi khi mở dialog hoặc đổi giai đoạn.
  useEffect(() => {
    setTaskPage(1);
  }, [milestone?.id, open]);

  const detail = data?.data;
  const milestoneLogs =
    detail?.milestone.logs.filter((l) => l.fieldName !== "sensorBinding") ?? [];
  const taskGroups = useMemo(
    () =>
      (detail?.tasks ?? []).filter((t) =>
        t.logs.some((l) => l.fieldName !== "sensorBinding"),
      ),
    [detail?.tasks],
  );
  const hasAnything = milestoneLogs.length > 0 || taskGroups.length > 0;

  const totalTaskPages = Math.max(1, Math.ceil(taskGroups.length / TASKS_PER_PAGE));
  const pagedTasks = taskGroups.slice(
    (taskPage - 1) * TASKS_PER_PAGE,
    taskPage * TASKS_PER_PAGE,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate">
            {milestone?.label ?? "Chi tiết giai đoạn"}
          </DialogTitle>
          <DialogDescription>
            Các thay đổi của giai đoạn và công việc bên trong, theo thời gian.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <TableSkeleton />
        ) : isError ? (
          <ErrorState
            message="Không thể tải chi tiết thay đổi."
            onRetry={() => refetch()}
          />
        ) : !hasAnything ? (
          <EmptyState
            title="Chưa có thay đổi nào"
            description="Giai đoạn này chưa ghi nhận thay đổi nào được theo dõi."
          />
        ) : (
          <div className="space-y-4">
            {detail ? (
              <ChangeGroup
                title="Thay đổi của giai đoạn"
                icon={<Workflow className="h-4 w-4 text-emerald-600" />}
                group={detail.milestone}
              />
            ) : null}

            {taskGroups.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Công việc thay đổi ({taskGroups.length})
                  </p>
                  {totalTaskPages > 1 ? (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        disabled={taskPage <= 1}
                        onClick={() => setTaskPage((p) => p - 1)}
                        aria-label="Trang trước"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="px-1 text-xs tabular-nums text-muted-foreground">
                        {taskPage}/{totalTaskPages}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        disabled={taskPage >= totalTaskPages}
                        onClick={() => setTaskPage((p) => p + 1)}
                        aria-label="Trang sau"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null}
                </div>
                {pagedTasks.map((task) => (
                  <ChangeGroup
                    key={task.entityId}
                    title={task.label ?? "Công việc"}
                    icon={<ListChecks className="h-4 w-4 text-sky-600" />}
                    group={task}
                  />
                ))}
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
