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
  MilestoneStepper,
  type StepDefinition,
  type StepStatus,
} from "@/components/common/milestone-stepper";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Cpu,
  MoreVertical,
  Pencil,
  Plus,
  Radio,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import {
  useManagerListProductionMilestones,
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
import { useManagerCropSeasonDetail } from "@/queries/useCropSeason";
import ManagerMilestoneTasksSection, {
  ManagerMilestoneTaskAssignmentScreen,
} from "@/pages/ManagerPage/EmployeeTasks/ManagerMilestoneTasksSection";
import type {
  ProductionMilestoneResType,
  ProductionMilestoneStatusType,
} from "@/schemaValidatation/productionMilestone";
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

// ============================================================
// Step definitions
// ============================================================

const STEP_DEFS: StepDefinition[] = [
  { label: "Thiết bị IoT", description: "Gán thiết bị cho mốc" },
  { label: "Cảm biến & Ngưỡng", description: "Liên kết và cấu hình" },
  { label: "Nhiệm vụ & Nông dân", description: "Quản lý công việc" },
];

// ============================================================
// Edit Form
// ============================================================

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

// ============================================================
// Step 1 — IoT Device Assignment
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
    <div className="space-y-4">
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
        <div className="rounded-md border border-dashed p-6 text-center">
          <Cpu className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            Chưa có thiết bị IoT nào được gán cho mốc này.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Gán thiết bị để tiếp tục sang bước liên kết cảm biến.
          </p>
        </div>
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

const IotAssignmentReadOnly = ({ milestoneId }: { milestoneId: string }) => {
  const assignmentQuery = useManagerMilestoneAssignment(milestoneId);
  const assignment = assignmentQuery.data?.data?.data ?? null;

  if (assignmentQuery.isLoading) return <Skeleton className="h-20 w-full" />;

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold flex items-center gap-2">
        <Cpu className="h-4 w-4" />
        Thiết bị IoT được gán
      </p>
      {!assignment ? (
        <div className="rounded-md border border-dashed p-6 text-center">
          <Cpu className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            Chưa có thiết bị IoT nào được gán cho mốc này.
          </p>
        </div>
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
// Step 2 — Sensor Binding + Thresholds
// ============================================================

const SensorBindingSection = ({
  assignmentId,
  iotDeviceId,
}: {
  assignmentId: string;
  iotDeviceId?: string;
}) => {
  const [confirmUnbind, setConfirmUnbind] = useState<string | null>(null);

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

const ThresholdSection = ({
  assignmentId,
  milestoneId,
}: {
  assignmentId: string;
  milestoneId: string;
}) => {
  const [editing, setEditing] = useState<ThresholdEligibleSensorType | null>(
    null,
  );
  const [form, setForm] = useState({ optimalMin: 0, optimalMax: 100 });

  const thresholdQuery = useManagerSensorThresholds(assignmentId);
  const items = thresholdQuery.data?.data.data ?? [];

  const eligibleItems = items.filter((i) =>
    THRESHOLD_ELIGIBLE.has(i.sensorType),
  );

  const upsertMutation = useManagerUpsertSensorThreshold(
    assignmentId,
    milestoneId,
  );

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
    const existingItem = items.find((i) => i.sensorType === editing);
    upsertMutation.mutate(
      {
        sensorType: editing,
        optimalMin: form.optimalMin,
        optimalMax: form.optimalMax,
        isUpdate: existingItem?.source === "milestone",
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
// Step 3 — Tasks & Farmer Assignment
// ============================================================

const TasksAndAssignmentStep = ({
  milestoneId,
  canEdit,
}: {
  milestoneId: string;
  canEdit: boolean;
}) => {
  const [showAssignment, setShowAssignment] = useState(false);

  if (showAssignment) {
    return (
      <ManagerMilestoneTaskAssignmentScreen
        milestoneId={milestoneId}
        canEdit={canEdit}
        onBack={() => setShowAssignment(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div />
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAssignment(true)}
        >
          Gán nông dân cho nhiệm vụ
        </Button>
      </div>
      <ManagerMilestoneTasksSection
        milestoneId={milestoneId}
        canEdit={canEdit}
      />
    </div>
  );
};

// ============================================================
// Main Detail Page
// ============================================================

const ManagerMilestoneDetailPage = () => {
  const { cropSeasonId, milestoneId } = useParams<{
    cropSeasonId: string;
    milestoneId: string;
  }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [currentStep, setCurrentStep] = useState(0);
  const [editingMilestone, setEditingMilestone] =
    useState<ProductionMilestoneResType | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const csId = cropSeasonId ?? "";
  const msId = milestoneId ?? "";
  const zoneId = searchParams.get("zoneId")?.trim() ?? "";

  const backTarget = zoneId
    ? `/dashboard/manager/crop-seasons/${csId}/milestones?zoneId=${encodeURIComponent(zoneId)}`
    : `/dashboard/manager/crop-seasons/${csId}/milestones`;

  // Queries
  const cropSeasonQuery = useManagerCropSeasonDetail(csId);
  const cropSeason = cropSeasonQuery.data?.data;
  const cropSeasonLabel = cropSeason?.cropName ?? "Mùa vụ";

  const listQuery = useManagerListProductionMilestones(csId, {
    page: 1,
    limit: 100,
  });
  const milestones = listQuery.data?.data.data ?? [];
  const milestone = milestones.find((m) => m.id === msId);

  const isPlanningCropSeason =
    cropSeason?.status === ProductionStatusName.Planning;
  const isApprovedCropSeason =
    cropSeason?.status === ProductionStatusName.Approved;
  const canEditMilestone = isPlanningCropSeason || isApprovedCropSeason;

  const updateMutation = useManagerUpdateProductionMilestone(csId);
  const deleteMutation = useManagerDeleteProductionMilestone(csId);

  // IoT assignment for step completion detection
  const assignmentQuery = useManagerMilestoneAssignment(msId, !!msId);
  const assignment = assignmentQuery.data?.data?.data ?? null;
  const assignmentId = assignment?.assignmentId ?? null;
  const iotDeviceId = assignment?.iotDeviceId ?? null;
  const hasDevice = !!assignment;

  // Bound sensors that require thresholds
  const boundSensors = assignment?.sensors ?? [];
  const eligibleBoundSensors = boundSensors.filter((s) =>
    THRESHOLD_ELIGIBLE.has(s.sensorType),
  );
  const hasSensorsWithoutThreshold =
    eligibleBoundSensors.length > 0 &&
    eligibleBoundSensors.some((s) => s.threshold?.source === "none");

  // Step 3 is locked when there are eligible sensors missing thresholds
  const isStep3Locked = hasSensorsWithoutThreshold;

  // Derive step statuses
  const stepStatuses: StepStatus[] = (() => {
    const statuses: StepStatus[] = [];

    // Step 0: IoT
    if (hasDevice) {
      statuses.push(currentStep === 0 ? "current" : "completed");
    } else {
      statuses.push(currentStep === 0 ? "current" : "upcoming");
    }

    // Step 1: Sensors & Thresholds — locked if no device
    if (!hasDevice) {
      statuses.push("locked");
    } else {
      statuses.push(currentStep === 1 ? "current" : "upcoming");
    }

    // Step 2: Tasks — locked if sensors exist but missing thresholds
    if (isStep3Locked) {
      statuses.push("locked");
    } else {
      statuses.push(currentStep === 2 ? "current" : "upcoming");
    }

    return statuses;
  })();

  const handleStepClick = (index: number) => {
    if (stepStatuses[index] === "locked") return;
    setCurrentStep(index);
  };

  const handleUpdate = (form: MilestoneEditFormState) => {
    if (!milestone) return;

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
      { milestoneId: msId, body: payload },
      { onSuccess: () => setEditingMilestone(null) },
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(msId, {
      onSuccess: () => navigate(backTarget),
    });
  };

  // Loading state
  if (listQuery.isLoading || cropSeasonQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Milestone not found
  if (!milestone) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(backTarget)}
          className="-ml-2 gap-1 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Không tìm thấy mốc sản xuất.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/dashboard/manager/milestones">Mốc sản xuất</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={backTarget}>{cropSeasonLabel}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              #{milestone.milestoneOrder} {milestone.stageName}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(backTarget)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                #{milestone.milestoneOrder} {milestone.stageName}
              </h1>
              <Badge variant={STATUS_META[milestone.status].variant}>
                {STATUS_META[milestone.status].label}
              </Badge>
            </div>
            {milestone.expectedStartDate && (
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(milestone.expectedStartDate)}
                {milestone.expectedEndDate
                  ? ` → ${formatDate(milestone.expectedEndDate)}`
                  : ""}
              </p>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canEditMilestone && (
              <DropdownMenuItem onClick={() => setEditingMilestone(milestone)}>
                <Pencil className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </DropdownMenuItem>
            )}
            {isPlanningCropSeason && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() =>
                navigate(
                  `/dashboard/manager/tickets?milestoneId=${msId}&milestoneName=${encodeURIComponent(`#${milestone.milestoneOrder} ${milestone.stageName}`)}`,
                )
              }
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Báo cáo sự cố
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stepper */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <MilestoneStepper
            steps={STEP_DEFS}
            currentStep={currentStep}
            stepStatuses={stepStatuses}
            onStepClick={handleStepClick}
          />
        </CardContent>
      </Card>

      {/* Step content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                {STEP_DEFS[currentStep].label}
              </CardTitle>
              <CardDescription>
                {currentStep === 0 &&
                  "Gán thiết bị IoT (board_module) cho mốc sản xuất này."}
                {currentStep === 1 &&
                  "Liên kết cảm biến từ thiết bị và cấu hình ngưỡng tối ưu."}
                {currentStep === 2 && "Quản lý nhiệm vụ và phân công nông dân."}
              </CardDescription>
              {currentStep === 1 && hasSensorsWithoutThreshold && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Cần cấu hình ngưỡng cho tất cả cảm biến trước khi gán nông
                  dân.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleStepClick(
                      currentStep === 1 && !hasDevice ? 0 : currentStep - 1,
                    )
                  }
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Bước trước
                </Button>
              )}
              {currentStep < 2 && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={stepStatuses[currentStep + 1] === "locked"}
                  onClick={() => handleStepClick(currentStep + 1)}
                >
                  Bước tiếp
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Step 1: IoT Device */}
          {currentStep === 0 && (
            <>
              {isPlanningCropSeason ? (
                <IotAssignmentSection milestoneId={msId} />
              ) : (
                <IotAssignmentReadOnly milestoneId={msId} />
              )}
            </>
          )}

          {/* Step 2: Sensor Binding & Thresholds */}
          {currentStep === 1 && (
            <>
              {isPlanningCropSeason && assignmentId ? (
                <div className="space-y-6">
                  <SensorBindingSection
                    assignmentId={assignmentId}
                    iotDeviceId={iotDeviceId ?? undefined}
                  />
                  <Separator />
                  <ThresholdSection
                    assignmentId={assignmentId}
                    milestoneId={msId}
                  />
                </div>
              ) : !isPlanningCropSeason && assignment ? (
                <SensorBindingReadOnly
                  sensors={assignment.sensors}
                  deviceName={assignment.device.deviceName}
                />
              ) : (
                <div className="rounded-md border border-dashed p-6 text-center">
                  <Radio className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Cần gán thiết bị IoT trước khi liên kết cảm biến.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Step 3: Tasks & Farmer Assignment */}
          {currentStep === 2 && (
            <TasksAndAssignmentStep
              milestoneId={msId}
              canEdit={canEditMilestone}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
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

      {/* Delete Confirm */}
      <ConfirmDialog
        open={confirmDelete}
        title="Xóa mốc?"
        description="Lượt gán IoT và liên kết cảm biến của mốc này cũng sẽ bị xóa."
        confirmLabel="Xóa"
        variant="destructive"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ManagerMilestoneDetailPage;
