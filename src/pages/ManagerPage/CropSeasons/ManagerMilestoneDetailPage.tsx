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
import { Checkbox } from "@/components/ui/checkbox";
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
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router";
import { cn } from "@/lib/utils";
import {
  formatMilestoneIotDetailDeviceLabel,
  milestoneIotModuleTypeVi,
} from "@/lib/milestone-iot-display";
import {
  useManagerListProductionMilestones,
  useManagerUpdateProductionMilestone,
  useManagerDeleteProductionMilestone,
  useManagerListMilestoneAssignments,
  useManagerUnassignIotDevice,
  useManagerListPurchaseBoards,
  useManagerBulkAssignIotDevices,
  useManagerIotConfig,
  useManagerUpdateIotConfig,
} from "@/queries/useProductionMilestone";
import { useManagerCropSeasonDetail } from "@/queries/useCropSeason";
import { useDynamicBreadcrumb } from "@/stores/breadcrumbStore";
import ManagerMilestoneTasksSection, {
  ManagerMilestoneTaskAssignmentScreen,
} from "@/pages/ManagerPage/EmployeeTasks/ManagerMilestoneTasksSection";
import {
  useManagerListEmployeeTasks,
  invalidateManagerEmployeeTasksQueriesForMilestone,
} from "@/queries/useEmployeeTask";
import {
  IOT_CONFIG_ALLOWED_SENSOR_TYPES,
  type IotConfigPutBodyType,
  type IotConfigSensorType,
  type ProductionMilestoneResType,
  type ProductionMilestoneStatusType,
} from "@/schemaValidatation/productionMilestone";
import type {
  BulkAssignIotDevicesResType,
  MilestoneAssignmentDetailResType,
} from "@/schemaValidatation/milestoneIotDevice";
import type {
  SensorThresholdItemResType,
  UpsertSensorThresholdBodyType,
} from "@/schemaValidatation/sensorThreshold";
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
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/constants";
import { sensorThresholdService } from "@/services/sensorThresholdService";
import type { ApiResponseType } from "@/types/api";

// ============================================================
// Helpers
// ============================================================

const STATUS_META: Record<
  ProductionMilestoneStatusType,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  pending: { label: "Chưa diễn ra", variant: "secondary" },
  in_progress: { label: "Đang thực hiện", variant: "default" },
  completed: { label: "Hoàn thành", variant: "outline" },
};

const SENSOR_TYPE_LABELS: Record<string, string> = {
  soil_moisture: "Độ ẩm đất",
  air_temperature: "Nhiệt độ không khí",
  air_humidity: "Độ ẩm không khí",
  light_intensity: "Cường độ ánh sáng",
};

const THRESHOLD_ALLOWED_SENSOR_TYPES = new Set<string>(
  IOT_CONFIG_ALLOWED_SENSOR_TYPES,
);

const THRESHOLD_SOURCE_LABEL_VI: Record<string, string> = {
  milestone: "Theo mốc",
  zone: "Theo khu vực trồng",
  none: "Chưa thiết lập",
};

