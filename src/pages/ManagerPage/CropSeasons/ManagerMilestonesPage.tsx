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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
  Cpu,
  Radio,
  RefreshCw,
  Check,
  X,
  CalendarDays,
  GripVertical,
} from "lucide-react";
import { useEffect, useState, type DragEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import {
  useManagerListProductionMilestones,
  useManagerCreateProductionMilestone,
  useManagerCreateProductionMilestoneBatch,
  useManagerUpdateProductionMilestone,
  useManagerDeleteProductionMilestone,
  useManagerMilestoneAssignment,
  useManagerListAvailableIotDevices,
  useManagerAssignIotDevice,
  useManagerUnassignIotDevice,
  useManagerListBoundSensors,
  useManagerBindSensors,
  useManagerUnbindSensors,
  useManagerListSensorsForDevice,
  useManagerSensorThresholds,
  useManagerUpsertSensorThreshold,
} from "@/queries/useProductionMilestone";
import { useManagerListMilestoneTemplates } from "@/queries/useMilestoneTemplate";
import ManagerMilestoneTasksSection, {
  ManagerMilestoneTaskAssignmentScreen,
} from "@/pages/ManagerPage/EmployeeTasks/ManagerMilestoneTasksSection";
import { useManagerCropSeasonDetail } from "@/queries/useCropSeason";
import type {
  ProductionMilestoneResType,
  ProductionMilestoneStatusType,
} from "@/schemaValidatation/productionMilestone";
import type { MilestoneTemplateResType } from "@/schemaValidatation/milestoneTemplate";
import type { ThresholdEligibleSensorType } from "@/schemaValidatation/sensorThreshold";
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

const SENSOR_TYPE_LABELS: Record<string, string> = {
  soil_moisture: "Độ ẩm đất",
  air_temperature: "Nhiệt độ không khí",
  air_humidity: "Độ ẩm không khí",
  light_intensity: "Cường độ ánh sáng",
};

function formatDeviceLabel(device?: {
  deviceName?: string;
  deviceCode?: string;
  deviceType?: string;
}) {
  const name = device?.deviceName?.trim() || "Thiết bị không xác định";
  const code = device?.deviceCode ? ` (${device.deviceCode})` : "";
  const type = device?.deviceType
    ? ` · ${device.deviceType.replace(/_/g, " ")}`
    : "";
  return `${name}${code}${type}`;
}

function formatThresholdText(sensor: {
  threshold?: {
    optimalMin: number | null;
    optimalMax: number | null;
    source: string;
  };
  unit?: string | null;
}) {
  const t = sensor.threshold;
  if (!t || t.optimalMin == null || t.optimalMax == null) {
    return "Chưa cấu hình ngưỡng";
  }
  const unit = sensor.unit ? ` ${sensor.unit}` : "";
  return `${t.optimalMin} - ${t.optimalMax}${unit} (${t.source})`;
}

const THRESHOLD_ELIGIBLE = new Set([
  "soil_moisture",
  "air_temperature",
  "air_humidity",
  "light_intensity",
]);

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

type MilestoneFormState = {
  stageName: string;
  milestoneOrder: number;
  expectedStartDate: string;
  expectedEndDate: string;
  status: ProductionMilestoneStatusType;
};

type MilestoneFormErrors = Partial<Record<keyof MilestoneFormState, string>>;

const defaultMilestoneForm = (milestoneOrder = 1): MilestoneFormState => ({
  stageName: "",
  milestoneOrder,
  expectedStartDate: "",
  expectedEndDate: "",
  status: "pending",
});

const validateMilestoneForm = (
  values: MilestoneFormState,
): MilestoneFormErrors => {
  const errors: MilestoneFormErrors = {};

  if (!values.stageName.trim()) {
    errors.stageName = "Tên giai đoạn là bắt buộc.";
  }

  const expectedStartDate = parseBackendDate(values.expectedStartDate);
  const expectedEndDate = parseBackendDate(values.expectedEndDate);

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

  return errors;
};

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

const MilestoneFormFields = ({
  form,
  errors,
  onChange,
}: {
  form: MilestoneFormState;
  errors: MilestoneFormErrors;
  onChange: <K extends keyof MilestoneFormState>(
    key: K,
    value: MilestoneFormState[K],
  ) => void;
}) => {
  const parsedExpectedStartDate = parseBackendDate(form.expectedStartDate);
  const minExpectedEndDate = parsedExpectedStartDate
    ? addDays(startOfDay(parsedExpectedStartDate), 1)
    : undefined;

  return (
    <div className="space-y-3 py-2">
      <div>
        <label className="text-sm font-medium">Tên giai đoạn *</label>
        <Input
          className="mt-1"
          placeholder="Ví dụ: Nảy mầm"
          value={form.stageName}
          onChange={(e) => onChange("stageName", e.target.value)}
        />
        {errors.stageName && (
          <p className="text-xs text-destructive mt-1">{errors.stageName}</p>
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

const MilestoneFormDialog = ({
  open,
  onClose,
  onSubmit,
  initialValues,
  isSubmitting,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: MilestoneFormState) => void;
  initialValues?: MilestoneFormState;
  isSubmitting: boolean;
  title: string;
}) => {
  const [form, setForm] = useState<MilestoneFormState>(
    initialValues ?? defaultMilestoneForm(),
  );
  const [errors, setErrors] = useState<MilestoneFormErrors>({});

  useEffect(() => {
    if (!open) return;
    setForm(initialValues ?? defaultMilestoneForm());
    setErrors({});
  }, [open, initialValues]);

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      onClose();
      setErrors({});
    }
  };

  const update = <K extends keyof MilestoneFormState>(
    k: K,
    v: MilestoneFormState[K],
  ) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    const nextErrors = validateMilestoneForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(form);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <MilestoneFormFields
          form={form}
          errors={errors}
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
  const [manualForm, setManualForm] = useState<MilestoneFormState>(
    defaultMilestoneForm(nextMilestoneOrder),
  );
  const [manualErrors, setManualErrors] = useState<MilestoneFormErrors>({});

  const createMutation = useManagerCreateProductionMilestone(cropSeasonId);
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

  useEffect(() => {
    setManualForm((prev) => {
      if (prev.milestoneOrder >= nextMilestoneOrder) return prev;
      return { ...prev, milestoneOrder: nextMilestoneOrder };
    });
  }, [nextMilestoneOrder]);

  const updateManualForm = <K extends keyof MilestoneFormState>(
    key: K,
    value: MilestoneFormState[K],
  ) => {
    setManualForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleManualSubmit = () => {
    const payloadOrder = nextMilestoneOrder;
    const errors = validateMilestoneForm(manualForm);
    setManualErrors(errors);
    if (Object.keys(errors).length > 0) return;

    createMutation.mutate(
      {
        stageName: manualForm.stageName.trim(),
        milestoneOrder: payloadOrder,
        expectedStartDate: manualForm.expectedStartDate || null,
        expectedEndDate: manualForm.expectedEndDate || null,
        status: manualForm.status,
      },
      { onSuccess: onBack },
    );
  };

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

  const handleApplyTemplate = (template: MilestoneTemplateResType) => {
    const items = buildTemplateItems(template);
    if (!items) return;

    createBatchMutation.mutate(
      { items },
      {
        onSuccess: onBack,
      },
    );
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

      <Card>
        <CardHeader>
          <CardTitle>Áp dụng mẫu mốc sản xuất</CardTitle>
          <CardDescription>Tạo nhanh nhiều mốc từ mẫu có sẵn.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Tìm mẫu</label>
              <Input
                className="mt-1"
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                placeholder="Tìm theo tên mẫu"
              />
            </div>
            <DatePickerField
              label="Ngày bắt đầu từ mẫu (tùy chọn)"
              value={templateStartDate}
              onChange={setTemplateStartDate}
              placeholder="Chọn ngày bắt đầu"
            />
          </div>

          {templateQuery.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((idx) => (
                <Skeleton
                  key={idx}
                  className="h-24 w-full"
                />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground border rounded-md">
              Không tìm thấy mẫu nào.
            </p>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-md border p-3 space-y-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{template.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {template.description || "Không có mô tả"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {template.items.length} giai đoạn
                      </p>
                    </div>
                    <Button
                      size="sm"
                      disabled={createBatchMutation.isPending}
                      onClick={() => handleApplyTemplate(template)}
                    >
                      {createBatchMutation.isPending ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3 mr-1" />
                      )}
                      Áp dụng
                    </Button>
                  </div>
                  {template.items.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.items
                        .slice()
                        .sort((a, b) => a.milestoneOrder - b.milestoneOrder)
                        .slice(0, 4)
                        .map((item) => (
                          <Badge
                            key={`${template.id}-${item.id}`}
                            variant="outline"
                            className="text-xs"
                          >
                            #{item.milestoneOrder} {item.stageName}
                          </Badge>
                        ))}
                      {template.items.length > 4 && (
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          +{template.items.length - 4} mục nữa
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {templateMeta && templateMeta.totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Trang {templatePage} / {templateMeta.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={templatePage <= 1}
                  onClick={() => setTemplatePage((prev) => prev - 1)}
                >
                  Trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={templatePage >= templateMeta.totalPages}
                  onClick={() => setTemplatePage((prev) => prev + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tạo thủ công</CardTitle>
          <CardDescription>
            Tạo một mốc riêng với giai đoạn và thời gian tùy chỉnh. Thứ tự sẽ
            được tự động gán.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-3 rounded-md border border-dashed bg-muted/20 p-2.5 text-xs text-muted-foreground">
            Mốc mới sẽ được thêm ở vị trí #{nextMilestoneOrder}. Bạn có thể đổi
            thứ tự sau bằng kéo-thả trong danh sách.
          </div>
          <MilestoneFormFields
            form={manualForm}
            errors={manualErrors}
            onChange={updateManualForm}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onBack}
            >
              Hủy
            </Button>
            <Button
              disabled={createMutation.isPending}
              onClick={handleManualSubmit}
            >
              {createMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Tạo mốc
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================
// IoT Assignment Section (#80)
// ============================================================

const IotAssignmentSection = ({ milestoneId }: { milestoneId: string }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPage, setPickerPage] = useState(1);
  const [confirmUnassign, setConfirmUnassign] = useState(false);

  const assignmentQuery = useManagerMilestoneAssignment(milestoneId);
  const assignment = assignmentQuery.data?.data?.data ?? null;

  const availableQuery = useManagerListAvailableIotDevices(
    milestoneId,
    { page: pickerPage, limit: 5 },
    showPicker,
  );
  const available = availableQuery.data?.data.data ?? [];
  const availableMeta = availableQuery.data?.data.meta;

  const assignMutation = useManagerAssignIotDevice(milestoneId);
  const unassignMutation = useManagerUnassignIotDevice(milestoneId);

  const handleAssign = (deviceId: string) => {
    assignMutation.mutate(
      { iotDeviceId: deviceId },
      { onSuccess: () => setShowPicker(false) },
    );
  };

  const handleUnassign = () => {
    if (!assignment) return;
    unassignMutation.mutate(
      { iotDeviceId: assignment.device.deviceId },
      { onSuccess: () => setConfirmUnassign(false) },
    );
  };

  if (assignmentQuery.isLoading) {
    return <Skeleton className="h-20 w-full" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Cpu className="h-4 w-4" />
          Gán thiết bị IoT
        </p>
        {!assignment && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowPicker(true);
              setPickerPage(1);
            }}
          >
            <Plus className="h-3 w-3 mr-1" />
            Gán thiết bị
          </Button>
        )}
        {assignment && (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmUnassign(true)}
          >
            <X className="h-3 w-3 mr-1" />
            Bỏ gán
          </Button>
        )}
      </div>

      {!assignment ? (
        <p className="text-xs text-muted-foreground py-2">
          Chưa có thiết bị IoT nào được gán cho mốc này.
        </p>
      ) : (
        <div className="rounded-md border p-3 bg-muted/30 text-sm space-y-1">
          <p className="font-medium">{formatDeviceLabel(assignment.device)}</p>
          <p className="text-muted-foreground text-xs">
            Mã lượt gán:{" "}
            <span className="font-mono">{assignment.assignmentId}</span>
          </p>
          <p className="text-muted-foreground text-xs">
            Thời điểm gán: {formatDate(assignment.assignedAt)}
          </p>
          {assignment.device.isDeleted && (
            <p className="text-xs text-destructive">
              Thiết bị đã bị xóa mềm; dữ liệu hiển thị từ lịch sử gán.
            </p>
          )}
        </div>
      )}

      {/* Device picker dialog */}
      <Dialog
        open={showPicker}
        onOpenChange={setShowPicker}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chọn thiết bị IoT</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {availableQuery.isLoading ? (
              [0, 1, 2].map((i) => (
                <Skeleton
                  key={i}
                  className="h-14 w-full"
                />
              ))
            ) : available.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Không có thiết bị khả dụng.
              </p>
            ) : (
              available.map((dev) => (
                <div
                  key={dev.id}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleAssign(dev.id)}
                >
                  <div>
                    <p className="font-medium text-sm">{dev.deviceName}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {dev.deviceType.replace("_", " ")} · {dev.status}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    disabled={assignMutation.isPending}
                  >
                    {assignMutation.isPending ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
          {availableMeta && availableMeta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs">
              <span>
                Trang {pickerPage} / {availableMeta.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pickerPage <= 1}
                  onClick={() => setPickerPage((p) => p - 1)}
                >
                  Trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pickerPage >= availableMeta.totalPages}
                  onClick={() => setPickerPage((p) => p + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmUnassign}
        title="Bỏ gán thiết bị?"
        description="Liên kết cảm biến và ngưỡng của lượt gán này cũng sẽ bị xóa."
        confirmLabel="Bỏ gán"
        variant="destructive"
        onCancel={() => setConfirmUnassign(false)}
        onConfirm={handleUnassign}
      />
    </div>
  );
};

// ============================================================
// Sensor Binding Section (#81)
// ============================================================

const SensorBindingSection = ({
  assignmentId,
  iotDeviceId,
}: {
  assignmentId: string;
  iotDeviceId?: string;
}) => {
  const [confirmUnbind, setConfirmUnbind] = useState<string | null>(null);

  // Fetch all sensors on the IoT board
  const sensorQuery = useManagerListSensorsForDevice(iotDeviceId);
  const allSensors = sensorQuery.data?.data.data ?? [];

  const boundQuery = useManagerListBoundSensors(assignmentId);
  const boundSensors = boundQuery.data?.data.data ?? [];
  const boundIds = new Set(boundSensors.map((s) => s.sensorId));

  const unboundSensors = allSensors.filter((s) => !boundIds.has(s.id));

  const bindMutation = useManagerBindSensors(assignmentId);
  const unbindMutation = useManagerUnbindSensors(assignmentId);

  const handleBind = (sensorId: string) => {
    bindMutation.mutate({ sensorIds: [sensorId] });
  };

  const handleUnbind = (sensorId: string) => {
    unbindMutation.mutate(
      { sensorIds: [sensorId] },
      { onSuccess: () => setConfirmUnbind(null) },
    );
  };

  if (boundQuery.isLoading) return <Skeleton className="h-20 w-full" />;

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold flex items-center gap-2">
        <Radio className="h-4 w-4" />
        Liên kết cảm biến
      </p>

      {/* Bound sensors */}
      {boundSensors.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Chưa có cảm biến nào được liên kết.
        </p>
      ) : (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Đã liên kết
          </p>
          {boundSensors.map((s) => (
            <div
              key={s.bindingId}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <div>
                <span className="font-medium">
                  {s.sensorName ||
                    SENSOR_TYPE_LABELS[s.sensorType] ||
                    s.sensorType}
                </span>
                <Badge
                  variant="outline"
                  className="ml-2 text-xs capitalize"
                >
                  {s.status}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {`${s.sensorName || SENSOR_TYPE_LABELS[s.sensorType] || s.sensorType} (Ngưỡng: ${formatThresholdText(s)}) trên ${boundQuery.data?.data.device.deviceName ?? "thiết bị"}`}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive h-7 w-7 p-0"
                onClick={() => setConfirmUnbind(s.sensorId)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Available to bind */}
      {unboundSensors.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Có thể liên kết
          </p>
          {unboundSensors.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-md border border-dashed px-3 py-2 text-sm"
            >
              <span className="text-muted-foreground">
                {SENSOR_TYPE_LABELS[s.sensorType] ?? s.sensorType}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-7"
                disabled={bindMutation.isPending}
                onClick={() => handleBind(s.id)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Liên kết
              </Button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmUnbind}
        title="Gỡ liên kết cảm biến?"
        description="Thao tác này sẽ gỡ cảm biến khỏi lượt gán này."
        confirmLabel="Gỡ liên kết"
        variant="destructive"
        onCancel={() => setConfirmUnbind(null)}
        onConfirm={() => confirmUnbind && handleUnbind(confirmUnbind)}
      />
    </div>
  );
};

// ============================================================
// Sensor Threshold Section (#82)
// ============================================================

const ThresholdSection = ({ assignmentId }: { assignmentId: string }) => {
  const [editing, setEditing] = useState<ThresholdEligibleSensorType | null>(
    null,
  );
  const [form, setForm] = useState({ optimalMin: 0, optimalMax: 100 });

  const thresholdQuery = useManagerSensorThresholds(assignmentId);
  const items = thresholdQuery.data?.data.data ?? [];

  const eligibleItems = items.filter((i) =>
    THRESHOLD_ELIGIBLE.has(i.sensorType),
  );

  const upsertMutation = useManagerUpsertSensorThreshold(assignmentId);

  const startEdit = (sensorType: ThresholdEligibleSensorType) => {
    const existing = items.find((i) => i.sensorType === sensorType);
    setForm({
      optimalMin:
        existing?.threshold?.optimalMin ?? Number(existing?.minValue ?? 0),
      optimalMax:
        existing?.threshold?.optimalMax ?? Number(existing?.maxValue ?? 100),
    });
    setEditing(sensorType);
  };

  const handleSave = () => {
    if (!editing) return;
    upsertMutation.mutate(
      {
        sensorType: editing,
        optimalMin: form.optimalMin,
        optimalMax: form.optimalMax,
      },
      { onSuccess: () => setEditing(null) },
    );
  };

  if (thresholdQuery.isLoading) return <Skeleton className="h-20 w-full" />;

  if (eligibleItems.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold">Ngưỡng cảm biến</p>
        <p className="text-xs text-muted-foreground">
          Không có cảm biến đủ điều kiện đặt ngưỡng.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">Ngưỡng cảm biến</p>
      <p className="text-xs text-muted-foreground">
        Thiết lập giá trị min/max tối ưu. Chỉ số ngoài khoảng này sẽ tạo cảnh
        báo.
      </p>

      <div className="space-y-2">
        {eligibleItems.map((item) => {
          const isEditing = editing === item.sensorType;
          const t = item.threshold;
          return (
            <div
              key={item.sensorId}
              className="rounded-md border p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {SENSOR_TYPE_LABELS[item.sensorType] ?? item.sensorType}
                </p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      item.source === "milestone"
                        ? "default"
                        : item.source === "zone"
                          ? "secondary"
                          : "outline"
                    }
                    className="text-xs"
                  >
                    {item.source === "none"
                      ? "Chưa có ngưỡng"
                      : item.source === "milestone"
                        ? "Từ mốc"
                        : item.source === "zone"
                          ? "Từ vùng"
                          : `Từ ${item.source}`}
                  </Badge>
                  {!isEditing && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() =>
                        startEdit(
                          item.sensorType as ThresholdEligibleSensorType,
                        )
                      }
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {!isEditing && t && (
                <p className="text-xs text-muted-foreground">
                  Tối ưu: {t.optimalMin} – {t.optimalMax}
                  &nbsp;·&nbsp;Khoảng đo: {item.minValue} – {item.maxValue}
                </p>
              )}

              {isEditing && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium">Nhỏ nhất</label>
                      <Input
                        type="number"
                        className="mt-1 h-8"
                        value={form.optimalMin}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            optimalMin: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Lớn nhất</label>
                      <Input
                        type="number"
                        className="mt-1 h-8"
                        value={form.optimalMax}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            optimalMax: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7"
                      onClick={() => setEditing(null)}
                    >
                      Hủy
                    </Button>
                    <Button
                      size="sm"
                      className="h-7"
                      disabled={
                        upsertMutation.isPending ||
                        form.optimalMin > form.optimalMax
                      }
                      onClick={handleSave}
                    >
                      {upsertMutation.isPending ? "Đang lưu..." : "Lưu"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================
// Read-only IoT Assignment View
// ============================================================

const IotAssignmentReadOnly = ({ milestoneId }: { milestoneId: string }) => {
  const assignmentQuery = useManagerMilestoneAssignment(milestoneId);
  const assignment = assignmentQuery.data?.data?.data ?? null;

  if (assignmentQuery.isLoading) return <Skeleton className="h-20 w-full" />;

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold flex items-center gap-2">
        <Cpu className="h-4 w-4" />
        Thiết bị IoT được gán
      </p>
      {!assignment ? (
        <p className="text-xs text-muted-foreground py-2">
          Chưa có thiết bị IoT nào được gán cho mốc này.
        </p>
      ) : (
        <>
          <div className="rounded-md border p-3 bg-muted/30 text-sm space-y-1">
            <p className="font-medium">
              {formatDeviceLabel(assignment.device)}
            </p>
            <p className="text-muted-foreground text-xs">
              Mã lượt gán:{" "}
              <span className="font-mono">{assignment.assignmentId}</span>
            </p>
            <p className="text-muted-foreground text-xs">
              Thời điểm gán: {formatDate(assignment.assignedAt)}
            </p>
            {assignment.device.isDeleted && (
              <p className="text-xs text-destructive">
                Thiết bị đã bị xóa mềm; dữ liệu hiển thị từ lịch sử gán.
              </p>
            )}
          </div>
          <SensorBindingReadOnly
            sensors={assignment.sensors}
            deviceName={assignment.device.deviceName}
          />
        </>
      )}
    </div>
  );
};

// ============================================================
// Read-only Sensor Binding View
// ============================================================

const SensorBindingReadOnly = ({
  sensors,
  deviceName,
}: {
  sensors: Array<{
    bindingId: string;
    sensorId: string;
    sensorName: string;
    sensorType: string;
    status: string;
    unit: string | null;
    threshold: {
      source: "milestone" | "zone" | "none";
      optimalMin: number | null;
      optimalMax: number | null;
    };
  }>;
  deviceName?: string;
}) => {
  const boundSensors = sensors ?? [];

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold flex items-center gap-2">
        <Radio className="h-4 w-4" />
        Liên kết cảm biến
      </p>
      {boundSensors.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Chưa có cảm biến nào được liên kết.
        </p>
      ) : (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Đã liên kết
          </p>
          {boundSensors.map((s) => (
            <div
              key={s.bindingId}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <div>
                <span className="font-medium">
                  {s.sensorName ||
                    SENSOR_TYPE_LABELS[s.sensorType] ||
                    s.sensorType}
                </span>
                <Badge
                  variant="outline"
                  className="ml-2 text-xs capitalize"
                >
                  {s.status}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {`${s.sensorName || SENSOR_TYPE_LABELS[s.sensorType] || s.sensorType} (Ngưỡng: ${formatThresholdText(s)}) trên ${deviceName || "thiết bị"}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
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

  const [selectedMilestone, setSelectedMilestone] =
    useState<ProductionMilestoneResType | null>(null);
  const [detailTab, setDetailTab] = useState<"iot" | "tasks" | "assignment">(
    "iot",
  );
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
        if (selectedMilestone?.id === milestoneId) setSelectedMilestone(null);
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

    const nextWithOrder = next.map((item, index) => ({
      ...item,
      milestoneOrder: stableOrders[index],
    }));

    const originalOrderById = new Map(
      original.map((item) => [item.id, item.milestoneOrder]),
    );

    const changedItems = nextWithOrder
      .filter((item) => originalOrderById.get(item.id) !== item.milestoneOrder)
      .map((item) => ({ id: item.id, targetOrder: item.milestoneOrder }));

    if (!changedItems.length) {
      return;
    }

    setOrderedMilestones(nextWithOrder);
    setSelectedMilestone((prev) => {
      if (!prev) return prev;
      return nextWithOrder.find((item) => item.id === prev.id) ?? prev;
    });
    setIsReordering(true);

    try {
      const tempBase =
        Math.max(...original.map((item) => item.milestoneOrder), totalItems) +
        1000;

      for (const [index, item] of changedItems.entries()) {
        await reorderMutation.mutateAsync({
          milestoneId: item.id,
          body: { milestoneOrder: tempBase + index },
        });
      }

      for (const item of changedItems.sort(
        (a, b) => a.targetOrder - b.targetOrder,
      )) {
        await reorderMutation.mutateAsync({
          milestoneId: item.id,
          body: { milestoneOrder: item.targetOrder },
        });
      }

      await listQuery.refetch();
      toast.success("Đã cập nhật thứ tự mốc.");
    } catch {
      setOrderedMilestones(original);
      setSelectedMilestone((prev) => {
        if (!prev) return prev;
        return original.find((item) => item.id === prev.id) ?? prev;
      });
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

  // assignment from query (for passing assignmentId to sub-sections)
  const assignmentQuery = useManagerMilestoneAssignment(
    selectedMilestone?.id ?? "",
    !!selectedMilestone,
  );
  const assignmentId = assignmentQuery.data?.data?.data?.assignmentId ?? null;
  const iotDeviceId = assignmentQuery.data?.data?.data?.iotDeviceId ?? null;

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
        <Card className={selectedMilestone ? "lg:col-span-2" : "lg:col-span-5"}>
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
                    onClick={() => {
                      if (selectedMilestone?.id === m.id) {
                        setSelectedMilestone(null);
                        return;
                      }
                      setSelectedMilestone(m);
                      setDetailTab("iot");
                    }}
                    className={`flex items-start justify-between rounded-md border p-3 transition-colors ${
                      isPlanningCropSeason && !isReordering
                        ? "cursor-grab active:cursor-grabbing"
                        : "cursor-pointer"
                    } ${
                      selectedMilestone?.id === m.id
                        ? "border-primary bg-muted/30"
                        : "hover:bg-muted/50"
                    } ${isDragging ? "opacity-60" : ""} ${
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
                    {canEditMilestone && (
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
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingMilestone(m);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
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

        {/* Right: Milestone Detail */}
        {selectedMilestone && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">
                    #{selectedMilestone.milestoneOrder}{" "}
                    {selectedMilestone.stageName}
                  </CardTitle>
                  <CardDescription>
                    <Badge
                      variant={STATUS_META[selectedMilestone.status].variant}
                      className="text-xs mt-1"
                    >
                      {STATUS_META[selectedMilestone.status].label}
                    </Badge>
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setSelectedMilestone(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {selectedMilestone.expectedStartDate && (
                <p className="text-sm text-muted-foreground">
                  {formatDate(selectedMilestone.expectedStartDate)}
                  {selectedMilestone.expectedEndDate
                    ? ` → ${formatDate(selectedMilestone.expectedEndDate)}`
                    : ""}
                </p>
              )}

              <Tabs
                value={detailTab}
                onValueChange={(value) =>
                  setDetailTab(value as "iot" | "tasks" | "assignment")
                }
                className="space-y-4"
              >
                <TabsList
                  variant="line"
                  className="w-full justify-start"
                >
                  <TabsTrigger value="iot">Thiết bị IoT</TabsTrigger>
                  <TabsTrigger value="tasks">Nhiệm vụ</TabsTrigger>
                  <TabsTrigger value="assignment">Gán nông dân</TabsTrigger>
                </TabsList>

                <TabsContent
                  value="iot"
                  className="space-y-4"
                >
                  {/* IoT Device Assignment (#80) */}
                  {isPlanningCropSeason ? (
                    <IotAssignmentSection milestoneId={selectedMilestone.id} />
                  ) : (
                    <IotAssignmentReadOnly milestoneId={selectedMilestone.id} />
                  )}

                  {/* Sensor Binding (#81) — only when device is assigned */}
                  {isPlanningCropSeason && assignmentId && (
                    <>
                      <Separator />
                      <SensorBindingSection
                        assignmentId={assignmentId}
                        iotDeviceId={iotDeviceId ?? undefined}
                      />
                    </>
                  )}

                  {/* Threshold (#82) — only when device is assigned */}
                  {isPlanningCropSeason && assignmentId && (
                    <>
                      <Separator />
                      <ThresholdSection assignmentId={assignmentId} />
                    </>
                  )}
                </TabsContent>

                <TabsContent value="tasks">
                  <ManagerMilestoneTasksSection
                    milestoneId={selectedMilestone.id}
                    canEdit={canEditMilestone}
                  />
                </TabsContent>

                <TabsContent value="assignment">
                  <ManagerMilestoneTaskAssignmentScreen
                    milestoneId={selectedMilestone.id}
                    canEdit={canEditMilestone}
                    onBack={() => setDetailTab("tasks")}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
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
