import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
  RefreshCw,
  CalendarDays,
  GripVertical,
} from "lucide-react";
import { useEffect, useState, type DragEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import {
  useManagerListProductionMilestones,
  useManagerCreateProductionMilestoneBatch,
  useManagerUpdateProductionMilestone,
  useManagerDeleteProductionMilestone,
} from "@/queries/useProductionMilestone";
import { useManagerListMilestoneTemplates } from "@/queries/useMilestoneTemplate";
import { useManagerCropSeasonDetail } from "@/queries/useCropSeason";
import type {
  ProductionMilestoneResType,
  ProductionMilestoneStatusType,
} from "@/schemaValidatation/productionMilestone";
import type { MilestoneTemplateResType } from "@/schemaValidatation/milestoneTemplate";
import { ProductionStatusName } from "@/types/cropSeason";
import {
  addDays,
  format,
  isAfter,
  isBefore,
  isValid,
  parse,
  startOfDay,
} from "date-fns";
import { toast } from "sonner";

// ============================================================
// Helpers
// ============================================================

const STATUS_META: Record<
  ProductionMilestoneStatusType,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  pending: { label: "Chờ xử lý", variant: "secondary" },
  in_progress: { label: "Đang thực hiện", variant: "default" },
  completed: { label: "Hoàn thành", variant: "outline" },
};

// ============================================================
// Create / Edit Milestone
// ============================================================

const DATE_DISPLAY_FORMAT = "dd/MM/yyyy";
const DATE_PAYLOAD_FORMAT = "yyyy-MM-dd";

function parseBackendDate(value: string | null | undefined) {
  if (!value) return undefined;
  const parsed = parse(value, DATE_PAYLOAD_FORMAT, new Date());
  if (isValid(parsed)) return parsed;

  const fallback = new Date(value);
  return isValid(fallback) ? fallback : undefined;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = parseBackendDate(value);
  return parsed ? format(parsed, DATE_DISPLAY_FORMAT) : value;
}

function formatPickerDate(value: string | null | undefined) {
  const parsed = parseBackendDate(value);
  return parsed ? format(parsed, DATE_DISPLAY_FORMAT) : "";
}

