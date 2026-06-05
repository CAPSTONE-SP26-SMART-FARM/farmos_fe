import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskProgressBar } from "@/components/common/TaskProgressBar";
import { Textarea } from "@/components/ui/textarea";
import useDebounce from "@/hooks/useDebounce";
import { TaskLogHistoryPanel } from "@/pages/ManagerPage/CropSeasons/components/TaskLogHistoryPanel";
import {
  useManagerAssignFarmerToTask,
  useManagerBulkDeleteEmployeeTasks,
  useManagerBulkUnassignEmployeeTasks,
  useManagerCompleteEmployeeTask,
  useManagerCreateEmployeeTaskBatch,
  useManagerDeleteEmployeeTask,
  useManagerEligibleFarmers,
  useManagerEmployeeTaskDetail,
  useManagerListEmployeeTasks,
  useManagerUnassignFarmerFromTask,
  useManagerUpdateEmployeeTask,
} from "@/queries/useEmployeeTask";
import { MilestoneTasksBulkActionBar } from "./_components/MilestoneTasksBulkActionBar";
import { useManagerListEmployeeTaskTemplates } from "@/queries/useEmployeeTaskTemplate";
import type {
  CreateEmployeeTaskItemType,
  EmployeeTaskResType,
  ListEmployeeTasksQueryType,
  TaskPriorityType,
  TaskStatusType,
} from "@/schemaValidatation/employeeTask";
import type { EmployeeTaskTemplateResType } from "@/schemaValidatation/employeeTaskTemplate";
import { format } from "date-fns";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  Flag,
  MoreVertical,
  NotebookPen,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

// ============================================================
// Constants
// ============================================================

const STATUS_META: Record<
  TaskStatusType,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  pending: { label: "Chưa bắt đầu", variant: "secondary" },
  in_progress: { label: "Đang thực hiện", variant: "default" },
  completed: { label: "Hoàn thành", variant: "outline" },
  verified: { label: "Đã xác minh", variant: "default" },
  cancelled: { label: "Đã hủy", variant: "destructive" },
};

function getTaskDisplayStatus(task: EmployeeTaskResType): {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
} {
  if (task.status === "cancelled")
    return { label: "Đã hủy", variant: "destructive" };
  if (task.status === "verified")
    return { label: "Đã xác minh", variant: "default" };
  if (task.status === "completed")
    return { label: "Hoàn thành", variant: "outline" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (task.dueDate && new Date(task.dueDate) < today) {
    return { label: "Quá hạn", variant: "destructive" };
  }

  return (
    STATUS_META[task.status] ?? { label: task.status, variant: "secondary" }
  );
}

const PRIORITY_META: Record<
  TaskPriorityType,
  { label: string; className: string; icon: typeof Flag }
> = {
  low: { label: "Thấp", className: "text-muted-foreground", icon: Flag },
  normal: { label: "Bình thường", className: "text-foreground", icon: Flag },
  high: { label: "Cao", className: "text-orange-600", icon: AlertTriangle },
  urgent: {
    label: "Khẩn cấp",
    className: "text-destructive",
    icon: AlertTriangle,
  },
};

const CHILDREN_CONTAINER_MOTION = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.03,
    },
  },
};

const CHILD_ITEM_MOTION: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: "easeOut",
    },
  },
};

const CHILD_TOGGLE_MOTION = {
  initial: { opacity: 0, y: -6, height: 0 },
  animate: {
    opacity: 1,
    y: 0,
    height: "auto",
    transition: { duration: 0.2, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    y: -4,
    height: 0,
    transition: { duration: 0.16, ease: "easeInOut" as const },
  },
};

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy");
  } catch {
    return d;
  }
}

// Task đã chốt — không cho sửa, xóa, gán/hủy gán nông dân nữa, chỉ xem.
function isTaskLocked(task: EmployeeTaskResType) {
  return task.status === "completed" || task.status === "verified";
}

function isOverdue(task: EmployeeTaskResType) {
  if (!task.dueDate) return false;
  if (["completed", "verified", "cancelled"].includes(task.status))
    return false;
  return new Date(task.dueDate) < new Date();
}

// ============================================================
// Batch Create Inline Panel
// ============================================================

type TaskDraft = {
  title: string;
  description: string;
  priority: TaskPriorityType;
};

const emptyDraft = (): TaskDraft => ({
  title: "",
  description: "",
  priority: "normal",
});

