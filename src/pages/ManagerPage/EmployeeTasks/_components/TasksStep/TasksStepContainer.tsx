import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import useDebounce from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import {
  useManagerAssignFarmerToTask,
  useManagerBulkAssignEmployeeTasks,
  useManagerBulkDeleteEmployeeTasks,
  useManagerDeleteEmployeeTask,
  useManagerEligibleFarmers,
  useManagerListEmployeeTasks,
  useManagerUnassignFarmerFromTask,
} from "@/queries/useEmployeeTask";
import type {
  EmployeeTaskResType,
  TaskPriorityType,
  TaskStatusType,
} from "@/schemaValidatation/employeeTask";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import ApplyTemplateDialog from "./ApplyTemplateDialog";
import ManualCreateTasksDialog from "./ManualCreateTasksDialog";
import TaskRow from "./TaskRow";
import TasksBatchAssignRow from "./TasksBatchAssignRow";
import TasksCompletionBanner from "./TasksCompletionBanner";
import TasksEmptyState from "./TasksEmptyState";
import TasksToolbar, { type AssignFilter } from "./TasksToolbar";
import { isTaskLocked } from "./task-meta";

// BE chưa có endpoint trả tổng/đã gán cho 1 milestone, cũng chưa filter theo
// trạng thái gán. Lấy hết task (limit 99) rồi đếm + filter + phân trang
// client-side. 1 milestone hiếm khi >99 task; nếu cần, bump số này lên.
const FETCH_ALL_LIMIT = 99;
const PAGE_SIZE = 10;

interface Props {
  milestoneId: string;
  canEdit: boolean;
  /** True khi cropSeason đang ở planning — chỉ ảnh hưởng status select trong row. */
  lockComplete: boolean;
}