function parseLocaleNumberInput(raw: string): number | undefined {
  const t = raw.trim().replace(",", ".");
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

const THRESHOLD_SOURCE_PRIORITY: Record<
  SensorThresholdItemResType["source"],
  number
> = {
  milestone: 3,
  zone: 2,
  none: 1,
};

function pickBetterMergedThresholdItem(
  a: SensorThresholdItemResType,
  b: SensorThresholdItemResType,
): SensorThresholdItemResType {
  const pa = THRESHOLD_SOURCE_PRIORITY[a.source];
  const pb = THRESHOLD_SOURCE_PRIORITY[b.source];
  if (pa !== pb) return pa > pb ? a : b;
  const ha = a.threshold != null ? 1 : 0;
  const hb = b.threshold != null ? 1 : 0;
  if (ha !== hb) return ha > hb ? a : b;
  return a;
}

function groupAssignmentsByZone(
  assignments: MilestoneAssignmentDetailResType[],
): Map<string, MilestoneAssignmentDetailResType[]> {
  const m = new Map<string, MilestoneAssignmentDetailResType[]>();
  for (const a of assignments) {
    const list = m.get(a.zoneId) ?? [];
    list.push(a);
    m.set(a.zoneId, list);
  }
  return m;
}

function listEligibleSensorTypesInZone(
  zoneAssignments: MilestoneAssignmentDetailResType[],
): string[] {
  const s = new Set<string>();
  for (const a of zoneAssignments) {
    for (const b of a.sensors) {
      if (THRESHOLD_ALLOWED_SENSOR_TYPES.has(b.sensorType)) {
        s.add(b.sensorType);
      }
    }
  }
  return sortEligibleSensorTypes(Array.from(s));
}

function sortEligibleSensorTypes(types: string[]): string[] {
  const order = IOT_CONFIG_ALLOWED_SENSOR_TYPES as readonly string[];
  return [...types].sort(
    (a, b) => order.indexOf(a) - order.indexOf(b),
  );
}

function bindingsForEligibleSensorType(
  zoneAssignments: MilestoneAssignmentDetailResType[],
  sensorType: string,
): MilestoneAssignmentDetailResType["sensors"][number][] {
  const out: MilestoneAssignmentDetailResType["sensors"][number][] = [];
  for (const a of zoneAssignments) {
    for (const b of a.sensors) {
      if (
        b.sensorType === sensorType &&
        THRESHOLD_ALLOWED_SENSOR_TYPES.has(b.sensorType)
      ) {
        out.push(b);
      }
    }
  }
  return out;
}

function mergeRowsForSensorType(
  zoneAssignments: MilestoneAssignmentDetailResType[],
  packs: Map<string, SensorThresholdItemResType[]>,
  sensorType: string,
): SensorThresholdItemResType | undefined {
  const candidates: SensorThresholdItemResType[] = [];
  for (const a of zoneAssignments) {
    const rows = packs.get(a.assignmentId) ?? [];
    for (const r of rows) {
      if (r.sensorType === sensorType) {
        candidates.push(r);
      }
    }
  }
  if (candidates.length === 0) return undefined;
  return candidates.reduce((acc, cur) =>
    pickBetterMergedThresholdItem(acc, cur),
  );
}

/** Giao của phạm vi thiết bị: giá trị tối ưu phải nằm trong từng cảm biến cùng loại. */
function aggregateStrictDeviceBounds(
  bindings: MilestoneAssignmentDetailResType["sensors"][number][],
): { strictMin?: number; strictMax?: number } {
  let lo: number | undefined;
  let hi: number | undefined;
  for (const b of bindings) {
    if (
      b.minValue == null ||
      b.maxValue == null ||
      !Number.isFinite(b.minValue) ||
      !Number.isFinite(b.maxValue)
    ) {
      continue;
    }
    lo = lo === undefined ? b.minValue : Math.max(lo, b.minValue);
    hi = hi === undefined ? b.maxValue : Math.min(hi, b.maxValue);
  }
  if (lo !== undefined && hi !== undefined && lo > hi) {
    return {};
  }
  return { strictMin: lo, strictMax: hi };
}

function pickAssignmentIdForSensorType(
  zoneAssignments: MilestoneAssignmentDetailResType[],
  sensorType: string,
): string | undefined {
  for (const a of zoneAssignments) {
    const ok = a.sensors.some(
      (b) =>
        b.sensorType === sensorType &&
        THRESHOLD_ALLOWED_SENSOR_TYPES.has(b.sensorType),
    );
    if (ok) return a.assignmentId;
  }
  return undefined;
}

function fallbackMergedThresholdItem(
  sensorType: string,
  bindings: MilestoneAssignmentDetailResType["sensors"][number][],
): SensorThresholdItemResType {
  const b = bindings[0]!;
  return {
    sensorId: b.sensorId,
    sensorType: sensorType as SensorThresholdItemResType["sensorType"],
    minValue:
      b.minValue != null && Number.isFinite(b.minValue)
        ? String(b.minValue)
        : "",
    maxValue:
      b.maxValue != null && Number.isFinite(b.maxValue)
        ? String(b.maxValue)
        : "",
    threshold: null,
    source: "none",
  };
}

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

// Wizard mốc bỏ bước "Cấu hình theo dõi" (2026-05-09): cấu hình tracking là
// thuộc tính của TOÀN VỤ MÙA (BE PUT theo `cropSeasonId`), không phải từng
// mốc — đặt ở đây gây hiểu lầm. Tracking config giờ hiển thị ở tab cùng tên
// trong Manager crop-seasons page (season level).
//
// Step 0 "Cấu hình IoT" thêm 2026-05-09: BẮT BUỘC save iotConfig (sampling +
// sensorTypes) trước khi qua các bước sau. BE GET trả `isConfigured` để FE
// biết milestone đã configured hay chưa (tránh nhầm lẫn DEFAULT fallback với
// user-saved). Khi chưa configured → step 1-3 đều locked.
const STEP_DEFS: StepDefinition[] = [
  {
    label: "Cấu hình IoT",
    description: "Chu kỳ lưu số đo và loại chỉ báo cần có",
  },
  {
    label: "Thiết bị IoT",
    description: "Gán thêm hoặc huỷ gán thiết bị",
  },
  {
    label: "Cảm biến",
    description: "Xem chỉ báo và đặt ngưỡng phù hợp",
  },
  {
    label: "Nhiệm vụ & Nông dân",
    description: "Tạo nhiệm vụ và phân công",
  },
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

  if (mode === "approved") {
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

const maxDate = (a?: Date, b?: Date): Date | undefined => {
  if (!a) return b;
  if (!b) return a;
  return a.getTime() >= b.getTime() ? a : b;
};

const MilestoneEditFormFields = ({
  form,
  errors,
  mode,
  onChange,
  minExpectedStartDate,
}: {
  form: MilestoneEditFormState;
  errors: MilestoneEditFormErrors;
  mode: MilestoneEditMode;
  onChange: <K extends keyof MilestoneEditFormState>(
    key: K,
    value: MilestoneEditFormState[K],
  ) => void;
  minExpectedStartDate?: Date;
}) => {
  const parsedExpectedStartDate = parseBackendDate(form.expectedStartDate);
  const normalizedMinExpectedStartDate = minExpectedStartDate
    ? startOfDay(minExpectedStartDate)
    : undefined;
  // End date must be after own start AND after the prev milestone's end date.
  const minExpectedEndDate = maxDate(
    parsedExpectedStartDate
      ? addDays(startOfDay(parsedExpectedStartDate), 1)
      : undefined,
    normalizedMinExpectedStartDate
      ? addDays(normalizedMinExpectedStartDate, 1)
      : undefined,
  );

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
              minDate={normalizedMinExpectedStartDate}
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

      {mode === "approved" && (
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
      )}

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
            <SelectItem value="pending">Chưa diễn ra</SelectItem>
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
  minExpectedStartDate,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: MilestoneEditFormState) => void;
  initialValues: MilestoneEditFormState;
  isSubmitting: boolean;
  mode: MilestoneEditMode;
  minExpectedStartDate?: Date;
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
          minExpectedStartDate={minExpectedStartDate}
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
// Step 0 — IoT Config (tần suất đo + loại dữ liệu)
// ============================================================

const IOT_SAMPLING_PRESETS_SECONDS = [
  { sec: 60, label: "1 phút" },
  { sec: 300, label: "5 phút" },
  { sec: 600, label: "10 phút" },
  { sec: 1800, label: "30 phút" },
] as const;

const IotConfigSection = ({
  cropSeasonId,
  milestoneId,
  isPlanning,
}: {
  cropSeasonId: string;
  milestoneId: string;
  /** Sau giai đoạn lập kế hoạch thì khóa không cho đổi danh sách loại đo. */
  isPlanning: boolean;
}) => {
  const configQuery = useManagerIotConfig(cropSeasonId, milestoneId);
  const config = configQuery.data?.data;
  const isConfigured = config?.isConfigured ?? false;

  const updateMutation = useManagerUpdateIotConfig(cropSeasonId, milestoneId);

  const [form, setForm] = useState<IotConfigPutBodyType>({
    readingIntervalSeconds: 300,
    sensorTypes: [...IOT_CONFIG_ALLOWED_SENSOR_TYPES],
  });

  useEffect(() => {
    if (config) {
      setForm({
        readingIntervalSeconds: config.readingIntervalSeconds,
        sensorTypes: [...config.sensorTypes],
      });
    }
  }, [config]);

  const r = form.readingIntervalSeconds;
  const intervalRangeInvalid =
    !Number.isFinite(r) || Number.isNaN(r) || r < 10 || r > 3600;
  const intervalFeasibilityInvalid =
    Number.isFinite(r) && !Number.isNaN(r) && Math.ceil(r * 1.5) > 3600;
  const intervalInvalid = intervalRangeInvalid || intervalFeasibilityInvalid;
  const noSensorSelected = form.sensorTypes.length === 0;

  const handleSubmit = () => {
    if (intervalRangeInvalid) {
      toast.error("Chu kỳ lưu phải từ 10 đến 3600 giây.");
      return;
    }
    if (intervalFeasibilityInvalid) {
      toast.error(
        "Chu kỳ này vượt quá mức hệ thống cho phép. Hãy chọn một khoảng ngắn hơn rồi thử lại.",
      );
      return;
    }
    if (noSensorSelected) {
      toast.error("Chọn ít nhất một loại chỉ báo cần theo dõi.");
      return;
    }
    updateMutation.mutate(form);
  };

  const toggleSensor = (t: IotConfigSensorType, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      sensorTypes: checked
        ? prev.sensorTypes.includes(t)
          ? prev.sensorTypes
          : [...prev.sensorTypes, t]
        : prev.sensorTypes.filter((x) => x !== t),
    }));
  };

  if (configQuery.isLoading) {
    return <Skeleton className="h-56 w-full" />;
  }

  const saveBlocked =
    updateMutation.isPending || intervalInvalid || noSensorSelected;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="border-b bg-muted/30 px-4 py-3">
          <p className="text-sm font-semibold tracking-tight">
            Chu kỳ lưu số đo
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Thiết bị cứ đến hạn thì đẩy số đo lên; hệ thống ghép vào nhật ký của
            mốc để báo cáo.
          </p>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium">
                Chu kỳ giữa hai lần lưu liên tiếp
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Chu kỳ càng ngắn, biểu đồ và dữ liệu càng chi tiết, chi phí lưu
                trữ càng cao. Thường dùng{" "}
                <span className="font-medium text-foreground">
                  khoảng 5 hay 10 phút
                </span>
                .
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {IOT_SAMPLING_PRESETS_SECONDS.map(({ sec, label }) => (
                <Button
                  key={sec}
                  type="button"
                  size="sm"
                  variant={
                    form.readingIntervalSeconds === sec ? "default" : "outline"
                  }
                  className="rounded-full"
                  onClick={() =>
                    setForm((p) => ({ ...p, readingIntervalSeconds: sec }))
                  }
                >
                  {label}
                  <span className="opacity-75 font-normal px-1 tabular-nums">
                    · {sec} giây
                  </span>
                </Button>
              ))}
            </div>
            <div>
              <label
                htmlFor="iot-reading-interval-custom"
                className="text-xs font-medium text-muted-foreground block mb-1.5"
              >
                Tự nhập (đơn vị giây, tối thiểu 10 — tối đa 3600)
              </label>
              <Input
                id="iot-reading-interval-custom"
                inputMode="numeric"
                type="number"
                className={cn(
                  "max-w-[200px]",
                  intervalInvalid && "border-destructive",
                )}
                min={10}
                max={3600}
                value={Number.isFinite(form.readingIntervalSeconds) ? form.readingIntervalSeconds : ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    readingIntervalSeconds: Number(e.target.value),
                  }))
                }
              />
              <p className={cn(
                "text-xs mt-1.5 leading-relaxed",
                intervalInvalid ? "text-destructive font-medium" : "text-muted-foreground",
              )}>
                {intervalRangeInvalid
                  ? "Nhập một số từ 10 đến 3600 giây."
                  : intervalFeasibilityInvalid
                    ? "Chu kỳ đang cao quá khung hiện tại của hệ thống. Vui lòng nhập giá trị nhỏ hơn."
                    : "Hệ thống dựa trên chu kỳ này để dự báo nguy cơ mất liên kết — bạn không cần chỉnh thêm ở mục khác."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <span className="text-sm font-medium">
            Loại chỉ báo cần theo dõi *
          </span>
          <p className="text-xs text-muted-foreground mt-0.5">
            Khi gán thiết bị, hệ thống chỉ nối các cảm biến thuộc đúng các loại đã
            chọn ở đây.
            {!isPlanning && (
              <span className="block mt-1 font-medium text-amber-700 dark:text-amber-400">
                Đã vận hành ngoài giai đoạn lập kế hoạch — không chỉnh được danh
                sách loại tại đây.
              </span>
            )}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl">
          {IOT_CONFIG_ALLOWED_SENSOR_TYPES.map((t) => {
            const checked = form.sensorTypes.includes(t);
            return (
              <label
                key={t}
                className={cn(
                  "flex items-start gap-3 rounded-lg border px-3 py-3 text-sm cursor-pointer transition-colors hover:bg-muted/35",
                  !isPlanning && "cursor-not-allowed opacity-65",
                  checked && "border-primary/50 bg-primary/5",
                )}
              >
                <Checkbox
                  className="mt-0.5"
                  checked={checked}
                  disabled={!isPlanning}
                  onCheckedChange={(v) => toggleSensor(t, !!v)}
                />
                <span className="font-medium leading-snug pt-px">
                  {SENSOR_TYPE_LABELS[t] ?? "—"}
                </span>
              </label>
            );
          })}
        </div>
        {noSensorSelected && (
          <p className="text-xs text-destructive">
            Cần chọn ít nhất một loại; không thì không có chỉ báo khớp để nối khi
            gán thiết bị.
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t">
        {isConfigured ? (
          <p className="text-xs text-emerald-600 flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 shrink-0" />
            Đã lưu. Có thể sang bước gán thiết bị hoặc xem cảm biến.
          </p>
        ) : (
          <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Nhớ bấm lưu để kích hoạt các bước tiếp theo.
          </p>
        )}
        <Button
          size="sm"
          className="sm:shrink-0"
          disabled={saveBlocked}
          onClick={handleSubmit}
        >
          {updateMutation.isPending
            ? "Đang lưu..."
            : isConfigured
              ? "Cập nhật"
              : "Lưu cấu hình"}
        </Button>
      </div>
    </div>
  );
};

// ============================================================
// Step 1 — IoT Device Bulk Assignment
// ============================================================
//
// Refactor 2026-05-09: gộp single-assign + sensor-binding vào 1 luồng bulk.
// BE `assign-bulk` tự động bind sensor theo `iotConfig.sensorTypes` của mốc,
// nên FE chỉ cần multi-select board → submit. Step 2 (cảm biến) chuyển thành
// read-only — muốn đổi loại cảm biến → quay lại Step 0 (Cấu hình IoT).

const IotBulkAssignSection = ({ milestoneId }: { milestoneId: string }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPage, setPickerPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkResult, setBulkResult] = useState<
    BulkAssignIotDevicesResType | null
  >(null);
  const [confirmUnassign, setConfirmUnassign] = useState<string | null>(null);

  /** Tên hiển thị kết quả gán — không dùng UUID */
  const deviceLabelByIdRef = useRef(new Map<string, string>());

  const assignmentsQuery = useManagerListMilestoneAssignments(milestoneId);
  const assignments = assignmentsQuery.data?.data.data ?? [];

  const purchaseQuery = useManagerListPurchaseBoards(
    milestoneId,
    { page: pickerPage, limit: 10, search: search || undefined },
    showPicker,
  );
  const boards = purchaseQuery.data?.data.data ?? [];
  const boardsMeta = purchaseQuery.data?.data.meta;

  const bulkMutation = useManagerBulkAssignIotDevices(milestoneId);
  const unassignMutation = useManagerUnassignIotDevice(milestoneId);

  const closePicker = () => {
    setShowPicker(false);
    setSelected(new Set());
    setSearch("");
    setPickerPage(1);
  };

  const handleBulkAssign = () => {
    if (selected.size === 0) {
      toast.error("Hãy chọn ít nhất một thiết bị.");
      return;
    }
    bulkMutation.mutate(
      { iotDeviceIds: Array.from(selected) },
      {
        onSuccess: (res) => {
          setBulkResult(res.data);
          closePicker();
        },
      },
    );
  };

  const handleUnassign = (iotDeviceId: string) => {
    unassignMutation.mutate(
      { iotDeviceId },
      { onSuccess: () => setConfirmUnassign(null) },
    );
  };

  const toggleSelect = (deviceId: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(deviceId);
        const nm = boards.find((b) => b.id === deviceId)?.deviceName?.trim();
        if (nm) deviceLabelByIdRef.current.set(deviceId, nm);
      } else {
        next.delete(deviceId);
        deviceLabelByIdRef.current.delete(deviceId);
      }
      return next;
    });
  };

  const allSelected =
    boards.length > 0 && boards.every((b) => selected.has(b.id));

  const toggleSelectAll = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const b of boards) {
        if (checked) {
          next.add(b.id);
          const nm = b.deviceName?.trim();
          if (nm) deviceLabelByIdRef.current.set(b.id, nm);
        } else {
          next.delete(b.id);
          deviceLabelByIdRef.current.delete(b.id);
        }
      }
      return next;
    });
  };

  if (assignmentsQuery.isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Cpu className="h-4 w-4" />
          Thiết bị đã gán ({assignments.length})
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowPicker(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Gán thêm thiết bị
        </Button>
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-center">
          <Cpu className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            Chưa có thiết bị nào được gán cho mốc này.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Có thể gán một hoặc nhiều thiết bị trong một lượt; chỉ báo sẽ được
            nối tự động theo cấu hình ở bước trước.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => (
            <div
              key={a.assignmentId}
              className="rounded-md border p-3 bg-muted/30 text-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {formatMilestoneIotDetailDeviceLabel(a.device)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {a.sensors.length} cảm biến đã liên kết · Gán lúc{" "}
                    {formatDate(a.assignedAt)}
                  </p>
                  {a.device.isDeleted && (
                    <p className="text-xs text-destructive mt-1">
                      Thiết bị đã tháo khỏi kho — thông tin chỉ còn trong lịch
                      sử gán.
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive h-7 px-2"
                  onClick={() => setConfirmUnassign(a.iotDeviceId)}
                >
                  <X className="h-3 w-3 mr-1" />
                  Huỷ gán
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bulk picker */}
      <Dialog
        open={showPicker}
        onOpenChange={(v) => {
          if (!v) closePicker();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gán thiết bị cho mốc</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Tìm kiếm theo tên…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPickerPage(1);
              }}
            />
            <div className="flex items-center gap-2 text-xs">
              <Checkbox
                checked={allSelected}
                disabled={boards.length === 0}
                onCheckedChange={(v) => toggleSelectAll(!!v)}
              />
              <span>
                Chọn cả trang này ({selected.size} thiết bị đã chọn)
              </span>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {purchaseQuery.isLoading ? (
                [0, 1, 2].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-14 w-full"
                  />
                ))
              ) : boards.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Hiện không còn thiết bị trống để gán.
                </p>
              ) : (
                boards.map((dev) => (
                  <label
                    key={dev.id}
                    className="flex items-center gap-2 rounded-md border p-3 hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selected.has(dev.id)}
                      onCheckedChange={(v) => toggleSelect(dev.id, !!v)}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{dev.deviceName}</p>
                      {milestoneIotModuleTypeVi(dev.deviceType) && (
                        <p className="text-xs text-muted-foreground leading-snug">
                          {milestoneIotModuleTypeVi(dev.deviceType)}
                        </p>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>
            {boardsMeta && boardsMeta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 text-xs">
                <span>
                  Trang {pickerPage} / {boardsMeta.totalPages}
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
                    disabled={pickerPage >= boardsMeta.totalPages}
                    onClick={() => setPickerPage((p) => p + 1)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closePicker}
            >
              Hủy
            </Button>
            <Button
              disabled={bulkMutation.isPending || selected.size === 0}
              onClick={handleBulkAssign}
            >
              {bulkMutation.isPending ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Đang gán...
                </>
              ) : (
                `Gán ${selected.size} thiết bị`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk-assign result modal */}
      {bulkResult && (
        <Dialog
          open={!!bulkResult}
          onOpenChange={(v) => {
            if (!v) {
              setBulkResult(null);
              deviceLabelByIdRef.current.clear();
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Kết quả gán: {bulkResult.summary.succeeded}/
                {bulkResult.summary.attempted} thành công
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {bulkResult.results.map((r) => (
                <div
                  key={r.iotDeviceId}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm",
                    r.ok
                      ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20"
                      : "bg-destructive/10 border-destructive/40",
                  )}
                >
                  <div className="flex items-center gap-2">
                    {r.ok ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-destructive" />
                    )}
                    <span className="text-sm font-medium truncate min-w-0">
                      {deviceLabelByIdRef.current.get(r.iotDeviceId) ??
                        "Thiết bị đã chọn"}
                    </span>
                    <Badge
                      variant={r.ok ? "default" : "destructive"}
                      className="text-[10px]"
                    >
                      {r.ok ? "Thành công" : "Thất bại"}
                    </Badge>
                  </div>
                  {r.error && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {r.error}
                    </p>
                  )}
                  {r.missingSensorTypes.length > 0 && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      Thiếu các chỉ báo đã định trong cấu hình mốc:{" "}
                      {r.missingSensorTypes
                        .map((x) => SENSOR_TYPE_LABELS[x] ?? x)
                        .join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setBulkResult(null);
                  deviceLabelByIdRef.current.clear();
                }}
              >
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <ConfirmDialog
        open={!!confirmUnassign}
        title="Huỷ gán thiết bị?"
        description="Huỷ lượt gán này sẽ gỡ toàn bộ liên kết cảm biến của thiết bị đó khỏi mốc."
        confirmLabel="Huỷ gán"
        variant="destructive"
        onCancel={() => setConfirmUnassign(null)}
        onConfirm={() =>
          confirmUnassign && handleUnassign(confirmUnassign)
        }
      />
    </div>
  );
};

// ============================================================
// Step 2 — Cảm biến: ngưỡng theo khu vực, lưu một lần cho mọi chỉ báo
// ============================================================

function ZoneBulkThresholdRow({
  zoneId,
  sensorType,
  merged,
  drafts,
  onDraftChange,
  zoneAssignments,
}: {
  zoneId: string;
  sensorType: string;
  merged: SensorThresholdItemResType;
  drafts: { minStr: string; maxStr: string };
  onDraftChange: (next: { minStr: string; maxStr: string }) => void;
  zoneAssignments: MilestoneAssignmentDetailResType[];
}) {
  const zoneLocked = merged.source === "zone";
  const viLabel =
    SENSOR_TYPE_LABELS[sensorType] ?? "Chỉ báo không xác định";
  const bindings = bindingsForEligibleSensorType(
    zoneAssignments,
    sensorType,
  );
  const unitSuffix = bindings[0]?.unit ? ` ${bindings[0].unit}` : "";
  const { strictMin, strictMax } = aggregateStrictDeviceBounds(bindings);

  const saved =
    merged.threshold != null
      ? `Hiện tại: ${merged.threshold.optimalMin} – ${merged.threshold.optimalMax}${unitSuffix} · ${THRESHOLD_SOURCE_LABEL_VI[merged.source] ?? merged.source}`
      : null;

  return (
    <div className="rounded-md border bg-background px-3 py-3 text-sm space-y-2 shadow-sm">
      <div className="flex flex-wrap items-start gap-2 gap-y-1">
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-snug">{viLabel}</p>
          {saved && (
            <p className="text-[11px] text-muted-foreground mt-1">
              Đang lưu: {saved}
            </p>
          )}
          {zoneLocked && (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              Ngưỡng đang theo cài đặt khu vực trồng — không chỉnh được ở đây.
            </p>
          )}
        </div>
      </div>

      {strictMin != null && strictMax != null && (
        <p className="text-xs text-muted-foreground">
          Thang chung (mọi cảm biến cùng loại trong khu vực): {strictMin} –{" "}
          {strictMax}
          {unitSuffix}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor={`${zoneId}-${sensorType}-min`}
            className="text-xs font-medium text-muted-foreground block mb-1"
          >
            Nhỏ nhất trong khung mong muốn{unitSuffix}
          </label>
          <Input
            id={`${zoneId}-${sensorType}-min`}
            inputMode="decimal"
            disabled={zoneLocked}
            value={drafts.minStr}
            onChange={(e) =>
              onDraftChange({ ...drafts, minStr: e.target.value })
            }
            className="h-9"
          />
        </div>
        <div>
          <label
            htmlFor={`${zoneId}-${sensorType}-max`}
            className="text-xs font-medium text-muted-foreground block mb-1"
          >
            Lớn nhất trong khung mong muốn{unitSuffix}
          </label>
          <Input
            id={`${zoneId}-${sensorType}-max`}
            inputMode="decimal"
            disabled={zoneLocked}
            value={drafts.maxStr}
            onChange={(e) =>
              onDraftChange({ ...drafts, maxStr: e.target.value })
            }
            className="h-9"
          />
        </div>
      </div>
    </div>
  );
}

function ZoneBulkThresholdPanel({
  milestoneId,
  zoneId,
  zoneTitle,
  zoneAssignments,
}: {
  milestoneId: string;
  zoneId: string;
  zoneTitle: string;
  zoneAssignments: MilestoneAssignmentDetailResType[];
}) {
  const qc = useQueryClient();
  const assignmentIds = useMemo(
    () => zoneAssignments.map((a) => a.assignmentId),
    [zoneAssignments],
  );

  const thresholdQueries = useQueries({
    queries: assignmentIds.map((id) => ({
      queryKey: QUERY_KEYS.manager.productionMilestones.thresholds(id),
      queryFn: () => sensorThresholdService.get(id),
      enabled: !!id,
    })),
  });

  const loading = thresholdQueries.some((q) => q.isPending || q.isLoading);
  const hasError = thresholdQueries.some((q) => q.isError);

  const packsMap = new Map<string, SensorThresholdItemResType[]>();
  for (let i = 0; i < assignmentIds.length; i++) {
    const id = assignmentIds[i]!;
    packsMap.set(id, thresholdQueries[i]?.data?.data?.data ?? []);
  }

  const sensorTypesSorted = listEligibleSensorTypesInZone(zoneAssignments);

  const mergedByType: Record<string, SensorThresholdItemResType> = {};
  for (const st of sensorTypesSorted) {
    const bindings = bindingsForEligibleSensorType(zoneAssignments, st);
    mergedByType[st] =
      mergeRowsForSensorType(zoneAssignments, packsMap, st) ??
      fallbackMergedThresholdItem(st, bindings);
  }

  const mergedSignature = sensorTypesSorted
    .map((st) => {
      const m = mergedByType[st]!;
      const t = m.threshold;
      return `${st}:${m.source}:${t?.optimalMin ?? ""}:${t?.optimalMax ?? ""}`;
    })
    .join("|");

  const [drafts, setDrafts] = useState<
    Record<string, { minStr: string; maxStr: string }>
  >({});

  useEffect(() => {
    if (loading || sensorTypesSorted.length === 0) return;
    const next: Record<string, { minStr: string; maxStr: string }> = {};
    for (const st of sensorTypesSorted) {
      const m = mergedByType[st]!;
      const opt = m.threshold;
      next[st] = {
        minStr: opt != null ? String(opt.optimalMin) : "",
        maxStr: opt != null ? String(opt.optimalMax) : "",
      };
    }
    setDrafts(next);
  }, [loading, mergedSignature]);

  const editableTypes = sensorTypesSorted.filter(
    (st) => mergedByType[st]!.source !== "zone",
  );

  const bulkSnapRef = useRef({
    drafts: {} as Record<string, { minStr: string; maxStr: string }>,
    editableTypes: [] as string[],
    mergedByType: {} as Record<string, SensorThresholdItemResType>,
    zoneAssignments: [] as MilestoneAssignmentDetailResType[],
    assignmentIds: [] as string[],
    milestoneId,
  });

  bulkSnapRef.current = {
    drafts,
    editableTypes,
    mergedByType,
    zoneAssignments,
    assignmentIds,
    milestoneId,
  };

  const bulkSaveMutation = useMutation({
    mutationFn: async () => {
      const {
        drafts: snapDrafts,
        editableTypes: types,
        mergedByType: mergedMap,
        zoneAssignments: zAssignments,
      } = bulkSnapRef.current;

      if (types.length === 0) {
        throw new Error(
          "Không có chỉ báo nào chỉnh được ở khu vực này (đang theo cài đặt khu vực trồng).",
        );
      }
      for (const sensorType of types) {
        const merged = mergedMap[sensorType]!;
        const pickId = pickAssignmentIdForSensorType(
          zAssignments,
          sensorType,
        );
        if (!pickId) continue;

        const d = snapDrafts[sensorType];
        if (!d) {
          throw new Error("Dữ liệu form chưa sẵn sàng — thử tải lại trang.");
        }

        const minN = parseLocaleNumberInput(d.minStr);
        const maxN = parseLocaleNumberInput(d.maxStr);
        if (minN === undefined || maxN === undefined) {
          throw new Error(
            "Nhập đủ giá trị nhỏ nhất và lớn nhất cho mọi chỉ báo có thể chỉnh.",
          );
        }
        if (minN > maxN) {
          throw new Error(
            "Giá trị nhỏ nhất không được lớn hơn giá trị lớn nhất.",
          );
        }

        const bindings = bindingsForEligibleSensorType(
          zAssignments,
          sensorType,
        );
        const { strictMin, strictMax } = aggregateStrictDeviceBounds(bindings);
        if (
          strictMin !== undefined &&
          strictMax !== undefined &&
          (minN < strictMin || maxN > strictMax)
        ) {
          throw new Error(
            `Giá trị phải nằm trong khoảng cho phép của thiết bị (${strictMin} – ${strictMax}).`,
          );
        }

        const body: UpsertSensorThresholdBodyType = {
          sensorType: sensorType as UpsertSensorThresholdBodyType["sensorType"],
          optimalMin: minN,
          optimalMax: maxN,
        };
        const isUpdate = merged.source === "milestone";
        if (isUpdate) {
          await sensorThresholdService.update(pickId, body);
        } else {
          await sensorThresholdService.create(pickId, body);
        }
      }
    },
    onSuccess: () => {
      toast.success("Đã lưu tất cả ngưỡng trong khu vực");
      const { assignmentIds: ids, milestoneId: msId } = bulkSnapRef.current;
      for (const id of ids) {
        qc.invalidateQueries({
          queryKey: QUERY_KEYS.manager.productionMilestones.thresholds(id),
        });
      }
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.manager.productionMilestones.assignments(msId),
      });
      invalidateManagerEmployeeTasksQueriesForMilestone(qc, msId);
    },
    onError: (error: unknown) => {
      const ax = error as AxiosError<ApiResponseType>;
      const msg =
        error instanceof Error
          ? error.message
          : (ax.response?.data?.message as string | undefined);
      toast.error(
        typeof msg === "string" && msg.trim()
          ? msg
          : "Không lưu được ngưỡng",
      );
    },
  });

  return (
    <div className="rounded-lg border bg-card/50 p-4 space-y-4">
      <div>
        <p className="font-medium text-sm">{zoneTitle}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
          {zoneAssignments.map((a) => (
            <span key={a.assignmentId} className="inline-flex items-center gap-1">
              <Cpu className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-48">{a.device.deviceName}</span>
            </span>
          ))}
        </div>
      </div>

      {hasError && (
        <p className="text-xs text-destructive">
          Không tải được cấu hình ngưỡng cho một hoặc nhiều lượt gán trong khu
          vực này.
        </p>
      )}

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : sensorTypesSorted.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          Không có chỉ báo được hỗ trợ chỉnh ngưỡng ở khu vực này.
        </p>
      ) : (
        <>
          <div className="space-y-4">
            {sensorTypesSorted.map((st) => (
              <ZoneBulkThresholdRow
                key={st}
                zoneId={zoneId}
                sensorType={st}
                merged={mergedByType[st]!}
                drafts={drafts[st] ?? { minStr: "", maxStr: "" }}
                onDraftChange={(next) =>
                  setDrafts((prev) => ({ ...prev, [st]: next }))
                }
                zoneAssignments={zoneAssignments}
              />
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={
                loading ||
                hasError ||
                bulkSaveMutation.isPending ||
                editableTypes.length === 0
              }
              onClick={() => bulkSaveMutation.mutate()}
            >
              {bulkSaveMutation.isPending
                ? "Đang lưu…"
                : "Lưu tất cả ngưỡng"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

const MilestoneSensorThresholdStepSection = ({
  milestoneId,
}: {
  milestoneId: string;
}) => {
  const assignmentsQuery = useManagerListMilestoneAssignments(milestoneId);
  const assignments = assignmentsQuery.data?.data.data ?? [];

  if (assignmentsQuery.isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (assignments.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center">
        <Radio className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">
          Chưa gán thiết bị nên không có chỉ báo để hiển thị.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Quay lại bước "Thiết bị IoT" để chọn board cần gán vào mốc.
        </p>
      </div>
    );
  }

  const byZone = groupAssignmentsByZone(assignments);
  const zoneEntries = Array.from(byZone.entries());

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Chỉ báo trong cùng một khu vực trồng dùng{" "}
        <span className="font-medium text-foreground">một bảng cấu hình chung</span>
        : nhập ngưỡng nhỏ nhất và lớn nhất mong muốn cho từng loại, sau đó bấm{" "}
        <span className="font-medium text-foreground">Lưu tất cả ngưỡng</span>{" "}
        để ghi đồng loạt cho mốc này (không cần lưu từng thẻ thiết bị). Phần mất
        tín hiệu thiết bị do hệ thống cấu hình, không nhập ở đây.
      </p>
          {zoneEntries.map(([zid, zoneAssignments], idx) => (
            <ZoneBulkThresholdPanel
              key={zid}
              milestoneId={milestoneId}
              zoneId={zid}
              zoneTitle={`Khu vực ${idx + 1}`}
              zoneAssignments={zoneAssignments}
            />
          ))}
    </div>
  );
};

// ============================================================
// Step 3 — Tasks & Farmer Assignment
// ============================================================

const TasksAndAssignmentStep = ({
  milestoneId,
  canEdit,
  hasTasks,
  lockComplete,
}: {
  milestoneId: string;
  canEdit: boolean;
  hasTasks: boolean;
  /** True khi cropSeason ở planning → ẩn nút "Hoàn thành" + lock status select. */
  lockComplete: boolean;
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
          disabled={!hasTasks}
          onClick={() => setShowAssignment(true)}
        >
          Gán nông dân cho nhiệm vụ
        </Button>
      </div>
      {!hasTasks && (
        <p className="text-xs text-amber-600">
          Cần tạo ít nhất 1 nhiệm vụ trước khi gán nhân viên.
        </p>
      )}
      <ManagerMilestoneTasksSection
        milestoneId={milestoneId}
        canEdit={canEdit}
        lockComplete={lockComplete}
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
  const qc = useQueryClient();

  const [currentStep, setCurrentStep] = useState(0);
  const [editingMilestone, setEditingMilestone] =
    useState<ProductionMilestoneResType | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const csId = cropSeasonId ?? "";
  const msId = milestoneId ?? "";
  const zoneId = searchParams.get("zoneId")?.trim() ?? "";

  useEffect(() => {
    if (currentStep !== 3) return;
    if (!msId) return;
    invalidateManagerEmployeeTasksQueriesForMilestone(qc, msId);
  }, [currentStep, msId, qc]);

  const cropSeasonsUrl = zoneId
    ? `/dashboard/manager/crop-seasons?zoneId=${encodeURIComponent(zoneId)}`
    : "/dashboard/manager/crop-seasons";
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

  useDynamicBreadcrumb(
    `/dashboard/manager/crop-seasons/${csId}`,
    cropSeason?.cropName,
  );
  useDynamicBreadcrumb(
    `/dashboard/manager/crop-seasons/${csId}/milestones/${msId}`,
    milestone?.stageName,
  );

  const isPlanningCropSeason =
    cropSeason?.status === ProductionStatusName.Planning;
  const isApprovedCropSeason =
    cropSeason?.status === ProductionStatusName.Approved;
  const isRejectedCropSeason =
    cropSeason?.status === ProductionStatusName.Rejected;
  const isWizardState = isPlanningCropSeason || isRejectedCropSeason;
  const canEditMilestone = isWizardState;

  const findOverlappingMilestone = (
    startDate: string | null | undefined,
    endDate: string | null | undefined,
    excludeMilestoneId?: string,
  ) => {
    const parsedStart = parseBackendDate(startDate);
    const parsedEnd = parseBackendDate(endDate);
    if (!parsedStart || !parsedEnd) return null;

    const nextStart = startOfDay(parsedStart).getTime();
    const nextEnd = startOfDay(parsedEnd).getTime();

    return milestones.find((item) => {
      if (excludeMilestoneId && item.id === excludeMilestoneId) return false;
      const itemStart = parseBackendDate(item.expectedStartDate);
      const itemEnd = parseBackendDate(item.expectedEndDate);
      if (!itemStart || !itemEnd) return false;
      const itemStartValue = startOfDay(itemStart).getTime();
      const itemEndValue = startOfDay(itemEnd).getTime();
      return nextStart <= itemEndValue && itemStartValue <= nextEnd;
    });
  };

  const updateMutation = useManagerUpdateProductionMilestone(csId);
  const deleteMutation = useManagerDeleteProductionMilestone(csId);

  // IoT config gating — milestone must have iotConfig saved before user can
  // proceed to device assignment / sensor binding / tasks.
  const iotConfigQuery = useManagerIotConfig(csId, msId, !!csId && !!msId);
  const iotConfig = iotConfigQuery.data?.data ?? null;
  const isIotConfigured = iotConfig?.isConfigured ?? false;

  // IoT assignments — list ALL active devices on this milestone (post bulk-assign).
  const assignmentsQuery = useManagerListMilestoneAssignments(msId, !!msId);
  const assignments = assignmentsQuery.data?.data.data ?? [];
  const hasDevice = assignments.length > 0;

  // Step 2 completion check: gọi threshold cho từng assignment, đánh dấu xong
  // khi có ít nhất 1 ngưỡng do user lưu ở mốc (source === "milestone").
  const stepThresholdQueries = useQueries({
    queries: assignments.map((a) => ({
      queryKey: QUERY_KEYS.manager.productionMilestones.thresholds(a.assignmentId),
      queryFn: () => sensorThresholdService.get(a.assignmentId),
      enabled: !!a.assignmentId,
      refetchOnMount: "always" as const,
      staleTime: 0,
    })),
  });
  const hasMilestoneThreshold =
    hasDevice &&
    stepThresholdQueries.some((q) =>
      (q.data?.data?.data ?? []).some((row) => row.source === "milestone"),
    );

  const taskValidationQuery = useManagerListEmployeeTasks(
    msId,
    { page: 1, limit: 100 },
    !!msId,
  );
  const milestoneTasks = taskValidationQuery.data?.data?.data ?? [];
  const taskMeta = taskValidationQuery.data?.data?.meta;
  const totalTaskItems = taskMeta?.totalItems ?? milestoneTasks.length;
  const hasTasks = totalTaskItems > 0;
  const fetchedAllTasks = taskMeta
    ? !taskMeta.hasNextPage
    : milestoneTasks.length >= totalTaskItems;
  const allTasksAssigned =
    hasTasks &&
    fetchedAllTasks &&
    milestoneTasks.every((task) => Boolean(task.assignedTo));
  const canCompleteMilestoneSetup = hasTasks && allTasksAssigned;

  // Luôn refetch 4 API check-data mỗi lần vào page (không dùng cache cũ).
  useEffect(() => {
    iotConfigQuery.refetch();
    assignmentsQuery.refetch();
    taskValidationQuery.refetch();
    // threshold queries đã set refetchOnMount="always" ở trên.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [csId, msId]);

  // Derive step statuses (wizard 4 bước) — tích completed theo DỮ LIỆU thực tế
  // từ 4 API tương ứng, không phụ thuộc currentStep:
  //  0 = Cấu hình IoT          → isIotConfigured
  //  1 = Gán thiết bị IoT      → hasDevice
  //  2 = Cảm biến + ngưỡng     → hasMilestoneThreshold (cần hasDevice)
  //  3 = Nhiệm vụ + nông dân   → hasTasks && allTasksAssigned
  const stepStatuses: StepStatus[] = (() => {
    const compute = (
      index: number,
      completed: boolean,
      locked = false,
    ): StepStatus => {
      if (locked) return "locked";
      if (currentStep === index) return "current";
      if (completed) return "completed";
      return "upcoming";
    };

    return [
      compute(0, isIotConfigured),
      compute(1, hasDevice, !isIotConfigured),
      compute(2, hasMilestoneThreshold, !isIotConfigured || !hasDevice),
      compute(3, canCompleteMilestoneSetup, !isIotConfigured),
    ];
  })();

  const handleStepClick = (index: number) => {
    if (stepStatuses[index] === "locked") return;
    setCurrentStep(index);
  };

  const handleSkipIotStep = () => {
    if (hasDevice) return;
    handleStepClick(3);
  };

  const handleFinish = () => {
    if (!hasTasks) {
      toast.error(
        "Cần ít nhất một nhiệm vụ trong mốc trước khi kết thúc bước này.",
      );
      return;
    }
    if (!allTasksAssigned) {
      toast.error(
        "Cần chọn đủ người làm cho tất cả nhiệm vụ trước khi hoàn thành.",
      );
      return;
    }
    navigate(backTarget);
  };

  const handleUpdate = (form: MilestoneEditFormState) => {
    if (!milestone) return;
    if (!cropSeason?.id) {
      toast.error("Không tìm thấy thông tin mùa vụ hợp lệ.");
      return;
    }

    if (isPlanningCropSeason) {
      if (!form.expectedStartDate || !form.expectedEndDate) {
        toast.error("Ngày bắt đầu và ngày kết thúc dự kiến là bắt buộc.");
        return;
      }

      const parsedStart = parseBackendDate(form.expectedStartDate);
      const parsedEnd = parseBackendDate(form.expectedEndDate);
      if (!parsedStart || !parsedEnd) {
        toast.error("Ngày dự kiến không hợp lệ.");
        return;
      }

      if (!isAfter(startOfDay(parsedEnd), startOfDay(parsedStart))) {
        toast.error("Ngày bắt đầu phải trước ngày kết thúc.");
        return;
      }

      const overlapped = findOverlappingMilestone(
        form.expectedStartDate,
        form.expectedEndDate,
        milestone.id,
      );
      if (overlapped) {
        toast.error(
          `Khoảng thời gian bị trùng với mốc #${overlapped.milestoneOrder} (${overlapped.stageName}).`,
        );
        return;
      }
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

  // Redirect approved/active/sent/completed/cancelled to overview — wizard is planning/rejected only
  if (cropSeason && !isWizardState) {
    const overviewPath = zoneId
      ? `/dashboard/manager/crop-seasons/${csId}/milestones/${msId}/overview?zoneId=${encodeURIComponent(zoneId)}`
      : `/dashboard/manager/crop-seasons/${csId}/milestones/${msId}/overview`;
    return <Navigate to={overviewPath} replace />;
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
              <Link to={cropSeasonsUrl}>Quản lý mùa vụ</Link>
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
                  "Bước bắt buộc: thiết lập chu kỳ lưu số đo và chọn chỉ báo cần theo dõi. Lưu xong các bước sau mới được mở."}
                {currentStep === 1 &&
                  "Tuỳ chọn: gán một hoặc nhiều thiết bị. Hệ thống tự ghép chỉ báo đúng theo cấu hình đã lưu ở trên."}
                {currentStep === 2 &&
                  "Các chỉ báo đã nối theo board. Nhập khoảng nhỏ nhất – lớn nhất mong muốn rồi lưu; muốn thêm bớt loại chỉ báo phải quay lại cấu hình IoT."}
                {currentStep === 3 &&
                  "Soạn nhiệm vụ và giao việc cho nông dân trong mốc."}
              </CardDescription>
              {currentStep === 0 && !isIotConfigured && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Chưa lưu phần cấu hình IoT — bước gán thiết bị sẽ bị khóa.
                </p>
              )}
              {currentStep === 3 && !hasTasks && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Ít nhất cần một nhiệm vụ trong mốc trước khi kết thúc bước này.
                </p>
              )}
              {currentStep === 3 && hasTasks && !allTasksAssigned && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Phải chỉ định đủ người làm cho tất cả nhiệm vụ trước khi hoàn thành.
                </p>
              )}
              {currentStep === 3 && canCompleteMilestoneSetup && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Đã hoàn thành các bước cấu hình cần có cho mốc.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {currentStep === 1 && !hasDevice && canEditMilestone && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkipIotStep}
                >
                  Bỏ qua bước gán thiết bị
                </Button>
              )}
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleStepClick(
                      currentStep === 3 && !hasDevice
                        ? 1
                        : currentStep === 2 && !hasDevice
                          ? 1
                          : currentStep - 1,
                    )
                  }
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Bước trước
                </Button>
              )}
              {currentStep < 3 && (
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
              {currentStep === 3 && (
                <Button
                  size="sm"
                  disabled={
                    !canEditMilestone ||
                    taskValidationQuery.isLoading ||
                    !canCompleteMilestoneSetup
                  }
                  onClick={handleFinish}
                >
                  Hoàn thành
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Step 0: IoT Config (BẮT BUỘC) */}
          {currentStep === 0 && (
            <IotConfigSection
              cropSeasonId={csId}
              milestoneId={msId}
              isPlanning={isPlanningCropSeason}
            />
          )}

          {/* Step 1: IoT Device — bulk assign */}
          {currentStep === 1 && (
            <IotBulkAssignSection milestoneId={msId} />
          )}

          {/* Step 2: Cảm biến — ngưỡng theo khu vực, lưu đồng loạt */}
          {currentStep === 2 && (
            <MilestoneSensorThresholdStepSection milestoneId={msId} />
          )}

          {/* Step 3: Tasks & Farmer Assignment (final step) */}
          {currentStep === 3 && (
            <TasksAndAssignmentStep
              milestoneId={msId}
              canEdit={canEditMilestone}
              hasTasks={hasTasks}
              lockComplete={isPlanningCropSeason}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingMilestone && canEditMilestone && (() => {
        // Re-derive prev milestone from the latest list so any reorder taking
        // effect while the dialog is open updates the disabled-date floor.
        const prevMilestone = milestones
          .filter(
            (m) =>
              m.id !== editingMilestone.id &&
              m.milestoneOrder < editingMilestone.milestoneOrder,
          )
          .slice()
          .sort((a, b) => a.milestoneOrder - b.milestoneOrder)
          .pop();
        const prevEndParsed = parseBackendDate(prevMilestone?.expectedEndDate);
        const minExpectedStartDate = prevEndParsed
          ? addDays(startOfDay(prevEndParsed), 1)
          : undefined;
        return (
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
            minExpectedStartDate={minExpectedStartDate}
          />
        );
      })()}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={confirmDelete}
        title="Xóa mốc?"
        description="Mọi đợt gán thiết bị và liên kết cảm biến của mốc này cũng sẽ được gỡ."
        confirmLabel="Xóa"
        variant="destructive"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ManagerMilestoneDetailPage;
