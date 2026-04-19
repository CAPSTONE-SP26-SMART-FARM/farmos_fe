import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Trash2,
  Pencil,
  MoreVertical,
  ClipboardList,
  Flag,
  AlertTriangle,
  UserPlus,
  UserMinus,
  Eye,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import {
  useOwnerListEmployeeTasks,
  useOwnerCreateEmployeeTaskBatch,
  useOwnerUpdateEmployeeTask,
  useOwnerDeleteEmployeeTask,
  useOwnerAssignFarmerToTask,
  useOwnerUnassignFarmerFromTask,
  useOwnerEligibleFarmers,
} from "@/queries/useEmployeeTask";
import { useOwnerListEmployeeTaskTemplates } from "@/queries/useEmployeeTaskTemplate";
import type {
  EmployeeTaskResType,
  TaskPriorityType,
  TaskStatusType,
  ListEmployeeTasksQueryType,
  CreateEmployeeTaskItemType,
} from "@/schemaValidatation/employeeTask";
import type { EmployeeTaskTemplateResType } from "@/schemaValidatation/employeeTaskTemplate";

import { format } from "date-fns";
import useDebounce from "@/hooks/useDebounce";

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
  pending: { label: "Chờ xử lý", variant: "secondary" },
  in_progress: { label: "Đang thực hiện", variant: "default" },
  completed: { label: "Hoàn thành", variant: "outline" },
  verified: { label: "Đã xác minh", variant: "default" },
  cancelled: { label: "Đã hủy", variant: "destructive" },
};

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

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy");
  } catch {
    return d;
  }
}

function isOverdue(task: EmployeeTaskResType) {
  if (!task.dueDate) return false;
  if (["completed", "verified", "cancelled"].includes(task.status))
    return false;
  return new Date(task.dueDate) < new Date();
}

// ============================================================
// Batch Create Dialog
// ============================================================

type TaskDraft = {
  title: string;
  description: string;
  priority: TaskPriorityType;
  assignedTo: string;
};

const emptyDraft = (): TaskDraft => ({
  title: "",
  description: "",
  priority: "normal",
  assignedTo: "",
});