function BatchCreateInlinePanel({
  milestoneId,
  onCreated,
  onCancel,
}: {
  milestoneId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const createBatch = useManagerCreateEmployeeTaskBatch(milestoneId);
  const [drafts, setDrafts] = useState<TaskDraft[]>([emptyDraft()]);

  const [templateQuery, setTemplateQuery] = useState({ page: 1, limit: 6 });
  const [templateSearch, setTemplateSearch] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [previewTemplate, setPreviewTemplate] =
    useState<EmployeeTaskTemplateResType | null>(null);

  const debouncedTemplateSearch = useDebounce(templateSearch, 500);
  const effectiveTemplateQuery = useMemo(
    () => ({ ...templateQuery, search: debouncedTemplateSearch || undefined }),
    [templateQuery, debouncedTemplateSearch],
  );
  const templateList = useManagerListEmployeeTaskTemplates(
    effectiveTemplateQuery,
  );
  const templates = templateList.data?.data?.data ?? [];
  const templateMeta = templateList.data?.data?.meta;

  const updateDraft = (idx: number, patch: Partial<TaskDraft>) => {
    setDrafts((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)),
    );
  };

  const removeDraft = (idx: number) => {
    setDrafts((prev) => prev.filter((_, i) => i !== idx));
  };

  const applyTemplate = (tpl: EmployeeTaskTemplateResType) => {
    const newDrafts: TaskDraft[] = tpl.items.map((item) => ({
      title: item.title,
      description: item.description ?? "",
      priority: item.priority as TaskPriorityType,
    }));
    setDrafts(newDrafts.length > 0 ? newDrafts : [emptyDraft()]);
    setShowTemplates(false);
    setPreviewTemplate(null);
  };

  const handleSubmit = () => {
    const tasks: CreateEmployeeTaskItemType[] = drafts
      .filter((d) => d.title.trim())
      .map((d) => ({
        title: d.title.trim(),
        description: d.description.trim() || null,
        priority: d.priority,
      }));

    if (tasks.length === 0) return;

    createBatch.mutate(
      { tasks },
      {
        onSuccess: () => {
          setDrafts([emptyDraft()]);
          onCreated();
        },
      },
    );
  };

  const handleSubmitForm = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit();
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          Tạo nhiệm vụ hàng loạt
        </CardTitle>
        <CardDescription className="text-xs">
          Chọn mẫu để điền nhanh form bên dưới hoặc nhập thủ công.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowTemplates((prev) => !prev)}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            {showTemplates ? "Ẩn template" : "Chọn template"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDrafts((prev) => [...prev, emptyDraft()])}
          >
            <Plus className="h-4 w-4 mr-1" />
            Thêm nhiệm vụ
          </Button>
        </div>

        <AnimatePresence initial={false}>
          {showTemplates && (
            <motion.div
              key="template-list"
              initial={CHILD_TOGGLE_MOTION.initial}
              animate={CHILD_TOGGLE_MOTION.animate}
              exit={CHILD_TOGGLE_MOTION.exit}
              className="overflow-hidden"
            >
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm">Danh sách template</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-2">
                  <Input
                    placeholder="Tìm template..."
                    value={templateSearch}
                    onChange={(e) => {
                      setTemplateSearch(e.target.value);
                      setTemplateQuery((q) => ({ ...q, page: 1 }));
                    }}
                    className="h-8 text-sm"
                  />
                  {templateList.isLoading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : templates.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">
                      Không tìm thấy template.
                    </p>
                  ) : (
                    <motion.div
                      className="space-y-1.5"
                      variants={CHILDREN_CONTAINER_MOTION}
                      initial="hidden"
                      animate="visible"
                    >
                      {templates.map((tpl) => (
                        <motion.div
                          key={tpl.id}
                          variants={CHILD_ITEM_MOTION}
                          className="rounded-md border p-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">{tpl.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {tpl.items.length} nhiệm vụ
                                {tpl.description ? ` · ${tpl.description}` : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                onClick={() => setPreviewTemplate(tpl)}
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                Xem
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => applyTemplate(tpl)}
                              >
                                Chọn
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {templateMeta && templateMeta.totalPages > 1 && (
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={!templateMeta.hasPreviousPage}
                            onClick={() =>
                              setTemplateQuery((q) => ({
                                ...q,
                                page: q.page - 1,
                              }))
                            }
                          >
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            {templateMeta.page}/{templateMeta.totalPages}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={!templateMeta.hasNextPage}
                            onClick={() =>
                              setTemplateQuery((q) => ({
                                ...q,
                                page: q.page + 1,
                              }))
                            }
                          >
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <form
          className="space-y-3"
          onSubmit={handleSubmitForm}
        >
          <div className="space-y-3">
            {drafts.map((draft, idx) => (
              <Card key={idx}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Tiêu đề nhiệm vụ *"
                        value={draft.title}
                        onChange={(e) =>
                          updateDraft(idx, { title: e.target.value })
                        }
                        className="h-8 text-sm"
                      />
                      <Textarea
                        placeholder="Mô tả (tùy chọn)"
                        value={draft.description}
                        onChange={(e) =>
                          updateDraft(idx, { description: e.target.value })
                        }
                        className="min-h-12.5 text-sm"
                      />
                    </div>
                    {drafts.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => removeDraft(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <Select
                    value={draft.priority}
                    onValueChange={(v) =>
                      updateDraft(idx, { priority: v as TaskPriorityType })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs max-w-55">
                      <SelectValue placeholder="Ưu tiên" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Thấp</SelectItem>
                      <SelectItem value="normal">Bình thường</SelectItem>
                      <SelectItem value="high">Cao</SelectItem>
                      <SelectItem value="urgent">Khẩn cấp</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={
                createBatch.isPending || drafts.every((d) => !d.title.trim())
              }
            >
              {createBatch.isPending
                ? "Đang tạo..."
                : `Tạo ${drafts.filter((d) => d.title.trim()).length} nhiệm vụ`}
            </Button>
          </div>
        </form>
      </CardContent>

      <Dialog
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Chi tiết template</DialogTitle>
            <CardDescription className="text-xs">
              {previewTemplate?.name}
            </CardDescription>
          </DialogHeader>

          <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-1.5">
            {previewTemplate?.items.map((item) => (
              <div
                key={item.id}
                className="rounded-md border px-2 py-1.5 text-xs"
              >
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-muted-foreground">
                  {item.description || "Không có mô tả"}
                </p>
                <p className="text-muted-foreground mt-0.5">
                  Ưu tiên: {PRIORITY_META[item.priority].label}
                </p>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPreviewTemplate(null)}
            >
              Đóng
            </Button>
            <Button
              onClick={() => previewTemplate && applyTemplate(previewTemplate)}
              disabled={!previewTemplate}
            >
              Dùng template này
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ============================================================
// Task Detail Sheet
// ============================================================

function TaskDetailSheet({
  taskId,
  milestoneId,
  zoneId,
  onClose,
  canEdit,
  farmers,
  getAssigneeLabel,
  lockComplete = false,
  canEditContent = true,
}: {
  taskId: string | null;
  milestoneId: string;
  /**
   * Cần để load log history theo `employeeTaskId` từ endpoint zone-scope.
   * Khi không truyền → ẩn tab "Nhật ký" (caller cũ không bị break).
   */
  zoneId?: string;
  onClose: () => void;
  canEdit: boolean;
  farmers: Array<{ id: string; label: string }>;
  getAssigneeLabel: (assigneeId: string | null | undefined) => string;
  /**
   * Khi `true` (vd cropSeason đang ở planning):
   *   - Ẩn nút "Hoàn thành"
   *   - Khoá Select trạng thái về read-only
   * Vì tasks chưa được phép tiến triển khi vụ mùa chưa được phê duyệt.
   */
  lockComplete?: boolean;
  /**
   * Cho phép sửa nội dung task (title/description/priority).
   * Chỉ nên `true` khi cropSeason ở planning / rejected — các trạng thái khác
   * (active, completed, ...) task đã chốt nội dung, chỉ thao tác trạng thái.
   */
  canEditContent?: boolean;
}) {
  const updateMutation = useManagerUpdateEmployeeTask(milestoneId);
  const assignMutation = useManagerAssignFarmerToTask(milestoneId);
  const unassignMutation = useManagerUnassignFarmerFromTask(milestoneId);
  const completeMutation = useManagerCompleteEmployeeTask(milestoneId);

  // Mở dialog ngay khi click → fetch detail riêng, hiện skeleton trong khi load.
  // Detail query có cache key riêng, nên các mutation (assign/unassign/...)
  // invalidate detail key sẽ tự refetch & dialog reflect data mới.
  const detailQuery = useManagerEmployeeTaskDetail(
    taskId ?? "",
    milestoneId,
    !!taskId,
  );
  const task = detailQuery.data?.data ?? null;
  const isLoadingDetail = !!taskId && (detailQuery.isLoading || !task);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "normal" as TaskPriorityType,
    status: "pending" as TaskStatusType,
  });
  const [farmerIdInput, setFarmerIdInput] = useState("");
  const [showAssign, setShowAssign] = useState(false);
  const [confirmUnassign, setConfirmUnassign] = useState(false);

  const startEditing = () => {
    if (task) {
      setEditForm({
        title: task.title,
        description: task.description ?? "",
        priority: task.priority,
        status: task.status,
      });
    }
    setIsEditing(true);
  };

  const PriorityIcon = task ? PRIORITY_META[task.priority].icon : null;

  const handleSave = () => {
    if (!task) return;
    updateMutation.mutate(
      {
        taskId: task.id,
        body: {
          title: editForm.title.trim() || undefined,
          description: editForm.description.trim() || null,
          priority: editForm.priority,
        },
      },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  const handleSaveForm = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSave();
  };

  return (
    <>
      <Dialog
        open={!!taskId}
        onOpenChange={(v) => {
          if (!v) {
            setIsEditing(false);
            onClose();
          }
        }}
      >
        <DialogContent
          className="sm:max-w-2xl max-h-[85vh] overflow-y-auto"
          onPointerDownOutside={(e) => {
            if (confirmUnassign || showAssign) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (confirmUnassign || showAssign) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-base">
              {task ? task.title : "Đang tải nhiệm vụ..."}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="flex flex-wrap gap-1">
                {task ? (
                  <>
                    <Badge
                      variant={getTaskDisplayStatus(task).variant}
                      className="text-xs"
                    >
                      {getTaskDisplayStatus(task).label}
                    </Badge>
                    {isOverdue(task) && (
                      <Badge
                        variant="destructive"
                        className="text-xs"
                      >
                        Quá hạn
                      </Badge>
                    )}
                  </>
                ) : (
                  <Skeleton className="h-5 w-20" />
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetail || !task ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {!isEditing ? (
                /* ── Read-only view: detail + logs gộp chung ── */
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Ưu tiên</p>
                      <p
                        className={`font-medium ${PRIORITY_META[task.priority].className}`}
                      >
                        {PriorityIcon && (
                          <PriorityIcon className="h-3.5 w-3.5 inline mr-1" />
                        )}
                        {PRIORITY_META[task.priority].label}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Trạng thái
                      </p>
                      <p className="font-medium">
                        {STATUS_META[task.status].label}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Tiến độ</p>
                      <TaskProgressBar
                        value={task.progress}
                        className="mt-1"
                        barClassName="w-40"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Người được gán
                      </p>
                      <p>{getAssigneeLabel(task.assignedTo)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Ngày gán</p>
                      <p>{formatDate(task.assignedDate)}</p>
                    </div>
                    {task.completedAt && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Hoàn thành
                        </p>
                        <p>{formatDate(task.completedAt)}</p>
                      </div>
                    )}
                    {task.verifiedAt && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Xác minh
                        </p>
                        <p>{formatDate(task.verifiedAt)}</p>
                      </div>
                    )}
                  </div>

                  {task.description && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Mô tả
                        </p>
                        <p className="text-sm whitespace-pre-line">
                          {task.description}
                        </p>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>Tạo lúc: {formatDate(task.createdAt)}</p>
                    <p>Cập nhật: {formatDate(task.updatedAt)}</p>
                  </div>

                  {zoneId && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-semibold flex items-center gap-1.5 mb-2">
                          <NotebookPen className="h-3.5 w-3.5" />
                          Nhật ký
                        </p>
                        <TaskLogHistoryPanel
                          zoneId={zoneId}
                          employeeTaskId={task.id}
                        />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* ── Edit form ── */
                <form
                  className="space-y-3"
                  onSubmit={handleSaveForm}
                >
                  <div>
                    <label className="text-xs font-medium">Tiêu đề</label>
                    <Input
                      className="mt-1 h-8 text-sm"
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, title: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Mô tả</label>
                    <Textarea
                      className="mt-1 min-h-15 text-sm"
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Ưu tiên</label>
                    <Select
                      value={editForm.priority}
                      onValueChange={(v) =>
                        setEditForm((f) => ({
                          ...f,
                          priority: v as TaskPriorityType,
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Thấp</SelectItem>
                        <SelectItem value="normal">Bình thường</SelectItem>
                        <SelectItem value="high">Cao</SelectItem>
                        <SelectItem value="urgent">Khẩn cấp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </form>
              )}
            </div>
          )}

          {task && (
            <DialogFooter>
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Đang lưu..." : "Lưu"}
                  </Button>
                </>
              ) : canEdit && !isTaskLocked(task) ? (
                <>
                  {!task.assignedTo ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAssign(true)}
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1" />
                      Gán nông dân
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmUnassign(true)}
                    >
                      <UserMinus className="h-3.5 w-3.5 mr-1" />
                      Hủy gán
                    </Button>
                  )}
                  {canEditContent && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={startEditing}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Chỉnh sửa
                    </Button>
                  )}
                  {!lockComplete &&
                    (task.status === "pending" ||
                      task.status === "in_progress") && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={completeMutation.isPending}
                        onClick={() =>
                          completeMutation.mutate(task.id, {
                            onSuccess: () => onClose(),
                          })
                        }
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Hoàn thành
                      </Button>
                    )}
                </>
              ) : null}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign farmer dialog */}
      <Dialog
        open={showAssign}
        onOpenChange={(v) => !v && setShowAssign(false)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Gán nông dân</DialogTitle>
          </DialogHeader>
          {farmers.length > 0 ? (
            <Select
              value={farmerIdInput || "none"}
              onValueChange={(v) => setFarmerIdInput(v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn nông dân" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Chọn nông dân</SelectItem>
                {farmers.map((farmer) => (
                  <SelectItem
                    key={farmer.id}
                    value={farmer.id}
                  >
                    {farmer.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground">
              Không tìm thấy nông dân thuộc trang trại này.
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAssign(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (!task || !farmerIdInput.trim()) return;
                assignMutation.mutate(
                  { taskId: task.id, body: { farmerId: farmerIdInput.trim() } },
                  {
                    onSuccess: () => {
                      setShowAssign(false);
                      setFarmerIdInput("");
                    },
                  },
                );
              }}
              disabled={assignMutation.isPending || !farmerIdInput.trim()}
            >
              {assignMutation.isPending ? "Đang gán..." : "Gán"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmUnassign}
        title="Hủy gán nông dân?"
        description="Nông dân sẽ không còn được gán cho nhiệm vụ này."
        confirmLabel="Hủy gán"
        variant="destructive"
        onCancel={() => setConfirmUnassign(false)}
        onConfirm={() => {
          if (!task) return;
          unassignMutation.mutate(task.id, {
            onSuccess: () => setConfirmUnassign(false),
          });
        }}
      />
    </>
  );
}

export function ManagerMilestoneTaskAssignmentScreen({
  milestoneId,
  canEdit = true,
  initialTaskId,
  onBack,
}: {
  milestoneId: string;
  canEdit?: boolean;
  initialTaskId?: string;
  onBack: () => void;
}) {
  const [query, setQuery] = useState<ListEmployeeTasksQueryType>({
    page: 1,
    limit: 10,
  });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [createdInPlanFilter, setCreatedInPlanFilter] = useState<string>("all");
  const [sortByDueDate, setSortByDueDate] = useState<"asc" | "desc" | "none">(
    "none",
  );
  const [farmerSelections, setFarmerSelections] = useState<
    Record<string, string>
  >({});
  const [confirmUnassignTask, setConfirmUnassignTask] =
    useState<EmployeeTaskResType | null>(null);

  const effectiveQuery = useMemo(
    () => ({
      ...query,
      search: debouncedSearch || undefined,
      status:
        statusFilter !== "all" ? (statusFilter as TaskStatusType) : undefined,
      priority:
        priorityFilter !== "all"
          ? (priorityFilter as TaskPriorityType)
          : undefined,
      createdInPlan:
        createdInPlanFilter === "planned"
          ? true
          : createdInPlanFilter === "adhoc"
            ? false
            : undefined,
      sortByDueDate: sortByDueDate !== "none" ? sortByDueDate : undefined,
    }),
    [
      query,
      debouncedSearch,
      statusFilter,
      priorityFilter,
      createdInPlanFilter,
      sortByDueDate,
    ],
  );

  const { data, isLoading } = useManagerListEmployeeTasks(
    milestoneId,
    effectiveQuery,
  );
  const tasks = data?.data?.data ?? [];
  const meta = data?.data?.meta;

  const farmersQuery = useManagerEligibleFarmers(milestoneId);
  const farmers = useMemo(() => {
    const rows = farmersQuery.data?.data ?? [];
    return rows.map((f) => ({
      id: f.userId,
      label: `${f.fullName}${f.phone ? ` · ${f.phone}` : ""}`,
    }));
  }, [farmersQuery.data?.data]);
  const farmerMap = useMemo(
    () => new Map(farmers.map((f) => [f.id, f.label])),
    [farmers],
  );
  const getAssigneeLabel = (assigneeId: string | null | undefined) => {
    if (!assigneeId) return "Chưa gán";
    return farmerMap.get(assigneeId) ?? `Nông dân #${assigneeId.slice(0, 8)}`;
  };

  const assignMutation = useManagerAssignFarmerToTask(milestoneId);
  const unassignMutation = useManagerUnassignFarmerFromTask(milestoneId);

  const handleAssign = (taskId: string) => {
    const farmerId = farmerSelections[taskId]?.trim();
    if (!farmerId) return;

    assignMutation.mutate(
      { taskId, body: { farmerId } },
      {
        onSuccess: () => {
          setFarmerSelections((prev) => ({ ...prev, [taskId]: "" }));
        },
      },
    );
  };

  const handleUnassign = () => {
    if (!confirmUnassignTask) return;
    unassignMutation.mutate(confirmUnassignTask.id, {
      onSuccess: () => setConfirmUnassignTask(null),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold flex items-center gap-1.5">
            <UserPlus className="h-4 w-4" />
            Gán nhân viên cho nhiệm vụ
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Màn hình riêng để gán hoặc hủy gán nông dân theo từng nhiệm vụ.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={onBack}
        >
          Quay lại chi tiết mốc
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Tìm nhiệm vụ..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setQuery((q) => ({ ...q, page: 1 }));
          }}
          className="h-8 text-xs w-44"
        />
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Trạng thái:
          </span>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setQuery((q) => ({ ...q, page: 1 }));
            }}
          >
            <SelectTrigger className="h-8 text-xs w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Chưa bắt đầu</SelectItem>
              <SelectItem value="in_progress">Đang thực hiện</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
              <SelectItem value="verified">Đã xác minh</SelectItem>
              <SelectItem value="cancelled">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Ưu tiên:
          </span>
          <Select
            value={priorityFilter}
            onValueChange={(v) => {
              setPriorityFilter(v);
              setQuery((q) => ({ ...q, page: 1 }));
            }}
          >
            <SelectTrigger className="h-8 text-xs w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="low">Thấp</SelectItem>
              <SelectItem value="normal">Bình thường</SelectItem>
              <SelectItem value="high">Cao</SelectItem>
              <SelectItem value="urgent">Khẩn cấp</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Loại:
          </span>
          <Select
            value={createdInPlanFilter}
            onValueChange={(v) => {
              setCreatedInPlanFilter(v);
              setQuery((q) => ({ ...q, page: 1 }));
            }}
          >
            <SelectTrigger className="h-8 text-xs w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="planned">Kế hoạch</SelectItem>
              <SelectItem value="adhoc">Phát sinh</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Deadline:
          </span>
          <Select
            value={sortByDueDate}
            onValueChange={(v) => {
              setSortByDueDate(v as "asc" | "desc" | "none");
              setQuery((q) => ({ ...q, page: 1 }));
            }}
          >
            <SelectTrigger className="h-8 text-xs w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Mặc định</SelectItem>
              <SelectItem value="asc">Gần nhất</SelectItem>
              <SelectItem value="desc">Xa nhất</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(search ||
          statusFilter !== "all" ||
          priorityFilter !== "all" ||
          createdInPlanFilter !== "all" ||
          sortByDueDate !== "none") && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setPriorityFilter("all");
              setCreatedInPlanFilter("all");
              setSortByDueDate("none");
              setQuery((q) => ({ ...q, page: 1 }));
            }}
          >
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : tasks.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Không có nhiệm vụ phù hợp bộ lọc.
        </p>
      ) : (
        <motion.div
          className="space-y-2"
          variants={CHILDREN_CONTAINER_MOTION}
          initial="hidden"
          animate="visible"
        >
          {tasks.map((task) => {
            const isHighlighted = initialTaskId === task.id;
            return (
              <motion.div
                key={task.id}
                variants={CHILD_ITEM_MOTION}
                className={`rounded-md border p-3 space-y-2 ${
                  isHighlighted ? "border-primary ring-1 ring-primary/30" : ""
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    {task.createdInPlan === false && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-purple-100 text-purple-700 mt-1"
                      >
                        Công việc phát sinh
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        PRIORITY_META[task.priority].className.includes(
                          "destructive",
                        )
                          ? "destructive"
                          : "outline"
                      }
                      className="text-[10px]"
                    >
                      {PRIORITY_META[task.priority].label}
                    </Badge>
                    <Badge
                      variant={getTaskDisplayStatus(task).variant}
                      className="text-[10px]"
                    >
                      {getTaskDisplayStatus(task).label}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="text-[10px]"
                  >
                    {getAssigneeLabel(task.assignedTo)}
                  </Badge>
                  {task.startDate && (
                    <span className="text-[11px] text-muted-foreground">
                      Bắt đầu: {formatDate(task.startDate)}
                    </span>
                  )}
                  {task.assignedDate && (
                    <span className="text-[11px] text-muted-foreground">
                      Gán lúc {formatDate(task.assignedDate)}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    Tiến độ:
                    <TaskProgressBar value={task.progress} barClassName="w-16" />
                  </span>
                </div>

                {canEdit && !isTaskLocked(task) && (
                  <AnimatePresence
                    mode="wait"
                    initial={false}
                  >
                    {!task.assignedTo ? (
                      <motion.div
                        key={`${task.id}-assign`}
                        className="flex flex-wrap items-center gap-2"
                        initial={CHILD_TOGGLE_MOTION.initial}
                        animate={CHILD_TOGGLE_MOTION.animate}
                        exit={CHILD_TOGGLE_MOTION.exit}
                      >
                        <Select
                          value={farmerSelections[task.id] || "none"}
                          onValueChange={(v) =>
                            setFarmerSelections((prev) => ({
                              ...prev,
                              [task.id]: v === "none" ? "" : v,
                            }))
                          }
                        >
                          <SelectTrigger className="h-8 text-xs w-56">
                            <SelectValue placeholder="Chọn nông dân" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Chọn nông dân</SelectItem>
                            {farmers.map((farmer) => (
                              <SelectItem
                                key={farmer.id}
                                value={farmer.id}
                              >
                                {farmer.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {(() => {
                          // Chỉ disable / "Đang gán..." cho ĐÚNG row đang mutate,
                          // không phải mọi row dùng chung mutation instance.
                          const isAssigningThis =
                            assignMutation.isPending &&
                            assignMutation.variables?.taskId === task.id;
                          return (
                            <Button
                              size="sm"
                              className="h-8"
                              onClick={() => handleAssign(task.id)}
                              disabled={
                                isAssigningThis ||
                                !farmerSelections[task.id]?.trim()
                              }
                            >
                              {isAssigningThis ? "Đang gán..." : "Gán"}
                            </Button>
                          );
                        })()}
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`${task.id}-unassign`}
                        initial={CHILD_TOGGLE_MOTION.initial}
                        animate={CHILD_TOGGLE_MOTION.animate}
                        exit={CHILD_TOGGLE_MOTION.exit}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => setConfirmUnassignTask(task)}
                          disabled={
                            unassignMutation.isPending &&
                            unassignMutation.variables === task.id
                          }
                        >
                          <UserMinus className="h-3.5 w-3.5 mr-1" />
                          Hủy gán
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            {meta.totalItems} nhiệm vụ
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={!meta.hasPreviousPage}
              onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={!meta.hasNextPage}
              onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmUnassignTask}
        title="Hủy gán nông dân?"
        description="Nông dân sẽ không còn được gán cho nhiệm vụ này."
        confirmLabel="Hủy gán"
        variant="destructive"
        onCancel={() => setConfirmUnassignTask(null)}
        onConfirm={handleUnassign}
      />
    </div>
  );
}

// ============================================================
// Main Section Component
// ============================================================

export default function ManagerMilestoneTasksSection({
  milestoneId,
  zoneId,
  canEdit = true,
  lockComplete = false,
  canEditContent = true,
}: {
  milestoneId: string;
  /**
   * Cần để TaskDetailSheet load log history theo `employeeTaskId` qua endpoint
   * zone-scope `/daily-logs/manager/zone/:zoneId`. Optional — caller cũ không
   * truyền sẽ chỉ ẩn tab "Nhật ký" trong sheet, không break.
   */
  zoneId?: string;
  canEdit?: boolean;
  /**
   * Khi cropSeason ở planning (chưa được phê duyệt), task chưa nên tiến triển.
   * `lockComplete=true` → ẩn DropdownMenuItem "Hoàn thành" trên list, ẩn nút
   * "Hoàn thành" trong TaskDetailSheet, và khoá Select trạng thái về read-only
   * khi user bấm "Chỉnh sửa".
   */
  lockComplete?: boolean;
  /**
   * Cho phép sửa nội dung task (title/description/priority) trong dialog detail.
   * Chỉ nên `true` khi cropSeason ở planning / rejected.
   */
  canEditContent?: boolean;
}) {
  const [query, setQuery] = useState<ListEmployeeTasksQueryType>({
    page: 1,
    limit: 6,
  });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [createdInPlanFilter, setCreatedInPlanFilter] = useState<string>("all");
  const [sortByDueDate, setSortByDueDate] = useState<"asc" | "desc" | "none">(
    "none",
  );

  const effectiveQuery = useMemo(
    () => ({
      ...query,
      search: debouncedSearch || undefined,
      status:
        statusFilter !== "all" ? (statusFilter as TaskStatusType) : undefined,
      priority:
        priorityFilter !== "all"
          ? (priorityFilter as TaskPriorityType)
          : undefined,
      createdInPlan:
        createdInPlanFilter === "planned"
          ? true
          : createdInPlanFilter === "adhoc"
            ? false
            : undefined,
      sortByDueDate: sortByDueDate !== "none" ? sortByDueDate : undefined,
    }),
    [
      query,
      debouncedSearch,
      statusFilter,
      priorityFilter,
      createdInPlanFilter,
      sortByDueDate,
    ],
  );

  const { data, isLoading } = useManagerListEmployeeTasks(
    milestoneId,
    effectiveQuery,
  );
  const tasks = data?.data?.data ?? [];
  const meta = data?.data?.meta;
  const deleteMutation = useManagerDeleteEmployeeTask(milestoneId);
  const assignMutation = useManagerAssignFarmerToTask(milestoneId);
  const unassignMutation = useManagerUnassignFarmerFromTask(milestoneId);
  const completeMutation = useManagerCompleteEmployeeTask(milestoneId);
  const bulkDeleteMutation = useManagerBulkDeleteEmployeeTasks(milestoneId);
  const bulkUnassignMutation =
    useManagerBulkUnassignEmployeeTasks(milestoneId);

  const farmersQuery = useManagerEligibleFarmers(milestoneId);
  const farmers = useMemo(() => {
    const rows = farmersQuery.data?.data ?? [];
    return rows.map((f) => ({
      id: f.userId,
      label: `${f.fullName}${f.phone ? ` · ${f.phone}` : ""}`,
    }));
  }, [farmersQuery.data?.data]);
  const farmerMap = useMemo(
    () => new Map(farmers.map((f) => [f.id, f.label])),
    [farmers],
  );
  const getAssigneeLabel = (assigneeId: string | null | undefined) => {
    if (!assigneeId) return "Chưa gán";
    return farmerMap.get(assigneeId) ?? `Nông dân #${assigneeId.slice(0, 8)}`;
  };

  const [showCreate, setShowCreate] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [farmerSelections, setFarmerSelections] = useState<
    Record<string, string>
  >({});
  const [confirmUnassignTask, setConfirmUnassignTask] =
    useState<EmployeeTaskResType | null>(null);

  // ── Multi-select state ──
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [confirmBulkUnassign, setConfirmBulkUnassign] = useState(false);
  const bulkPending =
    bulkDeleteMutation.isPending || bulkUnassignMutation.isPending;

  // Clear selection when context that changes the visible list changes.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [
    milestoneId,
    query.page,
    debouncedSearch,
    statusFilter,
    priorityFilter,
    createdInPlanFilter,
    sortByDueDate,
  ]);

  const selectableIds = useMemo(
    () => tasks.filter((t) => !isTaskLocked(t)).map((t) => t.id),
    [tasks],
  );
  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedIds.has(id));
  const hasAssignedSelection = useMemo(
    () => tasks.some((t) => selectedIds.has(t.id) && !!t.assignedTo),
    [tasks, selectedIds],
  );

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const isAll =
        selectableIds.length > 0 &&
        selectableIds.every((id) => prev.has(id));
      return isAll ? new Set() : new Set(selectableIds);
    });
  }, [selectableIds]);

  const handleToggleSelectMode = useCallback(() => {
    setSelectMode((v) => !v);
    setSelectedIds(new Set());
  }, []);

  const handleBulkDelete = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    bulkDeleteMutation.mutate(ids, {
      onSettled: () => {
        setSelectedIds(new Set());
        setConfirmBulkDelete(false);
      },
    });
  }, [bulkDeleteMutation, selectedIds]);

  const handleBulkUnassign = useCallback(() => {
    const ids = tasks
      .filter((t) => selectedIds.has(t.id) && !!t.assignedTo)
      .map((t) => t.id);
    if (ids.length === 0) return;
    bulkUnassignMutation.mutate(ids, {
      onSettled: () => {
        setSelectedIds(new Set());
        setConfirmBulkUnassign(false);
      },
    });
  }, [bulkUnassignMutation, tasks, selectedIds]);

  const handleDelete = (taskId: string) => {
    deleteMutation.mutate(taskId, {
      onSuccess: () => {
        setConfirmDelete(null);
        if (selectedTaskId === taskId) setSelectedTaskId(null);
      },
    });
  };

  const handleAssign = (taskId: string) => {
    const farmerId = farmerSelections[taskId]?.trim();
    if (!farmerId) return;

    assignMutation.mutate(
      { taskId, body: { farmerId } },
      {
        onSuccess: () => {
          setFarmerSelections((prev) => ({ ...prev, [taskId]: "" }));
        },
      },
    );
  };

  const handleUnassign = () => {
    if (!confirmUnassignTask) return;
    unassignMutation.mutate(confirmUnassignTask.id, {
      onSuccess: () => setConfirmUnassignTask(null),
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4" />
            Nhiệm vụ nhân viên
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge
              variant="outline"
              className="text-[10px]"
            >
              Task thực thi theo mốc
            </Badge>
            <Badge
              variant="secondary"
              className="text-[10px]"
            >
              Template chỉ dùng để tạo nháp
            </Badge>
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowCreate((prev) => !prev)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              {showCreate ? "Đóng form" : "Tạo mới"}
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {showCreate && canEdit && (
          <motion.div
            key="task-create-panel"
            initial={CHILD_TOGGLE_MOTION.initial}
            animate={CHILD_TOGGLE_MOTION.animate}
            exit={CHILD_TOGGLE_MOTION.exit}
            className="overflow-hidden"
          >
            <BatchCreateInlinePanel
              milestoneId={milestoneId}
              onCreated={() => setShowCreate(false)}
              onCancel={() => setShowCreate(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Tìm kiếm..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setQuery((q) => ({ ...q, page: 1 }));
          }}
          className="h-7 text-xs w-36"
        />
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Trạng thái:
          </span>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setQuery((q) => ({ ...q, page: 1 }));
            }}
          >
            <SelectTrigger className="h-7 text-xs w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Chưa bắt đầu</SelectItem>
              <SelectItem value="in_progress">Đang thực hiện</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
              <SelectItem value="verified">Đã xác minh</SelectItem>
              <SelectItem value="cancelled">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Ưu tiên:
          </span>
          <Select
            value={priorityFilter}
            onValueChange={(v) => {
              setPriorityFilter(v);
              setQuery((q) => ({ ...q, page: 1 }));
            }}
          >
            <SelectTrigger className="h-7 text-xs w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="low">Thấp</SelectItem>
              <SelectItem value="normal">Bình thường</SelectItem>
              <SelectItem value="high">Cao</SelectItem>
              <SelectItem value="urgent">Khẩn cấp</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Loại:
          </span>
          <Select
            value={createdInPlanFilter}
            onValueChange={(v) => {
              setCreatedInPlanFilter(v);
              setQuery((q) => ({ ...q, page: 1 }));
            }}
          >
            <SelectTrigger className="h-7 text-xs w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="planned">Kế hoạch</SelectItem>
              <SelectItem value="adhoc">Phát sinh</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Deadline:
          </span>
          <Select
            value={sortByDueDate}
            onValueChange={(v) => {
              setSortByDueDate(v as "asc" | "desc" | "none");
              setQuery((q) => ({ ...q, page: 1 }));
            }}
          >
            <SelectTrigger className="h-7 text-xs w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Mặc định</SelectItem>
              <SelectItem value="asc">Gần nhất</SelectItem>
              <SelectItem value="desc">Xa nhất</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(search ||
          statusFilter !== "all" ||
          priorityFilter !== "all" ||
          createdInPlanFilter !== "all" ||
          sortByDueDate !== "none") && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setPriorityFilter("all");
              setCreatedInPlanFilter("all");
              setSortByDueDate("none");
              setQuery((q) => ({ ...q, page: 1 }));
            }}
          >
            Xóa bộ lọc
          </Button>
        )}
        {canEdit && (
          <Button
            variant={selectMode ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs ml-auto"
            onClick={handleToggleSelectMode}
          >
            {selectMode ? "Thoát chọn nhiều" : "Chọn nhiều"}
          </Button>
        )}
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : tasks.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          Chưa có nhiệm vụ nào.
        </p>
      ) : (
        <motion.div
          className="space-y-1.5"
          variants={CHILDREN_CONTAINER_MOTION}
          initial="hidden"
          animate="visible"
        >
          {tasks.map((task) => {
            const PIcon = PRIORITY_META[task.priority].icon;
            const isSelected = selectedIds.has(task.id);
            const locked = isTaskLocked(task);
            const selectableInMode = selectMode && !locked;
            return (
              <motion.div
                key={task.id}
                variants={CHILD_ITEM_MOTION}
                className={`rounded-md border px-3 py-2 text-sm transition-colors space-y-2 ${
                  selectMode && locked
                    ? "opacity-60"
                    : "hover:bg-muted/50 cursor-pointer"
                } ${
                  isSelected
                    ? "bg-primary/5 border-primary/40"
                    : ""
                }`}
                onClick={() => {
                  if (selectMode) {
                    if (selectableInMode) toggleOne(task.id);
                  } else {
                    setSelectedTaskId(task.id);
                  }
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {selectMode && (
                      <Checkbox
                        checked={isSelected}
                        disabled={locked || bulkPending}
                        onCheckedChange={() => toggleOne(task.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Chọn nhiệm vụ ${task.title}`}
                      />
                    )}
                    <PIcon
                      className={`h-3.5 w-3.5 shrink-0 ${PRIORITY_META[task.priority].className}`}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-xs">
                        {task.title}
                      </p>
                      {task.createdInPlan === false && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-purple-100 text-purple-700"
                        >
                          Phát sinh
                        </Badge>
                      )}
                      <p className="text-[10px] text-muted-foreground truncate">
                        {getAssigneeLabel(task.assignedTo)}
                        {task.startDate && (
                          <span className="ml-1.5">
                            · Bắt đầu: {formatDate(task.startDate)}
                          </span>
                        )}
                      </p>
                    </div>
                    {isOverdue(task) && (
                      <Badge
                        variant="destructive"
                        className="text-[10px] shrink-0"
                      >
                        Quá hạn
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <TaskProgressBar
                      value={task.progress}
                      barClassName="w-14"
                      className="hidden sm:flex"
                    />
                    <Badge
                      variant={getTaskDisplayStatus(task).variant}
                      className="text-[10px]"
                    >
                      {getTaskDisplayStatus(task).label}
                    </Badge>
                    {canEdit && !selectMode && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTaskId(task.id);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          {!isTaskLocked(task) &&
                            !lockComplete &&
                            (task.status === "pending" ||
                              task.status === "in_progress") && (
                              <DropdownMenuItem
                                disabled={completeMutation.isPending}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  completeMutation.mutate(task.id);
                                }}
                                className="text-emerald-600 focus:text-emerald-600"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Hoàn thành
                              </DropdownMenuItem>
                            )}
                          {!isTaskLocked(task) && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDelete(task.id);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {canEdit && !selectMode && !isTaskLocked(task) && (
                  <AnimatePresence
                    mode="wait"
                    initial={false}
                  >
                    {!task.assignedTo ? (
                      <motion.div
                        key={`${task.id}-main-assign`}
                        className="flex flex-wrap items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                        initial={CHILD_TOGGLE_MOTION.initial}
                        animate={CHILD_TOGGLE_MOTION.animate}
                        exit={CHILD_TOGGLE_MOTION.exit}
                      >
                        <Select
                          value={farmerSelections[task.id] || "none"}
                          onValueChange={(v) =>
                            setFarmerSelections((prev) => ({
                              ...prev,
                              [task.id]: v === "none" ? "" : v,
                            }))
                          }
                        >
                          <SelectTrigger className="h-7 text-xs w-56">
                            <SelectValue placeholder="Chọn nông dân" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Chọn nông dân</SelectItem>
                            {farmers.map((farmer) => (
                              <SelectItem
                                key={farmer.id}
                                value={farmer.id}
                              >
                                {farmer.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {(() => {
                          // Chỉ disable / "Đang gán..." cho ĐÚNG row đang mutate,
                          // không phải mọi row dùng chung mutation instance.
                          const isAssigningThis =
                            assignMutation.isPending &&
                            assignMutation.variables?.taskId === task.id;
                          return (
                            <Button
                              size="sm"
                              className="h-7"
                              onClick={() => handleAssign(task.id)}
                              disabled={
                                isAssigningThis ||
                                !farmerSelections[task.id]?.trim()
                              }
                            >
                              {isAssigningThis ? "Đang gán..." : "Gán ngay"}
                            </Button>
                          );
                        })()}
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`${task.id}-main-unassign`}
                        onClick={(e) => e.stopPropagation()}
                        initial={CHILD_TOGGLE_MOTION.initial}
                        animate={CHILD_TOGGLE_MOTION.animate}
                        exit={CHILD_TOGGLE_MOTION.exit}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7"
                          onClick={() => setConfirmUnassignTask(task)}
                          disabled={
                            unassignMutation.isPending &&
                            unassignMutation.variables === task.id
                          }
                        >
                          <UserMinus className="h-3.5 w-3.5 mr-1" />
                          Hủy gán
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            {meta.totalItems} nhiệm vụ
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={!meta.hasPreviousPage}
              onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={!meta.hasNextPage}
              onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      {selectMode && selectedIds.size > 0 && (
        <MilestoneTasksBulkActionBar
          selectedCount={selectedIds.size}
          hasAssignedSelection={hasAssignedSelection}
          allSelected={allSelected}
          isPending={bulkPending}
          onToggleAll={toggleAll}
          onClear={() => setSelectedIds(new Set())}
          onRequestDelete={() => setConfirmBulkDelete(true)}
          onRequestUnassign={() => setConfirmBulkUnassign(true)}
        />
      )}

      <TaskDetailSheet
        taskId={selectedTaskId}
        canEditContent={canEditContent}
        milestoneId={milestoneId}
        zoneId={zoneId}
        onClose={() => setSelectedTaskId(null)}
        canEdit={canEdit}
        farmers={farmers}
        getAssigneeLabel={getAssigneeLabel}
        lockComplete={lockComplete}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Xóa nhiệm vụ?"
        description="Nhiệm vụ sẽ bị xóa vĩnh viễn."
        confirmLabel="Xóa"
        variant="destructive"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
      />

      <ConfirmDialog
        open={!!confirmUnassignTask}
        title="Hủy gán nông dân?"
        description="Nông dân sẽ không còn được gán cho nhiệm vụ này."
        confirmLabel="Hủy gán"
        variant="destructive"
        onCancel={() => setConfirmUnassignTask(null)}
        onConfirm={handleUnassign}
      />

      <ConfirmDialog
        open={confirmBulkDelete}
        title={`Xóa ${selectedIds.size} nhiệm vụ?`}
        description="Các nhiệm vụ đã chọn sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác."
        confirmLabel={bulkDeleteMutation.isPending ? "Đang xóa..." : "Xóa"}
        variant="destructive"
        onCancel={() => setConfirmBulkDelete(false)}
        onConfirm={handleBulkDelete}
      />

      <ConfirmDialog
        open={confirmBulkUnassign}
        title="Hủy gán nông dân hàng loạt?"
        description="Các nhiệm vụ đã chọn (đang có nông dân) sẽ được gỡ gán. Bạn có thể gán lại sau."
        confirmLabel={
          bulkUnassignMutation.isPending ? "Đang hủy gán..." : "Hủy gán"
        }
        variant="destructive"
        onCancel={() => setConfirmBulkUnassign(false)}
        onConfirm={handleBulkUnassign}
      />
    </div>
  );
}
