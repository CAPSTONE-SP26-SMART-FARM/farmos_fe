// src/pages/OwnerPage/CropSeasons/components/MilestoneChangesDialog.tsx
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  User,
  Workflow,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

// Field không hiển thị trong nhật ký thay đổi: sensorBinding (kỹ thuật), progress (tiến độ — nhiễu).
const HIDDEN_TRACKING_FIELDS = new Set(["sensorBinding", "progress"]);
const isVisibleField = (fieldName: string) => !HIDDEN_TRACKING_FIELDS.has(fieldName);

// ── Phân loại field → tông màu để timeline có điểm nhấn dễ quét mắt ──────────
type FieldTone = "status" | "date" | "person" | "text";

function getFieldTone(fieldName: string, dataType: string): FieldTone {
  if (fieldName === "status") return "status";
  if (fieldName === "assignedTo" || fieldName === "priority") return "person";
  if (dataType === "date" || dataType === "datetime") return "date";
  return "text";
}

const DOT_CLASS: Record<FieldTone, string> = {
  status: "bg-emerald-500",
  date: "bg-sky-500",
  person: "bg-amber-500",
  text: "bg-slate-400",
};

const NEW_PILL_CLASS: Record<FieldTone, string> = {
  status: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  date: "bg-sky-50 text-sky-700 ring-sky-200",
  person: "bg-amber-50 text-amber-700 ring-amber-200",
  text: "bg-muted text-foreground ring-border",
};

function isEmptyValue(v: unknown): boolean {
  return v === null || v === undefined || v === "";
}

/** Pill bọc 1 giá trị — cũ (gạch ngang) hoặc mới (màu theo tông field). */
function ValuePill({
  children,
  variant,
  tone,
}: {
  children: ReactNode;
  variant: "old" | "new";
  tone: FieldTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center truncate rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        variant === "old"
          ? "bg-muted/60 text-muted-foreground line-through decoration-muted-foreground/40 ring-transparent"
          : NEW_PILL_CLASS[tone],
      )}
    >
      {children}
    </span>
  );
}

/** Render old → new transition for one tracked field change. */
function ChangeValue({
  item,
  tone,
}: {
  tone: FieldTone;
  item: {
    oldValueJson: unknown;
    newValueJson: unknown;
    oldValueLabel?: string | null;
    newValueLabel?: string | null;
    dataType: string;
    entityType: TrackingEntityType;
    fieldName: string;
    changeType?: string;
  };
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
      <span className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Mốc ban đầu</span>
        <ValuePill variant="new" tone={tone}>
          {newStr}
        </ValuePill>
      </span>
    );
  }
  if (item.changeType === "create") {
    return (
      <span className="flex flex-wrap items-center gap-1.5">
        <ValuePill variant="new" tone={tone}>
          {newStr}
        </ValuePill>
      </span>
    );
  }
  if (oldEmpty && !newEmpty) {
    return (
      <span className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Ghi nhận</span>
        <ValuePill variant="new" tone={tone}>
          {newStr}
        </ValuePill>
      </span>
    );
  }
  if (item.changeType === "delete" || (newEmpty && !oldEmpty)) {
    return (
      <span className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Đã xóa</span>
        <ValuePill variant="old" tone={tone}>
          {oldStr}
        </ValuePill>
      </span>
    );
  }
  if (oldEmpty && newEmpty) {
    return <span className="text-xs text-muted-foreground">Không thay đổi</span>;
  }
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <ValuePill variant="old" tone={tone}>
        {oldStr}
      </ValuePill>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <ValuePill variant="new" tone={tone}>
        {newStr}
      </ValuePill>
    </span>
  );
}

function LogRow({ item, isLast }: { item: TrackingLogItemType; isLast: boolean }) {
  const actor = getTrackingActorLines(item);
  const tone = getFieldTone(item.fieldName, item.dataType);
  return (
    <li className="flex gap-3">
      {/* ── Rail: chấm màu + đường nối dọc ── */}
      <div className="flex flex-col items-center self-stretch">
        <span
          className={cn(
            "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-background",
            DOT_CLASS[tone],
          )}
        />
        {!isLast ? <span className="w-px flex-1 bg-border" /> : null}
      </div>

      {/* ── Nội dung thay đổi ── */}
      <div className={cn("min-w-0 flex-1", isLast ? "pb-0" : "pb-4")}>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium text-foreground">
            {getFieldLabel(item.fieldName)}
          </span>
          <time className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
            {format(parseISO(item.changedAt), "HH:mm dd/MM")}
          </time>
        </div>
        <div className="mt-1.5">
          <ChangeValue item={item} tone={tone} />
        </div>
        {actor.primary ? (
          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <User className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{actor.primary}</span>
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
  // Bỏ các field ẩn (sensorBinding kỹ thuật, progress tiến độ) khỏi danh sách hiển thị.
  const visibleLogs = group.logs.filter((l) => isVisibleField(l.fieldName));
  // "Phát sinh" = công việc tạo lúc mùa vụ đang active (createdInPlan=false). Dựa thẳng vào cờ từ BE.
  const isNewlyCreated = group.createdInPlan === false;
  // Dòng `create` chỉ có nghĩa với task phát sinh — giữ đúng 1 dòng `status` để task vừa phát sinh
  // vẫn xuất hiện (kèm badge). Với task baseline (tạo lúc planning), dòng create là dữ liệu thừa/cũ:
  // giá trị đầu đã là vế "từ" của thay đổi đầu tiên nên bỏ hẳn, chỉ còn các thay đổi thật.
  const logs = visibleLogs.filter((l) => {
    if (l.changeType !== "create") return true;
    return isNewlyCreated && l.fieldName === "status";
  });
  if (logs.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
      <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
        {icon}
        <span className="truncate text-sm font-semibold">{title}</span>
        {isNewlyCreated ? (
          <Badge className="shrink-0 border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700">
            Phát sinh
          </Badge>
        ) : null}
        <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
          {logs.length} thay đổi
        </Badge>
      </div>
      <ul className="px-4 py-3">
        {logs.map((item, idx) => (
          <LogRow key={item.id} item={item} isLast={idx === logs.length - 1} />
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
    detail?.milestone.logs.filter((l) => isVisibleField(l.fieldName)) ?? [];
  const taskGroups = useMemo(
    () =>
      (detail?.tasks ?? []).filter((t) =>
        t.logs.some((l) => isVisibleField(l.fieldName)),
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
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            {detail ? (
              <ChangeGroup
                title="Thay đổi của giai đoạn"
                icon={<Workflow className="h-4 w-4 shrink-0 text-emerald-600" />}
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
                    icon={<ListChecks className="h-4 w-4 shrink-0 text-sky-600" />}
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