function BatchCreateDialog({
  open,
  onClose,
  milestoneId,
  farmers,
}: {
  open: boolean;
  onClose: () => void;
  milestoneId: string;
  farmers: Array<{ id: string; label: string }>;
}) {
  const createBatch = useOwnerCreateEmployeeTaskBatch(milestoneId);
  const [drafts, setDrafts] = useState<TaskDraft[]>([emptyDraft()]);

  // ── Template apply ─────────────────────────────────────
  const [templateQuery, setTemplateQuery] = useState({ page: 1, limit: 6 });
  const [templateSearch, setTemplateSearch] = useState("");
  const debouncedTemplateSearch = useDebounce(templateSearch, 500);
  const effectiveTemplateQuery = useMemo(
    () => ({ ...templateQuery, search: debouncedTemplateSearch || undefined }),
    [templateQuery, debouncedTemplateSearch],
  );
  const templateList = useOwnerListEmployeeTaskTemplates(
    effectiveTemplateQuery,
  );
  const templates = templateList.data?.data?.data ?? [];
  const templateMeta = templateList.data?.data?.meta;
  const [showTemplates, setShowTemplates] = useState(false);

  const resetState = () => {
    setDrafts([emptyDraft()]);
    setShowTemplates(false);
    setTemplateSearch("");
    setTemplateQuery({ page: 1, limit: 6 });
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

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
      assignedTo: "",
    }));
    setDrafts((prev) => [...prev.filter((d) => d.title.trim()), ...newDrafts]);
    setShowTemplates(false);
  };

  const handleSubmit = () => {
    const tasks: CreateEmployeeTaskItemType[] = drafts
      .filter((d) => d.title.trim())
      .map((d) => ({
        title: d.title.trim(),
        description: d.description.trim() || null,
        priority: d.priority,
        assignedTo: d.assignedTo || null,
      }));

    if (tasks.length === 0) return;

    createBatch.mutate(
      { tasks },
      {
        onSuccess: () => handleClose(),
      },
    );
  };

  const handleSubmitForm = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !v && handleClose()}
    >
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Tạo nhiệm vụ hàng loạt
          </DialogTitle>
        </DialogHeader>

        {/* Template picker toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            <FileText className="h-4 w-4 mr-1" />
            {showTemplates ? "Ẩn mẫu" : "Áp dụng mẫu"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDrafts((prev) => [...prev, emptyDraft()])}
          >
            <Plus className="h-4 w-4 mr-1" />
            Thêm nhiệm vụ
          </Button>
        </div>

        {/* Template browser */}
        {showTemplates && (
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Chọn mẫu nhiệm vụ</CardTitle>
              <CardDescription className="text-xs">
                Nhấn mẫu để thêm các nhiệm vụ từ mẫu
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-2">
              <Input
                placeholder="Tìm kiếm mẫu..."
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
                  Không tìm thấy mẫu.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className="w-full text-left rounded-md border p-2.5 hover:bg-muted/50 transition-colors"
                    >
                      <p className="text-sm font-medium">{tpl.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tpl.items.length} nhiệm vụ
                        {tpl.description ? ` · ${tpl.description}` : ""}
                      </p>
                    </button>
                  ))}
                  {templateMeta && templateMeta.totalPages > 1 && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={!templateMeta.hasPreviousPage}
                        onClick={() =>
                          setTemplateQuery((q) => ({ ...q, page: q.page - 1 }))
                        }
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {templateMeta.page}/{templateMeta.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={!templateMeta.hasNextPage}
                        onClick={() =>
                          setTemplateQuery((q) => ({ ...q, page: q.page + 1 }))
                        }
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <form
          className="space-y-3"
          onSubmit={handleSubmitForm}
        >
          {/* Draft list */}
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
                        className="min-h-[50px] text-sm"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <Select
                      value={draft.priority}
                      onValueChange={(v) =>
                        updateDraft(idx, { priority: v as TaskPriorityType })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Ưu tiên" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Thấp</SelectItem>
                        <SelectItem value="normal">Bình thường</SelectItem>
                        <SelectItem value="high">Cao</SelectItem>
                        <SelectItem value="urgent">Khẩn cấp</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={draft.assignedTo || "none"}
                      onValueChange={(v) =>
                        updateDraft(idx, { assignedTo: v === "none" ? "" : v })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Giao cho" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Chưa gán</SelectItem>
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Task Detail Sheet
// ============================================================

function TaskDetailSheet({
  task,
  milestoneId,
  onClose,
  canEdit,
  farmers,
  getAssigneeLabel,
}: {
  task: EmployeeTaskResType | null;
  milestoneId: string;
  onClose: () => void;
  canEdit: boolean;
  farmers: Array<{ id: string; label: string }>;
  getAssigneeLabel: (assigneeId: string | null | undefined) => string;
}) {
  const updateMutation = useOwnerUpdateEmployeeTask(milestoneId);
  const assignMutation = useOwnerAssignFarmerToTask(milestoneId);
  const unassignMutation = useOwnerUnassignFarmerFromTask(milestoneId);

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

  if (!task) return null;

  const PriorityIcon = PRIORITY_META[task.priority].icon;

  const handleSave = () => {
    updateMutation.mutate(
      {
        taskId: task.id,
        body: {
          title: editForm.title.trim() || undefined,
          description: editForm.description.trim() || null,
          priority: editForm.priority,
          status: editForm.status,
        },
      },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  const handleSaveForm = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSave();
  };

  const handleAssign = () => {
    if (!farmerIdInput.trim()) return;
    assignMutation.mutate(
      { taskId: task.id, body: { farmerId: farmerIdInput.trim() } },
      {
        onSuccess: () => {
          setShowAssign(false);
          setFarmerIdInput("");
        },
      },
    );
  };

  const handleUnassign = () => {
    unassignMutation.mutate(task.id, {
      onSuccess: () => setConfirmUnassign(false),
    });
  };

  return (
    <>
      <Sheet
        open={!!task}
        onOpenChange={(v) => !v && onClose()}
      >
        <SheetContent
          side="right"
          className="sm:max-w-md overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle className="text-base">{task.title}</SheetTitle>
            <SheetDescription>
              <Badge
                variant={STATUS_META[task.status].variant}
                className="text-xs"
              >
                {STATUS_META[task.status].label}
              </Badge>
              {isOverdue(task) && (
                <Badge
                  variant="destructive"
                  className="text-xs ml-1"
                >
                  Quá hạn
                </Badge>
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 space-y-4">
            {!isEditing ? (
              /* ── Read-only view ── */
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Ưu tiên</p>
                    <p
                      className={`font-medium ${PRIORITY_META[task.priority].className}`}
                    >
                      <PriorityIcon className="h-3.5 w-3.5 inline mr-1" />
                      {PRIORITY_META[task.priority].label}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Trạng thái</p>
                    <p className="font-medium">
                      {STATUS_META[task.status].label}
                    </p>
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
                      <p className="text-xs text-muted-foreground">Xác minh</p>
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

                {canEdit && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={startEditing}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Chỉnh sửa
                    </Button>
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
                  </div>
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
                    className="mt-1 min-h-[60px] text-sm"
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
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
                  <div>
                    <label className="text-xs font-medium">Trạng thái</label>
                    <Select
                      value={editForm.status}
                      onValueChange={(v) =>
                        setEditForm((f) => ({
                          ...f,
                          status: v as TaskStatusType,
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Chờ xử lý</SelectItem>
                        <SelectItem value="in_progress">
                          Đang thực hiện
                        </SelectItem>
                        <SelectItem value="completed">Hoàn thành</SelectItem>
                        <SelectItem value="verified">Đã xác minh</SelectItem>
                        <SelectItem value="cancelled">Đã hủy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Đang lưu..." : "Lưu"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Hủy
                  </Button>
                </div>
              </form>
            )}
          </div>
        </SheetContent>
      </Sheet>

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
            <Input
              placeholder="Nhập ID nông dân"
              value={farmerIdInput}
              onChange={(e) => setFarmerIdInput(e.target.value)}
            />
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAssign(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleAssign}
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
        onConfirm={handleUnassign}
      />
    </>
  );
}

// ============================================================
// Main Section Component
// ============================================================

export default function OwnerMilestoneTasksSection({
  milestoneId,
  canEdit = true,
}: {
  milestoneId: string;
  canEdit?: boolean;
}) {
  const [query, setQuery] = useState<ListEmployeeTasksQueryType>({
    page: 1,
    limit: 6,
  });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const farmersQuery = useOwnerEligibleFarmers(milestoneId);
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
    }),
    [query, debouncedSearch, statusFilter, priorityFilter],
  );

  const { data, isLoading } = useOwnerListEmployeeTasks(
    milestoneId,
    effectiveQuery,
  );
  const tasks = data?.data?.data ?? [];
  const meta = data?.data?.meta;
  const deleteMutation = useOwnerDeleteEmployeeTask(milestoneId);

  const [showCreate, setShowCreate] = useState(false);
  const [selectedTask, setSelectedTask] = useState<EmployeeTaskResType | null>(
    null,
  );
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = (taskId: string) => {
    deleteMutation.mutate(taskId, {
      onSuccess: () => {
        setConfirmDelete(null);
        if (selectedTask?.id === taskId) setSelectedTask(null);
      },
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
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Tạo mới
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Tìm kiếm..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setQuery((q) => ({ ...q, page: 1 }));
          }}
          className="h-7 text-xs w-36"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setQuery((q) => ({ ...q, page: 1 }));
          }}
        >
          <SelectTrigger className="h-7 text-xs w-32">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="pending">Chờ xử lý</SelectItem>
            <SelectItem value="in_progress">Đang thực hiện</SelectItem>
            <SelectItem value="completed">Hoàn thành</SelectItem>
            <SelectItem value="verified">Đã xác minh</SelectItem>
            <SelectItem value="cancelled">Đã hủy</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={priorityFilter}
          onValueChange={(v) => {
            setPriorityFilter(v);
            setQuery((q) => ({ ...q, page: 1 }));
          }}
        >
          <SelectTrigger className="h-7 text-xs w-32">
            <SelectValue placeholder="Ưu tiên" />
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
        <div className="space-y-1.5">
          {tasks.map((task) => {
            const PIcon = PRIORITY_META[task.priority].icon;
            return (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setSelectedTask(task)}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <PIcon
                    className={`h-3.5 w-3.5 shrink-0 ${PRIORITY_META[task.priority].className}`}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-xs">{task.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {getAssigneeLabel(task.assignedTo)}
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
                  <Badge
                    variant={STATUS_META[task.status].variant}
                    className="text-[10px]"
                  >
                    {STATUS_META[task.status].label}
                  </Badge>
                  {canEdit && (
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
                            setSelectedTask(task);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Xem chi tiết
                        </DropdownMenuItem>
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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

      {/* Dialogs */}
      <BatchCreateDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        milestoneId={milestoneId}
        farmers={farmers}
      />

      <TaskDetailSheet
        task={selectedTask}
        milestoneId={milestoneId}
        onClose={() => setSelectedTask(null)}
        canEdit={canEdit}
        farmers={farmers}
        getAssigneeLabel={getAssigneeLabel}
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
    </div>
  );
}