function TasksStepContainer({ milestoneId, canEdit }: Props) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatusType | "all">("all");
  const [priority, setPriority] = useState<TaskPriorityType | "all">("all");
  const [assignFilter, setAssignFilter] = useState<AssignFilter>("all");
  const [page, setPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchFarmerId, setBatchFarmerId] = useState("");

  const [showTemplate, setShowTemplate] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [unassignTarget, setUnassignTarget] =
    useState<EmployeeTaskResType | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<EmployeeTaskResType | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const debouncedSearch = useDebounce(search, 350);

  const listQuery = useMemo(
    () => ({ page: 1, limit: FETCH_ALL_LIMIT }),
    [],
  );

  const tasksQuery = useManagerListEmployeeTasks(
    milestoneId,
    listQuery,
    !!milestoneId,
  );
  const farmersQuery = useManagerEligibleFarmers(milestoneId, canEdit);

  const assignMutation = useManagerAssignFarmerToTask(milestoneId);
  const unassignMutation = useManagerUnassignFarmerFromTask(milestoneId);
  const bulkAssignMutation = useManagerBulkAssignEmployeeTasks(milestoneId);
  const deleteMutation = useManagerDeleteEmployeeTask(milestoneId);
  const bulkDeleteMutation = useManagerBulkDeleteEmployeeTasks(milestoneId);

  const allTasks = tasksQuery.data?.data?.data ?? [];
  const farmers = farmersQuery.data?.data ?? [];

  const totalTasks = allTasks.length;
  const assignedCount = useMemo(
    () => allTasks.filter((t) => !!t.assignedTo).length,
    [allTasks],
  );

  const hasActiveFilter =
    debouncedSearch.trim() !== "" ||
    status !== "all" ||
    priority !== "all" ||
    assignFilter !== "all";

  const filteredTasks = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    return allTasks.filter((t) => {
      if (needle && !t.title.toLowerCase().includes(needle)) return false;
      if (status !== "all" && t.status !== status) return false;
      if (priority !== "all" && t.priority !== priority) return false;
      if (assignFilter === "assigned" && !t.assignedTo) return false;
      if (assignFilter === "unassigned" && t.assignedTo) return false;
      return true;
    });
  }, [allTasks, debouncedSearch, status, priority, assignFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedTasks = useMemo(
    () =>
      filteredTasks.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredTasks, safePage],
  );

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setStatus("all");
    setPriority("all");
    setAssignFilter("all");
    setPage(1);
  }, []);

  const handleToggleSelect = useCallback((taskId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setBatchFarmerId("");
  }, []);

  const handleAssign = useCallback(
    (taskId: string, farmerId: string) => {
      assignMutation.mutate({ taskId, body: { farmerId } });
    },
    [assignMutation],
  );

  const handleUnassignConfirm = useCallback(() => {
    if (!unassignTarget) return;
    unassignMutation.mutate(unassignTarget.id, {
      onSuccess: () => setUnassignTarget(null),
    });
  }, [unassignMutation, unassignTarget]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setSelectedIds((prev) => {
          if (!prev.has(deleteTarget.id)) return prev;
          const next = new Set(prev);
          next.delete(deleteTarget.id);
          return next;
        });
        setDeleteTarget(null);
      },
    });
  }, [deleteMutation, deleteTarget]);

  const handleBatchAssign = useCallback(() => {
    if (!batchFarmerId || selectedIds.size === 0) return;
    bulkAssignMutation.mutate(
      { taskIds: Array.from(selectedIds), farmerId: batchFarmerId },
      {
        onSuccess: (res) => {
          if (res.fail === 0) handleClearSelection();
        },
      },
    );
  }, [batchFarmerId, bulkAssignMutation, handleClearSelection, selectedIds]);

  const handleBulkDeleteConfirm = useCallback(() => {
    if (selectedIds.size === 0) return;
    bulkDeleteMutation.mutate(Array.from(selectedIds), {
      onSuccess: (res) => {
        setShowBulkDeleteConfirm(false);
        if (res.fail === 0) handleClearSelection();
      },
    });
  }, [bulkDeleteMutation, handleClearSelection, selectedIds]);

  const handleRefresh = useCallback(() => {
    tasksQuery.refetch();
  }, [tasksQuery]);

  const isAssignPending = assignMutation.isPending || bulkAssignMutation.isPending;

  // ── States: loading / error / empty ────────────────────────────────────
  if (tasksQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (tasksQuery.isError) {
    return (
      <ErrorState
        message="Không thể tải danh sách nhiệm vụ"
        onRetry={() => tasksQuery.refetch()}
      />
    );
  }

  const isFiltered = totalTasks > 0 && filteredTasks.length === 0;

  return (
    <div className="space-y-4">
      <TasksCompletionBanner
        total={totalTasks}
        assigned={assignedCount}
      />

      {totalTasks === 0 ? (
        <TasksEmptyState
          canEdit={canEdit}
          onApplyTemplate={() => setShowTemplate(true)}
          onAddManual={() => setShowManual(true)}
        />
      ) : (
        <>
          <TasksToolbar
            totalCount={totalTasks}
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            status={status}
            onStatusChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            priority={priority}
            onPriorityChange={(v) => {
              setPriority(v);
              setPage(1);
            }}
            assignFilter={assignFilter}
            onAssignFilterChange={(v) => {
              setAssignFilter(v);
              setPage(1);
            }}
            hasActiveFilter={hasActiveFilter}
            onClearFilters={handleClearFilters}
            isFetching={tasksQuery.isFetching}
            onRefresh={handleRefresh}
            canEdit={canEdit}
            onApplyTemplate={() => setShowTemplate(true)}
            onAddManual={() => setShowManual(true)}
          />

          {canEdit && selectedIds.size > 0 && (
            <TasksBatchAssignRow
              selectedCount={selectedIds.size}
              farmers={farmers}
              selectedFarmerId={batchFarmerId}
              onFarmerChange={setBatchFarmerId}
              onAssign={handleBatchAssign}
              onBulkDelete={() => setShowBulkDeleteConfirm(true)}
              onClearSelection={handleClearSelection}
              isAssignPending={bulkAssignMutation.isPending}
              isDeletePending={bulkDeleteMutation.isPending}
            />
          )}

          {isFiltered ? (
            <EmptyState
              icon={Inbox}
              title="Không tìm thấy nhiệm vụ phù hợp"
              description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
              action={{
                label: "Xóa bộ lọc",
                onClick: handleClearFilters,
              }}
            />
          ) : (
            <div
              className={cn(
                "space-y-2",
                tasksQuery.isFetching && "opacity-70 transition-opacity",
              )}
            >
              {canEdit && (
                <BatchSelectHeader
                  pagedTasks={pagedTasks}
                  selectedIds={selectedIds}
                  onToggleAll={(ids, checked) => {
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      if (checked) ids.forEach((id) => next.add(id));
                      else ids.forEach((id) => next.delete(id));
                      return next;
                    });
                  }}
                />
              )}

              {pagedTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  farmers={farmers}
                  isSelected={selectedIds.has(task.id)}
                  onToggleSelect={() => handleToggleSelect(task.id)}
                  canEdit={canEdit}
                  onAssign={(farmerId) => handleAssign(task.id, farmerId)}
                  onUnassign={() => setUnassignTarget(task)}
                  onDelete={() => setDeleteTarget(task)}
                  isPending={isAssignPending}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Trang trước"
              >
                <ChevronLeft
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />
              </Button>
              <span className="text-xs text-muted-foreground">
                Trang {safePage}/{totalPages}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Trang sau"
              >
                <ChevronRight
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />
              </Button>
            </div>
          )}
        </>
      )}

      {canEdit && (
        <>
          <ApplyTemplateDialog
            key={`tpl-${String(showTemplate)}`}
            open={showTemplate}
            onOpenChange={setShowTemplate}
            milestoneId={milestoneId}
            onApplied={handleClearSelection}
          />
          <ManualCreateTasksDialog
            key={`manual-${String(showManual)}`}
            open={showManual}
            onOpenChange={setShowManual}
            milestoneId={milestoneId}
            onCreated={handleClearSelection}
          />
        </>
      )}

      <ConfirmDialog
        open={!!unassignTarget}
        title="Hủy gán nông dân?"
        description='Nhiệm vụ sẽ trở về trạng thái "Chưa giao".'
        confirmLabel={unassignMutation.isPending ? "Đang hủy gán..." : "Hủy gán"}
        cancelLabel="Quay lại"
        variant="destructive"
        onConfirm={handleUnassignConfirm}
        onCancel={() => setUnassignTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa nhiệm vụ?"
        description={
          deleteTarget
            ? `Nhiệm vụ "${deleteTarget.title}" sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.`
            : undefined
        }
        confirmLabel={deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
        cancelLabel="Quay lại"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={showBulkDeleteConfirm}
        title={`Xóa ${selectedIds.size} nhiệm vụ?`}
        description="Các nhiệm vụ đã chọn sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác."
        confirmLabel={
          bulkDeleteMutation.isPending
            ? "Đang xóa..."
            : `Xóa ${selectedIds.size} nhiệm vụ`
        }
        cancelLabel="Quay lại"
        variant="destructive"
        onConfirm={handleBulkDeleteConfirm}
        onCancel={() => setShowBulkDeleteConfirm(false)}
      />
    </div>
  );
}

interface BatchSelectHeaderProps {
  pagedTasks: EmployeeTaskResType[];
  selectedIds: Set<string>;
  onToggleAll: (ids: string[], checked: boolean) => void;
}

function BatchSelectHeader({
  pagedTasks,
  selectedIds,
  onToggleAll,
}: BatchSelectHeaderProps) {
  const selectableIds = pagedTasks
    .filter((t) => !isTaskLocked(t))
    .map((t) => t.id);

  if (selectableIds.length === 0) return null;

  const allSelected = selectableIds.every((id) => selectedIds.has(id));
  const someSelected =
    !allSelected && selectableIds.some((id) => selectedIds.has(id));

  return (
    <div className="flex items-center gap-2 px-1 py-1 text-xs text-muted-foreground">
      <Checkbox
        checked={allSelected ? true : someSelected ? "indeterminate" : false}
        onCheckedChange={(checked) =>
          onToggleAll(selectableIds, checked === true)
        }
        aria-label="Chọn tất cả nhiệm vụ trên trang này"
      />
      <span>
        {allSelected
          ? `Đã chọn tất cả ${selectableIds.length} nhiệm vụ trên trang`
          : `Chọn tất cả ${selectableIds.length} nhiệm vụ trên trang`}
      </span>
    </div>
  );
}

export default TasksStepContainer;