const DatePickerField = ({
  label,
  value,
  error,
  placeholder,
  onChange,
  minDate,
}: {
  label: string;
  value: string;
  error?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  minDate?: Date;
}) => {
  const normalizedMinDate = minDate ? startOfDay(minDate) : undefined;

  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="mt-1 w-full justify-between text-left font-normal"
          >
            {value ? (
              formatPickerDate(value)
            ) : (
              <span className="text-muted-foreground">
                {placeholder ?? "Chọn ngày"}
              </span>
            )}
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
        >
          <Calendar
            mode="single"
            selected={parseBackendDate(value)}
            onSelect={(date) =>
              onChange(date ? format(date, DATE_PAYLOAD_FORMAT) : "")
            }
            disabled={(date) =>
              normalizedMinDate
                ? isBefore(startOfDay(date), normalizedMinDate)
                : false
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
};

type MilestoneEditMode = "planning" | "approved";

type MilestoneEditFormState = {
  stageName: string;
  milestoneOrder: number;
  expectedStartDate: string;
  expectedEndDate: string;
  actualStartDate: string;
  actualEndDate: string;
  status: ProductionMilestoneStatusType;
};

type MilestoneEditFormErrors = Partial<
  Record<keyof MilestoneEditFormState, string>
>;

const validateMilestoneEditForm = (
  values: MilestoneEditFormState,
  mode: MilestoneEditMode,
): MilestoneEditFormErrors => {
  const errors: MilestoneEditFormErrors = {};

  if (mode === "planning" && !values.stageName.trim()) {
    errors.stageName = "Tên giai đoạn là bắt buộc.";
  }

  const expectedStartDate = parseBackendDate(values.expectedStartDate);
  const expectedEndDate = parseBackendDate(values.expectedEndDate);
  const actualStartDate = parseBackendDate(values.actualStartDate);
  const actualEndDate = parseBackendDate(values.actualEndDate);

  if (mode === "planning") {
    if (values.expectedStartDate && !expectedStartDate) {
      errors.expectedStartDate = "Ngày bắt đầu dự kiến không hợp lệ.";
    }
    if (values.expectedEndDate && !expectedEndDate) {
      errors.expectedEndDate = "Ngày kết thúc dự kiến không hợp lệ.";
    }
    if (
      expectedStartDate &&
      expectedEndDate &&
      !isAfter(startOfDay(expectedEndDate), startOfDay(expectedStartDate))
    ) {
      errors.expectedEndDate =
        "Ngày kết thúc dự kiến phải sau ngày bắt đầu dự kiến.";
    }
  }

  if (values.actualStartDate && !actualStartDate) {
    errors.actualStartDate = "Ngày bắt đầu thực tế không hợp lệ.";
  }
  if (values.actualEndDate && !actualEndDate) {
    errors.actualEndDate = "Ngày kết thúc thực tế không hợp lệ.";
  }
  if (
    actualStartDate &&
    actualEndDate &&
    !isAfter(startOfDay(actualEndDate), startOfDay(actualStartDate))
  ) {
    errors.actualEndDate =
      "Ngày kết thúc thực tế phải sau ngày bắt đầu thực tế.";
  }

  return errors;
};

const MilestoneEditFormFields = ({
  form,
  errors,
  mode,
  onChange,
}: {
  form: MilestoneEditFormState;
  errors: MilestoneEditFormErrors;
  mode: MilestoneEditMode;
  onChange: <K extends keyof MilestoneEditFormState>(
    key: K,
    value: MilestoneEditFormState[K],
  ) => void;
}) => {
  const parsedExpectedStartDate = parseBackendDate(form.expectedStartDate);
  const minExpectedEndDate = parsedExpectedStartDate
    ? addDays(startOfDay(parsedExpectedStartDate), 1)
    : undefined;

  const parsedActualStartDate = parseBackendDate(form.actualStartDate);
  const minActualEndDate = parsedActualStartDate
    ? addDays(startOfDay(parsedActualStartDate), 1)
    : undefined;

  return (
    <div className="space-y-3 py-2">
      {mode === "planning" ? (
        <>
          <div>
            <label className="text-sm font-medium">Tên giai đoạn *</label>
            <Input
              className="mt-1"
              placeholder="Ví dụ: Nảy mầm"
              value={form.stageName}
              onChange={(e) => onChange("stageName", e.target.value)}
            />
            {errors.stageName && (
              <p className="text-xs text-destructive mt-1">
                {errors.stageName}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <DatePickerField
              label="Ngày bắt đầu dự kiến"
              placeholder="Chọn ngày bắt đầu"
              value={form.expectedStartDate}
              error={errors.expectedStartDate}
              onChange={(value) => onChange("expectedStartDate", value)}
            />
            <DatePickerField
              label="Ngày kết thúc dự kiến"
              placeholder="Chọn ngày kết thúc"
              value={form.expectedEndDate}
              error={errors.expectedEndDate}
              onChange={(value) => onChange("expectedEndDate", value)}
              minDate={minExpectedEndDate}
            />
          </div>
        </>
      ) : (
        <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground space-y-1">
          <p>
            <span className="font-medium text-foreground">Giai đoạn:</span>{" "}
            {form.stageName}
          </p>
          <p>
            <span className="font-medium text-foreground">Dự kiến:</span>{" "}
            {formatDate(form.expectedStartDate)}
            {form.expectedEndDate
              ? ` → ${formatDate(form.expectedEndDate)}`
              : ""}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <DatePickerField
          label="Ngày bắt đầu thực tế"
          placeholder="Chọn ngày bắt đầu"
          value={form.actualStartDate}
          error={errors.actualStartDate}
          onChange={(value) => onChange("actualStartDate", value)}
        />
        <DatePickerField
          label="Ngày kết thúc thực tế"
          placeholder="Chọn ngày kết thúc"
          value={form.actualEndDate}
          error={errors.actualEndDate}
          onChange={(value) => onChange("actualEndDate", value)}
          minDate={minActualEndDate}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Trạng thái</label>
        <Select
          value={form.status}
          onValueChange={(v) =>
            onChange("status", v as ProductionMilestoneStatusType)
          }
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Chờ xử lý</SelectItem>
            <SelectItem value="in_progress">Đang thực hiện</SelectItem>
            <SelectItem value="completed">Hoàn thành</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

const MilestoneEditDialog = ({
  open,
  onClose,
  onSubmit,
  initialValues,
  isSubmitting,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: MilestoneEditFormState) => void;
  initialValues: MilestoneEditFormState;
  isSubmitting: boolean;
  mode: MilestoneEditMode;
}) => {
  const [form, setForm] = useState<MilestoneEditFormState>(initialValues);
  const [errors, setErrors] = useState<MilestoneEditFormErrors>({});

  useEffect(() => {
    if (!open) return;
    setForm(initialValues);
    setErrors({});
  }, [open, initialValues]);

  const update = <K extends keyof MilestoneEditFormState>(
    key: K,
    value: MilestoneEditFormState[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    const nextErrors = validateMilestoneEditForm(form, mode);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(form);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "approved" ? "Cập nhật vận hành mốc" : "Chỉnh sửa mốc"}
          </DialogTitle>
        </DialogHeader>
        <MilestoneEditFormFields
          form={form}
          errors={errors}
          mode={mode}
          onChange={update}
        />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

type DraftMilestoneItem = {
  stageName: string;
  milestoneOrder: number;
  expectedStartDate: string;
  expectedEndDate: string;
  status: ProductionMilestoneStatusType;
};

const createEmptyDraft = (milestoneOrder: number): DraftMilestoneItem => ({
  stageName: "",
  milestoneOrder,
  expectedStartDate: "",
  expectedEndDate: "",
  status: "pending",
});

const CreateMilestonesScreen = ({
  cropSeasonId,
  cropSeasonLabel,
  initialStartDate,
  nextMilestoneOrder,
  onBack,
}: {
  cropSeasonId: string;
  cropSeasonLabel: string;
  initialStartDate: string;
  nextMilestoneOrder: number;
  onBack: () => void;
}) => {
  const [show, setShow] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templatePage, setTemplatePage] = useState(1);
  const [templateStartDate, setTemplateStartDate] = useState(initialStartDate);
  const [showTemplates, setShowTemplates] = useState(false);

  // Template preview & unified draft state
  const [previewTemplate, setPreviewTemplate] =
    useState<MilestoneTemplateResType | null>(null);
  const [pendingTemplate, setPendingTemplate] =
    useState<MilestoneTemplateResType | null>(null);
  const [draftItems, setDraftItems] = useState<DraftMilestoneItem[]>([
    createEmptyDraft(nextMilestoneOrder),
  ]);

  const createBatchMutation =
    useManagerCreateProductionMilestoneBatch(cropSeasonId);

  const templateQuery = useManagerListMilestoneTemplates({
    page: templatePage,
    limit: 6,
    search: templateSearch || undefined,
    type: "crop_season",
  });
  const templates = templateQuery.data?.data.data ?? [];
  const templateMeta = templateQuery.data?.data.meta;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    setTemplatePage(1);
  }, [templateSearch]);

  const buildTemplateItems = (template: MilestoneTemplateResType) => {
    const sortedTemplateItems = template.items
      .slice()
      .sort((a, b) => a.milestoneOrder - b.milestoneOrder);

    if (sortedTemplateItems.length === 0) {
      toast.error("Mẫu được chọn không có mục mốc nào.");
      return null;
    }

    const startDate = parseBackendDate(templateStartDate);
    const normalizedStartDate = startDate ? startOfDay(startDate) : undefined;
    let dayOffset = 0;

    const items = sortedTemplateItems.map((item, index) => {
      dayOffset += Math.max(item.daysBetween ?? 0, 0);
      const expectedStartDate = normalizedStartDate
        ? format(addDays(normalizedStartDate, dayOffset), DATE_PAYLOAD_FORMAT)
        : null;

      return {
        stageName: item.stageName.trim(),
        milestoneOrder: nextMilestoneOrder + index,
        expectedStartDate,
        expectedEndDate: null,
        actualStartDate: null,
        actualEndDate: null,
        status: "pending" as const,
      };
    });

    if (items.some((item) => !item.stageName)) {
      toast.error("Mẫu có tên giai đoạn không hợp lệ.");
      return null;
    }

    return items;
  };

  const hasFormContent = draftItems.some(
    (d) =>
      d.stageName.trim() ||
      d.expectedStartDate.trim() ||
      d.expectedEndDate.trim(),
  );

  const handleApplyTemplate = (template: MilestoneTemplateResType) => {
    // If form already has content, ask for confirmation first
    if (hasFormContent) {
      setPendingTemplate(template);
      setPreviewTemplate(null);
      return;
    }
    applyTemplate(template);
  };

  const applyTemplate = (template: MilestoneTemplateResType) => {
    const items = buildTemplateItems(template);
    if (!items) return;

    const newDrafts: DraftMilestoneItem[] = items.map((item) => ({
      stageName: item.stageName,
      milestoneOrder: item.milestoneOrder,
      expectedStartDate: item.expectedStartDate ?? "",
      expectedEndDate: "",
      status: item.status,
    }));

    // Overwrite all existing drafts with template items
    setDraftItems(
      newDrafts.map((item, i) => ({
        ...item,
        milestoneOrder: nextMilestoneOrder + i,
      })),
    );
    setPreviewTemplate(null);
    setPendingTemplate(null);
    setShowTemplates(false);
  };

  const updateDraftItem = (
    index: number,
    patch: Partial<DraftMilestoneItem>,
  ) => {
    setDraftItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const removeDraftItem = (index: number) => {
    setDraftItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((item, i) => ({
        ...item,
        milestoneOrder: nextMilestoneOrder + i,
      }));
    });
  };

  const handleSubmitDraft = () => {
    const validItems = draftItems.filter((item) => item.stageName.trim());
    if (validItems.length === 0) {
      toast.error("Cần ít nhất 1 mốc có tên giai đoạn.");
      return;
    }

    const items = validItems.map((item) => ({
      stageName: item.stageName.trim(),
      milestoneOrder: item.milestoneOrder,
      expectedStartDate: item.expectedStartDate || null,
      expectedEndDate: item.expectedEndDate || null,
      actualStartDate: null,
      actualEndDate: null,
      status: item.status,
    }));

    createBatchMutation.mutate(
      { items },
      {
        onSuccess: onBack,
      },
    );
  };

  const clearDraft = () => {
    setDraftItems([createEmptyDraft(nextMilestoneOrder)]);
  };

  const addDraftItem = () => {
    setDraftItems((prev) => [
      ...prev,
      createEmptyDraft(nextMilestoneOrder + prev.length),
    ]);
  };

  return (
    <div
      className={`space-y-6 transition-all duration-300 ease-out ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Tạo mốc sản xuất</h1>
          <p className="text-sm text-muted-foreground">{cropSeasonLabel}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTemplates(!showTemplates)}
        >
          <Eye className="h-4 w-4 mr-1" />
          {showTemplates ? "Ẩn mẫu" : "Áp dụng mẫu"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={addDraftItem}
        >
          <Plus className="h-4 w-4 mr-1" />
          Thêm mốc
        </Button>
        {draftItems.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearDraft}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Xóa tất cả
          </Button>
        )}
      </div>

      {/* Template Browser */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          showTemplates
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Chọn mẫu mốc sản xuất</CardTitle>
              <CardDescription className="text-xs">
                Nhấn mẫu để xem trước, rồi áp dụng vào form bên dưới.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  placeholder="Tìm theo tên mẫu"
                  className="h-8 text-sm"
                />
                <DatePickerField
                  label=""
                  value={templateStartDate}
                  onChange={setTemplateStartDate}
                  placeholder="Ngày bắt đầu (tùy chọn)"
                />
              </div>

              {templateQuery.isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : templates.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">
                  Không tìm thấy mẫu.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setPreviewTemplate(template)}
                      className="w-full text-left cursor-pointer rounded-md border p-2.5 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {template.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {template.items.length} giai đoạn
                            {template.description
                              ? ` · ${template.description}`
                              : ""}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs shrink-0"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Xem
                        </Badge>
                      </div>
                      {template.items.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {template.items
                            .slice()
                            .sort((a, b) => a.milestoneOrder - b.milestoneOrder)
                            .slice(0, 4)
                            .map((item) => (
                              <Badge
                                key={`${template.id}-${item.id}`}
                                variant="secondary"
                                className="text-xs"
                              >
                                #{item.milestoneOrder} {item.stageName}
                              </Badge>
                            ))}
                          {template.items.length > 4 && (
                            <Badge
                              variant="secondary"
                              className="text-xs"
                            >
                              +{template.items.length - 4}
                            </Badge>
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                  {templateMeta && templateMeta.totalPages > 1 && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={templatePage <= 1}
                        onClick={() => setTemplatePage((prev) => prev - 1)}
                      >
                        Trước
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {templatePage}/{templateMeta.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={templatePage >= templateMeta.totalPages}
                        onClick={() => setTemplatePage((prev) => prev + 1)}
                      >
                        Sau
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Template Preview Dialog */}
      <Dialog
        open={!!previewTemplate}
        onOpenChange={(open) => {
          if (!open) setPreviewTemplate(null);
        }}
      >
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Xem trước mẫu mốc sản xuất</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="font-semibold text-base">
                  {previewTemplate.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {previewTemplate.description || "Không có mô tả"}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge variant="secondary">
                    {previewTemplate.items.length} giai đoạn
                  </Badge>
                  <Badge variant="outline">{previewTemplate.farmType}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Danh sách giai đoạn</p>
                <div className="rounded-md border divide-y">
                  {previewTemplate.items
                    .slice()
                    .sort((a, b) => a.milestoneOrder - b.milestoneOrder)
                    .map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-3"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {item.stageName}
                          </p>
                          {item.daysBetween != null && item.daysBetween > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Cách giai đoạn trước: {item.daysBetween} ngày
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPreviewTemplate(null)}
            >
              Đóng
            </Button>
            <Button
              onClick={() => {
                if (previewTemplate) handleApplyTemplate(previewTemplate);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Áp dụng vào form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Overwrite Confirmation Dialog */}
      <ConfirmDialog
        open={!!pendingTemplate}
        title="Ghi đè dữ liệu hiện tại?"
        description="Form đang có dữ liệu. Áp dụng mẫu sẽ xóa tất cả mốc hiện tại và thay bằng mốc từ mẫu."
        confirmLabel="Ghi đè"
        variant="destructive"
        onCancel={() => setPendingTemplate(null)}
        onConfirm={() => {
          if (pendingTemplate) applyTemplate(pendingTemplate);
        }}
      />

      {/* Unified Milestone Form */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách mốc sản xuất</CardTitle>
          <CardDescription>
            Thêm mốc thủ công hoặc áp dụng mẫu, rồi chỉnh sửa trước khi tạo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 transition-all duration-300 ease-in-out">
          <div className="rounded-md border border-dashed bg-muted/20 p-2.5 text-xs text-muted-foreground">
            Các mốc sẽ được tạo bắt đầu từ vị trí #{nextMilestoneOrder}. Bạn có
            thể đổi thứ tự sau bằng kéo-thả trong danh sách.
          </div>

          {draftItems.map((draft, index) => {
            const parsedStart = parseBackendDate(draft.expectedStartDate);
            const minEnd = parsedStart
              ? addDays(startOfDay(parsedStart), 1)
              : undefined;

            return (
              <div
                key={index}
                className="rounded-md border p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    Mốc #{draft.milestoneOrder}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    disabled={draftItems.length <= 1}
                    onClick={() => removeDraftItem(index)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div>
                  <label className="text-sm font-medium">Tên giai đoạn *</label>
                  <Input
                    className="mt-1"
                    value={draft.stageName}
                    onChange={(e) =>
                      updateDraftItem(index, { stageName: e.target.value })
                    }
                    placeholder="Ví dụ: Nảy mầm"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <DatePickerField
                    label="Ngày bắt đầu dự kiến"
                    placeholder="Chọn ngày bắt đầu"
                    value={draft.expectedStartDate}
                    onChange={(value) =>
                      updateDraftItem(index, { expectedStartDate: value })
                    }
                  />
                  <DatePickerField
                    label="Ngày kết thúc dự kiến"
                    placeholder="Chọn ngày kết thúc"
                    value={draft.expectedEndDate}
                    onChange={(value) =>
                      updateDraftItem(index, { expectedEndDate: value })
                    }
                    minDate={minEnd}
                  />
                </div>
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={addDraftItem}
          >
            <Plus className="h-4 w-4 mr-1" />
            Thêm mốc
          </Button>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onBack}
            >
              Hủy
            </Button>
            <Button
              disabled={createBatchMutation.isPending}
              onClick={handleSubmitDraft}
            >
              {createBatchMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Tạo {draftItems.filter((d) => d.stageName.trim()).length || ""}{" "}
              mốc
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================
// Main Page
// ============================================================

const ManagerMilestonesPage = () => {
  const { cropSeasonId } = useParams<{ cropSeasonId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [page, setPage] = useState(1);
  const [showCreateScreen, setShowCreateScreen] = useState(false);
  const [editingMilestone, setEditingMilestone] =
    useState<ProductionMilestoneResType | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [orderedMilestones, setOrderedMilestones] = useState<
    ProductionMilestoneResType[]
  >([]);
  const [draggingMilestoneId, setDraggingMilestoneId] = useState<string | null>(
    null,
  );
  const [dragOverMilestoneId, setDragOverMilestoneId] = useState<string | null>(
    null,
  );
  const [isReordering, setIsReordering] = useState(false);

  const id = cropSeasonId ?? "";
  const zoneId = searchParams.get("zoneId")?.trim() ?? "";
  const zoneLabel =
    zoneId.length > 16 ? `${zoneId.slice(0, 8)}...${zoneId.slice(-4)}` : zoneId;
  const backTarget = zoneId
    ? `/dashboard/manager/milestones?zoneId=${encodeURIComponent(zoneId)}`
    : "/dashboard/manager/milestones";

  const cropSeasonQuery = useManagerCropSeasonDetail(id);
  const cropSeason = cropSeasonQuery.data?.data;
  const cropSeasonLabel = cropSeason?.cropName ?? cropSeasonId ?? "Mùa vụ";

  const listQuery = useManagerListProductionMilestones(id, {
    page,
    limit: 10,
  });
  const milestones = listQuery.data?.data.data ?? [];
  const totalPages = listQuery.data?.data.meta.totalPages ?? 1;
  const totalItems = listQuery.data?.data.meta.totalItems ?? 0;
  const nextMilestoneOrder = totalItems + 1;
  const isPlanningCropSeason =
    cropSeason?.status === ProductionStatusName.Planning;
  const isApprovedCropSeason =
    cropSeason?.status === ProductionStatusName.Approved;
  const canEditMilestone = isPlanningCropSeason || isApprovedCropSeason;
  const canDeleteMilestone = isPlanningCropSeason;

  const updateMutation = useManagerUpdateProductionMilestone(id);
  const reorderMutation = useManagerUpdateProductionMilestone(id, {
    silent: true,
    invalidateOnSuccess: false,
  });
  const deleteMutation = useManagerDeleteProductionMilestone(id);

  useEffect(() => {
    if (isReordering) return;
    setOrderedMilestones(
      milestones.slice().sort((a, b) => a.milestoneOrder - b.milestoneOrder),
    );
  }, [milestones, isReordering]);

  const handleUpdate = (form: MilestoneEditFormState) => {
    if (!editingMilestone) return;

    if (!canEditMilestone) {
      toast.error(
        "Chỉ có thể chỉnh sửa mốc khi mùa vụ ở planning hoặc approved.",
      );
      return;
    }

    const payload = isApprovedCropSeason
      ? {
          actualStartDate: form.actualStartDate || null,
          actualEndDate: form.actualEndDate || null,
          status: form.status,
        }
      : {
          stageName: form.stageName,
          milestoneOrder: form.milestoneOrder,
          expectedStartDate: form.expectedStartDate || null,
          expectedEndDate: form.expectedEndDate || null,
          actualStartDate: form.actualStartDate || null,
          actualEndDate: form.actualEndDate || null,
          status: form.status,
        };

    updateMutation.mutate(
      {
        milestoneId: editingMilestone.id,
        body: payload,
      },
      { onSuccess: () => setEditingMilestone(null) },
    );
  };

  const handleDelete = (milestoneId: string) => {
    deleteMutation.mutate(milestoneId, {
      onSuccess: () => {
        setConfirmDelete(null);
      },
    });
  };

  const reorderMilestones = async (sourceId: string, targetId: string) => {
    const sourceIndex = orderedMilestones.findIndex((m) => m.id === sourceId);
    const targetIndex = orderedMilestones.findIndex((m) => m.id === targetId);

    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
      return;
    }

    const original = orderedMilestones;
    const next = original.slice();
    const [movedItem] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, movedItem);

    const stableOrders = original
      .map((item) => item.milestoneOrder)
      .sort((a, b) => a - b);

    // Capture dates at each position (sorted by order) so they stay with the slot
    const stableDates = original.map((item) => ({
      expectedStartDate: item.expectedStartDate,
      expectedEndDate: item.expectedEndDate,
    }));

    const nextWithOrder = next.map((item, index) => ({
      ...item,
      milestoneOrder: stableOrders[index],
      expectedStartDate: stableDates[index].expectedStartDate,
      expectedEndDate: stableDates[index].expectedEndDate,
    }));

    const originalById = new Map(
      original.map((item) => [
        item.id,
        {
          milestoneOrder: item.milestoneOrder,
          expectedStartDate: item.expectedStartDate,
          expectedEndDate: item.expectedEndDate,
        },
      ]),
    );

    const changedItems = nextWithOrder
      .filter((item) => {
        const orig = originalById.get(item.id);
        return (
          orig &&
          (orig.milestoneOrder !== item.milestoneOrder ||
            orig.expectedStartDate !== item.expectedStartDate ||
            orig.expectedEndDate !== item.expectedEndDate)
        );
      })
      .map((item) => ({
        id: item.id,
        targetOrder: item.milestoneOrder,
        expectedStartDate: item.expectedStartDate,
        expectedEndDate: item.expectedEndDate,
      }));

    if (!changedItems.length) {
      return;
    }

    setOrderedMilestones(nextWithOrder);
    setIsReordering(true);

    try {
      const tempBase =
        Math.max(...original.map((item) => item.milestoneOrder), totalItems) +
        1000;

      // Phase 1: move all changed items to temporary orders (no date change yet)
      for (const [index, item] of changedItems.entries()) {
        await reorderMutation.mutateAsync({
          milestoneId: item.id,
          body: { milestoneOrder: tempBase + index },
        });
      }

      // Phase 2: set final order + swap dates to match the new position
      for (const item of changedItems.sort(
        (a, b) => a.targetOrder - b.targetOrder,
      )) {
        await reorderMutation.mutateAsync({
          milestoneId: item.id,
          body: {
            milestoneOrder: item.targetOrder,
            expectedStartDate: item.expectedStartDate ?? null,
            expectedEndDate: item.expectedEndDate ?? null,
          },
        });
      }

      await listQuery.refetch();
      toast.success("Đã cập nhật thứ tự mốc.");
    } catch {
      setOrderedMilestones(original);
      toast.error("Không thể cập nhật thứ tự mốc. Vui lòng thử lại.");
    } finally {
      setIsReordering(false);
    }
  };

  const handleMilestoneDragStart = (
    event: DragEvent<HTMLDivElement>,
    milestoneId: string,
  ) => {
    if (!isPlanningCropSeason || isReordering) return;

    setDraggingMilestoneId(milestoneId);
    setDragOverMilestoneId(null);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", milestoneId);
  };

  const handleMilestoneDragOver = (
    event: DragEvent<HTMLDivElement>,
    milestoneId: string,
  ) => {
    if (!isPlanningCropSeason || isReordering || !draggingMilestoneId) return;
    if (draggingMilestoneId === milestoneId) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverMilestoneId(milestoneId);
  };

  const handleMilestoneDrop = async (
    event: DragEvent<HTMLDivElement>,
    milestoneId: string,
  ) => {
    event.preventDefault();

    if (
      !isPlanningCropSeason ||
      isReordering ||
      !draggingMilestoneId ||
      draggingMilestoneId === milestoneId
    ) {
      setDraggingMilestoneId(null);
      setDragOverMilestoneId(null);
      return;
    }

    await reorderMilestones(draggingMilestoneId, milestoneId);
    setDraggingMilestoneId(null);
    setDragOverMilestoneId(null);
  };

  const handleMilestoneDragEnd = () => {
    setDraggingMilestoneId(null);
    setDragOverMilestoneId(null);
  };

  const handleMoveMilestoneByOffset = async (
    milestoneId: string,
    offset: number,
  ) => {
    if (!isPlanningCropSeason || isReordering) return;

    const currentIndex = orderedMilestones.findIndex(
      (m) => m.id === milestoneId,
    );
    if (currentIndex < 0) return;

    const targetIndex = currentIndex + offset;
    if (targetIndex < 0 || targetIndex >= orderedMilestones.length) return;

    const targetMilestoneId = orderedMilestones[targetIndex]?.id;
    if (!targetMilestoneId) return;

    await reorderMilestones(milestoneId, targetMilestoneId);
  };

  const milestoneDetailUrl = (mId: string) => {
    const base = `/dashboard/manager/crop-seasons/${id}/milestones/${mId}`;
    return zoneId ? `${base}?zoneId=${encodeURIComponent(zoneId)}` : base;
  };

  const milestoneOverviewUrl = (mId: string) => {
    const base = `/dashboard/manager/crop-seasons/${id}/milestones/${mId}/overview`;
    return zoneId ? `${base}?zoneId=${encodeURIComponent(zoneId)}` : base;
  };

  if (showCreateScreen) {
    return (
      <CreateMilestonesScreen
        cropSeasonId={id}
        cropSeasonLabel={cropSeasonLabel}
        initialStartDate={cropSeason?.plantDate ?? ""}
        nextMilestoneOrder={nextMilestoneOrder}
        onBack={() => setShowCreateScreen(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard/manager/milestones">Vùng</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {zoneId && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={backTarget}>{zoneLabel}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-muted-foreground">{cropSeasonLabel}</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Mốc</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(backTarget)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Mốc sản xuất</h1>
            {cropSeason && (
              <p className="text-sm text-muted-foreground">
                {cropSeason.cropName} · {cropSeason.variety ?? ""}
              </p>
            )}
          </div>
          <div className="ml-auto">
            <Button
              disabled={!isPlanningCropSeason}
              onClick={() => setShowCreateScreen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Mốc mới
            </Button>
            {!isPlanningCropSeason && (
              <p className="text-[11px] text-muted-foreground mt-1 text-right">
                Chỉ có thể tạo mốc khi mùa vụ ở trạng thái lập kế hoạch.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Left: Milestone List */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>Danh sách mốc</CardTitle>
            <CardDescription>
              {listQuery.data?.data.meta.totalItems ?? 0} giai đoạn
              {isPlanningCropSeason
                ? " • Kéo thả để sắp xếp lại"
                : " • Chỉ sắp xếp được khi ở trạng thái lập kế hoạch"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isReordering && (
              <div className="rounded-md border border-dashed bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                Đang lưu thứ tự mốc mới...
              </div>
            )}

            {listQuery.isLoading ? (
              [0, 1, 2].map((i) => (
                <Skeleton
                  key={i}
                  className="h-16 w-full"
                />
              ))
            ) : orderedMilestones.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Chưa có mốc nào.
              </p>
            ) : (
              orderedMilestones.map((m, index) => {
                const meta = STATUS_META[m.status];
                const isDragging = draggingMilestoneId === m.id;
                const isDragOver = dragOverMilestoneId === m.id;

                return (
                  <div
                    key={m.id}
                    draggable={isPlanningCropSeason && !isReordering}
                    onDragStart={(event) =>
                      handleMilestoneDragStart(event, m.id)
                    }
                    onDragOver={(event) => handleMilestoneDragOver(event, m.id)}
                    onDrop={(event) => void handleMilestoneDrop(event, m.id)}
                    onDragEnd={handleMilestoneDragEnd}
                    onClick={() => navigate(milestoneDetailUrl(m.id))}
                    className={`flex items-start justify-between rounded-md border p-3 transition-colors ${
                      isPlanningCropSeason && !isReordering
                        ? "cursor-grab active:cursor-grabbing"
                        : "cursor-pointer"
                    } hover:bg-muted/50 ${isDragging ? "opacity-60" : ""} ${
                      isDragOver ? "ring-2 ring-primary/30" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {isPlanningCropSeason && (
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground font-mono">
                          #{m.milestoneOrder}
                        </span>
                        <p className="font-medium truncate">{m.stageName}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge
                          variant={meta.variant}
                          className="text-xs"
                        >
                          {meta.label}
                        </Badge>
                        {m.expectedStartDate && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(m.expectedStartDate)}
                            {m.expectedEndDate
                              ? ` → ${formatDate(m.expectedEndDate)}`
                              : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(milestoneOverviewUrl(m.id));
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Xem chi tiết
                        </DropdownMenuItem>
                        {isPlanningCropSeason && (
                          <>
                            <DropdownMenuItem
                              disabled={index === 0 || isReordering}
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleMoveMilestoneByOffset(m.id, -1);
                              }}
                            >
                              <ArrowUp className="h-4 w-4 mr-2" />
                              Di chuyển lên
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={
                                index === orderedMilestones.length - 1 ||
                                isReordering
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleMoveMilestoneByOffset(m.id, 1);
                              }}
                            >
                              <ArrowDown className="h-4 w-4 mr-2" />
                              Di chuyển xuống
                            </DropdownMenuItem>
                          </>
                        )}
                        {canEditMilestone && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingMilestone(m);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                        )}
                        {canDeleteMilestone && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete(m.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xóa
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              `/dashboard/manager/tickets?milestoneId=${m.id}&milestoneName=${encodeURIComponent(`#${m.milestoneOrder} ${m.stageName}`)}`,
                            );
                          }}
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Báo cáo sự cố
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                <span>
                  Trang {page} / {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Trước
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {editingMilestone && canEditMilestone && (
        <MilestoneEditDialog
          open={!!editingMilestone}
          mode={isApprovedCropSeason ? "approved" : "planning"}
          initialValues={{
            stageName: editingMilestone.stageName,
            milestoneOrder: editingMilestone.milestoneOrder,
            expectedStartDate: editingMilestone.expectedStartDate ?? "",
            expectedEndDate: editingMilestone.expectedEndDate ?? "",
            actualStartDate: editingMilestone.actualStartDate ?? "",
            actualEndDate: editingMilestone.actualEndDate ?? "",
            status: editingMilestone.status,
          }}
          onClose={() => setEditingMilestone(null)}
          onSubmit={handleUpdate}
          isSubmitting={updateMutation.isPending}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Xóa mốc?"
        description="Lượt gán IoT và liên kết cảm biến của mốc này cũng sẽ bị xóa."
        confirmLabel="Xóa"
        variant="destructive"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
      />
    </div>
  );
};

export default ManagerMilestonesPage;
