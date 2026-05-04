import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { translateBackendMessage } from "@/lib/error-message";
import {
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import {
  useManagerListCropSeasons,
  useCreateCropSeason,
  useUpdateCropSeason,
  useSendProductionRequest,
  useManagerListRequests,
} from "@/queries/useCropSeason";
import { useManagerTicketList } from "@/queries/useTicket";
import type { TicketIncidentResType } from "@/schemaValidatation/ticket";
import type { ZoneType } from "@/schemaValidatation/zone";
import { useManagerLatestSensorReadings } from "@/queries/useSensorReading";
import { useListAlerts } from "@/queries/useAlert";
import type { AlertResType } from "@/schemaValidatation/alert";
import SensorCard from "@/pages/SensorReadings/components/SensorCard";
import { useManagerListAssignedZones } from "@/queries/useZone";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateCropSeasonBodySchema,
  UpdateCropSeasonBodySchema,
  SendProductionRequestBodySchema,
  ProductionStatusName,
  type CreateCropSeasonBodyType,
  type UpdateCropSeasonBodyType,
  type SendProductionRequestBodyType,
  type CropSeasonType,
} from "@/types/cropSeason";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import {
  Plus,
  Eye,
  Send,
  Pencil,
  Loader2,
  Clock,
  ArrowLeft,
  AlertTriangle,
  CalendarDays,
  Cpu,
  Radio,
  History,
  Layers,
  ListTodo,
  Wheat,
  ChevronRight,
  Settings,
  SlidersHorizontal,
  XCircle,
  Sprout,
  Ticket,
  NotebookPen,
  MapPin,
  SquareArrowRight,
} from "lucide-react";
import {
  addMonths,
  format,
  isBefore,
  isValid,
  parse,
  startOfDay,
} from "date-fns";
import { vi } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import TrackingConfigPanel from "./components/TrackingConfigPanel";
import ManagerMilestoneTasksSection from "@/pages/ManagerPage/EmployeeTasks/ManagerMilestoneTasksSection";
import { useTrackingDiff, useTrackingLog, useTrackingConfigs } from "@/queries/useTracking";
import type {
  TrackedSectionType,
  TrackingLogItemType,
  TrackingEntityType,
  VarianceType,
} from "@/schemaValidatation/tracking";
import {
  getFieldLabel,
  getEntityTypeLabel,
  formatTrackingValue,
} from "@/lib/tracking-display";
import {
  useManagerListProductionMilestones,
  useManagerMilestoneAssignment,
  useManagerGetMilestoneDetail,
} from "@/queries/useProductionMilestone";
import type { ProductionMilestoneResType } from "@/schemaValidatation/productionMilestone";

// ── Helpers ───────────────────────────────────────────────────────────────

const STATUS_MAP: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  planning: { label: "Lên kế hoạch", variant: "secondary" },
  sent: { label: "Đã gửi", variant: "default" },
  approved: { label: "Đã duyệt", variant: "default" },
  rejected: { label: "Bị từ chối", variant: "destructive" },
  active: { label: "Đang hoạt động", variant: "default" },
  completed: { label: "Hoàn thành", variant: "outline" },
  cancelled: { label: "Đã hủy", variant: "destructive" },
};

const REQUEST_STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  pending: { label: "Chờ duyệt", variant: "secondary" },
  approved: { label: "Đã duyệt", variant: "default" },
  rejected: { label: "Từ chối", variant: "destructive" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? {
    label: status,
    variant: "secondary" as const,
  };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  const parsed = parseBackendDate(d);
  return parsed ? format(parsed, "dd/MM/yyyy") : d;
}

function parseBackendDate(value: string | null | undefined) {
  if (!value) return undefined;
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  if (isValid(parsed)) {
    return parsed;
  }
  const fallback = new Date(value);
  return isValid(fallback) ? fallback : undefined;
}

function formatPickerDate(value: string | null | undefined) {
  const parsed = parseBackendDate(value);
  return parsed ? format(parsed, "dd/MM/yyyy") : "";
}

function getMinPlantDate() {
  return addMonths(startOfDay(new Date()), 1);
}

function validateCropSeasonFormDates({
  plantDate,
  expectedHarvestDate,
  requirePlantDate,
  requireExpectedHarvestDate,
}: {
  plantDate?: string;
  expectedHarvestDate?: string;
  requirePlantDate: boolean;
  requireExpectedHarvestDate: boolean;
}) {
  const errors: {
    plantDate?: string;
    expectedHarvestDate?: string;
  } = {};

  const minPlantDate = getMinPlantDate();

  if (requirePlantDate && !plantDate) {
    errors.plantDate = "Vui lòng chọn ngày trồng.";
  }

  if (requireExpectedHarvestDate && !expectedHarvestDate) {
    errors.expectedHarvestDate = "Vui lòng chọn ngày thu hoạch dự kiến.";
  }

  const parsedPlantDate = parseBackendDate(plantDate);
  const parsedExpectedHarvestDate = parseBackendDate(expectedHarvestDate);

  if (plantDate && !parsedPlantDate) {
    errors.plantDate = "Ngày trồng không hợp lệ.";
  }

  if (expectedHarvestDate && !parsedExpectedHarvestDate) {
    errors.expectedHarvestDate = "Ngày thu hoạch dự kiến không hợp lệ.";
  }

  if (
    parsedPlantDate &&
    isBefore(startOfDay(parsedPlantDate), startOfDay(minPlantDate))
  ) {
    errors.plantDate = `Ngày trồng phải từ ${format(minPlantDate, "dd/MM/yyyy")} trở đi.`;
  }

  if (parsedPlantDate && parsedExpectedHarvestDate) {
    const minExpectedHarvestDate = addMonths(startOfDay(parsedPlantDate), 1);
    if (
      isBefore(
        startOfDay(parsedExpectedHarvestDate),
        startOfDay(minExpectedHarvestDate),
      )
    ) {
      errors.expectedHarvestDate = `Ngày thu hoạch dự kiến phải từ ${format(minExpectedHarvestDate, "dd/MM/yyyy")} trở đi.`;
    }
  }

  return errors;
}

type CropSeasonEditMode = "all" | "operational" | "none";
function getCropSeasonEditMode(status: string): CropSeasonEditMode {
  if (status === ProductionStatusName.Planning) return "all";
  if (
    status === ProductionStatusName.Approved ||
    status === ProductionStatusName.Active
  )
    return "operational";
  return "none";
}
const canEdit = (status: string) => getCropSeasonEditMode(status) !== "none";
const canSend = (status: string) =>
  status === ProductionStatusName.Planning ||
  status === ProductionStatusName.Rejected;

// ── Field wrapper — chuẩn hoá spacing label + input ──────────────────────

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {error && (
        <p className="text-xs text-destructive">
          {translateBackendMessage(error)}
        </p>
      )}
    </div>
  );
}

function DatePickerField({
  label,
  value,
  error,
  placeholder,
  onChange,
  minDate,
  helperText,
  disabled,
}: {
  label: string;
  value: string;
  error?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  minDate?: Date;
  helperText?: string;
  disabled?: boolean;
}) {
  const normalizedMinDate = minDate ? startOfDay(minDate) : undefined;

  return (
    <Field
      label={label}
      error={error}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between text-left font-normal"
            disabled={disabled}
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
              onChange(date ? format(date, "yyyy-MM-dd") : "")
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
      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </Field>
  );
}

// ── Create Screen — #46 ───────────────────────────────────────────────────

function CreateCropSeasonScreen({
  zoneId,
  zoneName,
  onBack,
}: {
  zoneId: string;
  zoneName?: string;
  onBack: () => void;
}) {
  const [show, setShow] = useState(false);
  const { mutateAsync, isPending } = useCreateCropSeason();
  const form = useForm<CreateCropSeasonBodyType>({
    resolver: zodResolver(CreateCropSeasonBodySchema),
    defaultValues: {
      zoneId,
      cropName: "",
      plantDate: "",
      expectedHarvestDate: "",
    },
  });
  useClearServerFieldErrors(form);
  const plantDateValue = form.watch("plantDate");
  const minPlantDate = getMinPlantDate();
  const parsedPlantDate = parseBackendDate(plantDateValue);
  const minExpectedHarvestDate = parsedPlantDate
    ? addMonths(startOfDay(parsedPlantDate), 1)
    : undefined;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const onSubmit = async (data: CreateCropSeasonBodyType) => {
    form.clearErrors(["plantDate", "expectedHarvestDate"]);
    const dateErrors = validateCropSeasonFormDates({
      plantDate: data.plantDate,
      expectedHarvestDate: data.expectedHarvestDate,
      requirePlantDate: true,
      requireExpectedHarvestDate: true,
    });

    if (dateErrors.plantDate) {
      form.setError("plantDate", {
        type: "manual",
        message: dateErrors.plantDate,
      });
    }

    if (dateErrors.expectedHarvestDate) {
      form.setError("expectedHarvestDate", {
        type: "manual",
        message: dateErrors.expectedHarvestDate,
      });
    }

    if (dateErrors.plantDate || dateErrors.expectedHarvestDate) {
      return;
    }

    try {
      await mutateAsync(data);
      handleBack();
    } catch (error) {
      if (
        isApiErrorUnprocessableEntityResponse<CreateCropSeasonBodyType>(error)
      ) {
        handleApiErrorUnprocessentity<CreateCropSeasonBodyType>(
          error.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }

      if (isApiErrorResponse(error)) {
        toast.error(error.response?.data.message ?? "Tạo mùa vụ thất bại");
        return;
      }

      toast.error("Tạo mùa vụ thất bại");
    }
  };

  return (
    <div
      className={`space-y-6 transition-all duration-300 ease-out ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          disabled={isPending}
          className="mb-3 -ml-2 gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Danh sách mùa vụ
        </Button>
        <Badge className="mb-2">Cổng quản lý</Badge>
        <h1 className="text-2xl font-bold">Tạo mùa vụ mới</h1>
        <p className="text-muted-foreground">
          Tạo kế hoạch mùa vụ mới cho khu vực hiện tại
          {zoneName ? (
            <>
              : <span className="font-medium text-foreground">{zoneName}</span>
            </>
          ) : null}
          .
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin mùa vụ</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5"
          >
            <Field
              label="Tên cây trồng *"
              error={form.formState.errors.cropName?.message}
            >
              <Input
                {...form.register("cropName")}
                placeholder="Ớt đỏ, cà chua..."
                autoComplete="off"
              />
            </Field>

            <Field label="Giống / Loại">
              <Input
                {...form.register("variety")}
                placeholder="(tuỳ chọn)"
                autoComplete="off"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="plantDate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <DatePickerField
                    label="Ngày trồng *"
                    value={field.value ?? ""}
                    error={fieldState.error?.message}
                    placeholder="Chọn ngày trồng"
                    onChange={field.onChange}
                    minDate={minPlantDate}
                    helperText={`Từ ngày ${format(minPlantDate, "dd/MM/yyyy")}`}
                  />
                )}
              />
              <Controller
                name="expectedHarvestDate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <DatePickerField
                    label="Ngày thu hoạch dự kiến *"
                    value={field.value ?? ""}
                    error={fieldState.error?.message}
                    placeholder="Chọn ngày thu hoạch"
                    onChange={field.onChange}
                    minDate={minExpectedHarvestDate}
                    helperText={
                      minExpectedHarvestDate
                        ? `Từ ngày ${format(minExpectedHarvestDate, "dd/MM/yyyy")}`
                        : "Chọn ngày trồng trước"
                    }
                  />
                )}
              />
            </div>

            <Field label="Số lượng cây">
              <Input
                type="number"
                {...form.register("plantCount", { valueAsNumber: true })}
                autoComplete="off"
              />
            </Field>

            <Field label="Ghi chú">
              <Textarea
                {...form.register("notes")}
                rows={2}
                className="resize-none"
              />
            </Field>

            <p className="text-xs text-muted-foreground">
              * Ngày trồng phải sau hôm nay ít nhất 1 tháng. Ngày thu hoạch phải
              sau ngày trồng ít nhất 1 tháng.
            </p>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isPending}
              >
                Huỷ
              </Button>
              <Button
                type="submit"
                disabled={isPending}
              >
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Tạo mùa vụ
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Update Dialog — #49 ───────────────────────────────────────────────────

function UpdateCropSeasonDialog({ season }: { season: CropSeasonType }) {
  const [open, setOpen] = useState(false);
  const { mutateAsync, isPending } = useUpdateCropSeason(season.id);
  const form = useForm<UpdateCropSeasonBodyType>({
    resolver: zodResolver(UpdateCropSeasonBodySchema),
    defaultValues: {
      cropName: season.cropName,
      variety: season.variety ?? "",
      plantDate: season.plantDate ? season.plantDate.slice(0, 10) : undefined,
      expectedHarvestDate: season.expectedHarvestDate
        ? season.expectedHarvestDate.slice(0, 10)
        : undefined,
      actualHarvestDate: season.actualHarvestDate
        ? season.actualHarvestDate.slice(0, 10)
        : null,
      plantCount: season.plantCount ?? undefined,
      notes: season.notes ?? "",
    },
  });
  useClearServerFieldErrors(form);
  const plantDateValue = form.watch("plantDate");
  const minPlantDate = getMinPlantDate();
  const parsedPlantDate = parseBackendDate(plantDateValue);
  const minExpectedHarvestDate = parsedPlantDate
    ? addMonths(startOfDay(parsedPlantDate), 1)
    : undefined;

  const editMode = getCropSeasonEditMode(season.status);
  const planOnlyDisabled = editMode !== "all";

  if (!canEdit(season.status)) return null;

  const onSubmit = async (data: UpdateCropSeasonBodyType) => {
    form.clearErrors(["plantDate", "expectedHarvestDate"]);

    // After approval, the BE rejects any plan-only field in the body
    // (LockedPlanFieldException). Strip them — RHF still emits the disabled
    // defaults — and only submit the operational fields.
    const payload: UpdateCropSeasonBodyType = planOnlyDisabled
      ? {
          ...(data.actualHarvestDate
            ? { actualHarvestDate: data.actualHarvestDate }
            : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        }
      : data;

    if (!planOnlyDisabled) {
      const dateErrors = validateCropSeasonFormDates({
        plantDate: data.plantDate,
        expectedHarvestDate: data.expectedHarvestDate,
        requirePlantDate: false,
        requireExpectedHarvestDate: false,
      });

      if (dateErrors.plantDate) {
        form.setError("plantDate", {
          type: "manual",
          message: dateErrors.plantDate,
        });
      }

      if (dateErrors.expectedHarvestDate) {
        form.setError("expectedHarvestDate", {
          type: "manual",
          message: dateErrors.expectedHarvestDate,
        });
      }

      if (dateErrors.plantDate || dateErrors.expectedHarvestDate) {
        return;
      }
    }

    try {
      await mutateAsync(payload);
      setOpen(false);
    } catch (error) {
      if (
        isApiErrorUnprocessableEntityResponse<UpdateCropSeasonBodyType>(error)
      ) {
        handleApiErrorUnprocessentity<UpdateCropSeasonBodyType>(
          error.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }

      if (isApiErrorResponse(error)) {
        toast.error(error.response?.data.message ?? "Cập nhật thất bại");
        return;
      }

      toast.error("Cập nhật thất bại");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
        >
          <Pencil className="h-3 w-3 mr-1" />
          Sửa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cập nhật mùa vụ</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 pt-2"
        >
          {planOnlyDisabled && (
            <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
              Các trường kế hoạch đã khóa sau khi phê duyệt. Chỉ có thể cập
              nhật ghi chú và ngày thu hoạch thực tế.
            </p>
          )}
          <Field
            label="Tên cây trồng"
            error={form.formState.errors.cropName?.message}
          >
            <Input
              {...form.register("cropName")}
              autoComplete="off"
              disabled={planOnlyDisabled}
            />
          </Field>
          <Field label="Giống / Loại">
            <Input
              {...form.register("variety")}
              autoComplete="off"
              disabled={planOnlyDisabled}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Controller
              name="plantDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <DatePickerField
                  label="Ngày trồng"
                  value={field.value ?? ""}
                  error={fieldState.error?.message}
                  placeholder="Chọn ngày trồng"
                  onChange={field.onChange}
                  minDate={minPlantDate}
                  helperText={`Từ ngày ${format(minPlantDate, "dd/MM/yyyy")}`}
                  disabled={planOnlyDisabled}
                />
              )}
            />
            <Controller
              name="expectedHarvestDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <DatePickerField
                  label="Ngày thu hoạch dự kiến"
                  value={field.value ?? ""}
                  error={fieldState.error?.message}
                  placeholder="Chọn ngày thu hoạch"
                  onChange={field.onChange}
                  minDate={minExpectedHarvestDate}
                  helperText={
                    minExpectedHarvestDate
                      ? `Từ ngày ${format(minExpectedHarvestDate, "dd/MM/yyyy")}`
                      : "Chọn ngày trồng trước"
                  }
                  disabled={planOnlyDisabled}
                />
              )}
            />
          </div>
          {planOnlyDisabled && (
            <Controller
              name="actualHarvestDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <DatePickerField
                  label="Ngày thu hoạch thực tế"
                  value={field.value ?? ""}
                  error={fieldState.error?.message}
                  placeholder="Chọn ngày thu hoạch thực tế"
                  onChange={(v) => field.onChange(v || null)}
                />
              )}
            />
          )}
          <Field label="Số lượng cây">
            <Input
              type="number"
              {...form.register("plantCount", { valueAsNumber: true })}
              autoComplete="off"
              disabled={planOnlyDisabled}
            />
          </Field>
          <Field label="Ghi chú">
            <Textarea
              {...form.register("notes")}
              rows={2}
              className="resize-none"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Huỷ
            </Button>
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Send Request Dialog — #50 ─────────────────────────────────────────────

function SendRequestDialog({ season }: { season: CropSeasonType }) {
  const [open, setOpen] = useState(false);
  const { mutateAsync, isPending } = useSendProductionRequest(season.id);
  const form = useForm<SendProductionRequestBodyType>({
    resolver: zodResolver(SendProductionRequestBodySchema),
    defaultValues: { description: "" },
  });

  if (season.status === ProductionStatusName.Sent) {
    return (
      <Button
        size="sm"
        variant="secondary"
        disabled
      >
        <Clock className="h-3 w-3 mr-1" />
        Đang chờ duyệt
      </Button>
    );
  }

  if (!canSend(season.status)) return null;

  const onSubmit = async (data: SendProductionRequestBodyType) => {
    await mutateAsync(data);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant={
            season.status === ProductionStatusName.Rejected
              ? "destructive"
              : "default"
          }
        >
          <Send className="h-3 w-3 mr-1" />
          {season.status === ProductionStatusName.Rejected
            ? "Gửi lại"
            : "Gửi duyệt"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {season.status === ProductionStatusName.Rejected
              ? "Gửi lại yêu cầu"
              : "Gửi yêu cầu phê duyệt"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {season.status === ProductionStatusName.Rejected && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">
              Yêu cầu trước đã bị từ chối. Bạn có thể chỉnh sửa và gửi lại.
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Gửi mùa vụ <strong>{season.cropName}</strong> lên chủ vườn để phê
            duyệt. Sau khi gửi, mùa vụ <strong>không thể chỉnh sửa thêm</strong>
            .
          </p>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <Field label="Ghi chú cho chủ vườn (tuỳ chọn)">
              <Textarea
                {...form.register("description")}
                rows={3}
                placeholder="Mô tả thêm về kế hoạch..."
                className="resize-none"
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Huỷ
              </Button>
              <Button
                type="submit"
                disabled={isPending}
              >
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Xác nhận gửi
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Detail + Requests — #48 #51 #53 ──────────────────────────────────────

function CropSeasonDetailContent({ season }: { season: CropSeasonType }) {
  const requestsQuery = useManagerListRequests(season.id, {
    page: 1,
    limit: 20,
  });
  const requests = requestsQuery.data?.data.data ?? [];
  const [showTrackingConfig, setShowTrackingConfig] = useState(false);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 text-sm">
        {(
          [
            [
              "Trạng thái",
              <StatusBadge
                key="s"
                status={season.status}
              />,
            ],
            ["Ngày trồng", formatDate(season.plantDate)],
            ["Thu hoạch dự kiến", formatDate(season.expectedHarvestDate)],
            ["Thu hoạch thực tế", formatDate(season.actualHarvestDate)],
            ["Số cây", season.plantCount ?? "—"],
          ] as [string, React.ReactNode][]
        ).map(([label, value]) => (
          <div
            key={label}
            className="bg-muted/40 rounded-md p-3"
          >
            <p className="text-muted-foreground text-xs mb-1">{label}</p>
            <div className="font-medium">{value}</div>
          </div>
        ))}
      </div>

      {season.notes && (
        <div className="bg-muted/40 rounded-md p-3 text-sm">
          <p className="text-muted-foreground text-xs mb-1">Ghi chú</p>
          <p>{season.notes}</p>
        </div>
      )}

      <div>
        <h4 className="font-semibold text-sm mb-3">
          Lịch sử yêu cầu phê duyệt
          {requests.length > 0 && (
            <span className="ml-2 text-muted-foreground font-normal">
              ({requests.length})
            </span>
          )}
        </h4>
        {requestsQuery.isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton
                key={i}
                className="h-12 w-full"
              />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6 bg-muted/20 rounded-md">
            Chưa có yêu cầu nào được gửi
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày gửi</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày phản hồi</TableHead>
                  <TableHead>Ghi chú chủ vườn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => {
                  const rs = REQUEST_STATUS_MAP[r.status] ?? {
                    label: r.status,
                    variant: "secondary" as const,
                  };
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm">
                        {formatDate(r.sentAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={rs.variant}>{rs.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(r.repliedAt)}
                      </TableCell>
                      <TableCell className="text-sm max-w-50 truncate">
                        {r.description ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-sm">Cấu hình theo dõi</h4>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowTrackingConfig((v) => !v)}
          >
            {showTrackingConfig ? "Ẩn" : "Hiển thị"}
          </Button>
        </div>
        {showTrackingConfig && (
          <TrackingConfigPanel
            cropSeasonId={season.id}
            readOnly={season.status !== "planning"}
          />
        )}
      </div>
    </div>
  );
}

function CropSeasonDetailSheet({ season }: { season: CropSeasonType }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
    >
      <SheetTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
        >
          <Eye className="h-3 w-3 mr-1" />
          Chi tiết
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {season.cropName}
            {season.variety ? ` — ${season.variety}` : ""}
          </SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-4">
          {open && <CropSeasonDetailContent season={season} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ══════════════════════════════════════════════════════════════
// Milestone status meta
// ══════════════════════════════════════════════════════════════

const MILESTONE_STATUS_META: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  pending: { label: "Chờ xử lý", variant: "secondary" },
  in_progress: { label: "Đang thực hiện", variant: "default" },
  completed: { label: "Hoàn thành", variant: "outline" },
};

// ══════════════════════════════════════════════════════════════
// Summary Card — always shown at top of content
// ══════════════════════════════════════════════════════════════

function CropSeasonSummaryCard({ season, zoneId }: { season: CropSeasonType; zoneId: string }) {
  const navigate = useNavigate();
  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-xl leading-tight">{season.cropName}</CardTitle>
              <StatusBadge status={season.status} />
            </div>
            {season.variety && (
              <p className="text-sm text-muted-foreground mt-0.5">Giống: {season.variety}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <UpdateCropSeasonDialog season={season} />
            <SendRequestDialog season={season} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Ngày trồng</p>
            <p className="font-medium mt-0.5">{formatDate(season.plantDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Thu hoạch dự kiến</p>
            <p className="font-medium mt-0.5">{formatDate(season.expectedHarvestDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Thu hoạch thực tế</p>
            <p className="font-medium mt-0.5">{formatDate(season.actualHarvestDate)}</p>
          </div>
          {season.plantCount != null && (
            <div>
              <p className="text-xs text-muted-foreground">Số cây</p>
              <p className="font-medium mt-0.5">{season.plantCount}</p>
            </div>
          )}
        </div>
        {season.notes && (
          <div className="mt-3 rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {season.notes}
          </div>
        )}
        {(season.status === ProductionStatusName.Planning || season.status === ProductionStatusName.Rejected) && (
          <div className="mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const params = new URLSearchParams();
                if (zoneId) params.set("zoneId", zoneId);
                navigate(`/dashboard/manager/crop-seasons/${season.id}/milestones${params.toString() ? `?${params}` : ""}`);
              }}
            >
              <Layers className="h-3 w-3 mr-1.5" />
              Quản lý mốc công việc
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════
// Requests tab — shared between planning and operational views
// ══════════════════════════════════════════════════════════════

function RequestsHistoryTab({ cropSeasonId, readOnly }: { cropSeasonId: string; readOnly: boolean }) {
  const requestsQuery = useManagerListRequests(cropSeasonId, { page: 1, limit: 20 });
  const requests = requestsQuery.data?.data.data ?? [];
  const [showTracking, setShowTracking] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          Lịch sử yêu cầu phê duyệt
          {requests.length > 0 && (
            <span className="text-muted-foreground font-normal">({requests.length})</span>
          )}
        </h3>
        {requestsQuery.isLoading ? (
          <div className="space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center bg-muted/20 rounded-md">
            Chưa có yêu cầu nào được gửi
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày gửi</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày phản hồi</TableHead>
                  <TableHead>Ghi chú chủ vườn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => {
                  const rs = REQUEST_STATUS_MAP[r.status] ?? { label: r.status, variant: "secondary" as const };
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm">{formatDate(r.sentAt)}</TableCell>
                      <TableCell><Badge variant={rs.variant}>{rs.label}</Badge></TableCell>
                      <TableCell className="text-sm">{formatDate(r.repliedAt)}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{r.description ?? "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {!readOnly && (
        <div>
          <Separator className="mb-4" />
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Cấu hình theo dõi</h3>
            <Button size="sm" variant="ghost" onClick={() => setShowTracking((v) => !v)}>
              {showTracking ? "Ẩn" : "Hiển thị"}
            </Button>
          </div>
          {showTracking && <TrackingConfigPanel cropSeasonId={cropSeasonId} readOnly={false} />}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Planning view — status: planning / rejected
// ══════════════════════════════════════════════════════════════

// ── Milestone detail pane (inline, right side of split view) ──────────

function MilestoneDetailPane({
  milestone: listMilestone,
  cropSeason,
  isWizardState,
  onGoConfig,
}: {
  milestone: ProductionMilestoneResType;
  cropSeason: CropSeasonType;
  isWizardState: boolean;
  onGoConfig: () => void;
}) {
  const detailQuery = useManagerGetMilestoneDetail(listMilestone.id, cropSeason.id, true);
  const milestone = detailQuery.data?.data ?? listMilestone;

  const assignmentQuery = useManagerMilestoneAssignment(milestone.id, true);
  const assignment = assignmentQuery.data?.data?.data ?? null;
  const assignmentId = assignment?.assignmentId ?? "";
  const readingsQuery = useManagerLatestSensorReadings(assignmentId, !!assignmentId);
  const readings = readingsQuery.data?.data ?? [];
  const meta = MILESTONE_STATUS_META[milestone.status] ?? { label: milestone.status, variant: "secondary" as const };

  return (
    <div className="space-y-4 overflow-y-auto">
      {/* Milestone header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">#{milestone.milestoneOrder}</span>
            <h3 className="font-semibold text-base">{milestone.stageName}</h3>
            <Badge variant={meta.variant} className="text-xs">{meta.label}</Badge>
            {detailQuery.isLoading && (
              <span className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            )}
          </div>
          {(milestone.expectedStartDate || milestone.expectedEndDate) && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {formatDate(milestone.expectedStartDate)} → {formatDate(milestone.expectedEndDate)}
            </p>
          )}
          {(milestone.actualStartDate || milestone.actualEndDate) && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <CalendarDays className="h-3 w-3 opacity-50" />
              Thực tế: {formatDate(milestone.actualStartDate)} → {formatDate(milestone.actualEndDate)}
            </p>
          )}
        </div>
        {isWizardState && (
          <Button size="sm" variant="outline" onClick={onGoConfig}>
            <Settings className="h-3 w-3 mr-1.5" />
            Cấu hình
          </Button>
        )}
      </div>

      <Separator />

      {/* IoT device */}
      {assignmentQuery.isLoading ? (
        <Skeleton className="h-12 w-full" />
      ) : !assignment ? (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 px-3 py-2.5 text-sm">
          <XCircle className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="text-amber-700 dark:text-amber-400">Chưa gán thiết bị IoT</span>
          {isWizardState && (
            <Button size="sm" variant="outline" onClick={onGoConfig} className="ml-auto h-7 text-xs">
              Cấu hình IoT
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Device row */}
          <div className="flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm">
            <Cpu className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="font-medium truncate">{assignment.device.deviceName}</p>
              <p className="text-xs text-muted-foreground">{assignment.sensors.length} cảm biến liên kết</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">Hoạt động</span>
            </div>
          </div>

          {/* Sensor readings */}
          {readingsQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36 w-full" />)}
            </div>
          ) : readings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Chưa có dữ liệu cảm biến
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {readings.map((r) => (
                <SensorCard key={r.sensorId} reading={r} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Milestone split-view tab (both planning and operational) ──────────

function MilestonesWithDetailTab({
  cropSeason,
  zoneId,
}: {
  cropSeason: CropSeasonType;
  zoneId: string;
}) {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const listQuery = useManagerListProductionMilestones(cropSeason.id, { page: 1, limit: 50 });
  const milestones = (listQuery.data?.data.data ?? []).slice().sort((a, b) => a.milestoneOrder - b.milestoneOrder);
  const selected = milestones.find((m) => m.id === selectedId) ?? milestones[0] ?? null;

  const isWizardState =
    cropSeason.status === ProductionStatusName.Planning ||
    cropSeason.status === ProductionStatusName.Rejected;

  const msUrl = (m: ProductionMilestoneResType) => {
    const p = new URLSearchParams();
    if (zoneId) p.set("zoneId", zoneId);
    const q = p.toString() ? `?${p}` : "";
    return isWizardState
      ? `/dashboard/manager/crop-seasons/${cropSeason.id}/milestones/${m.id}${q}`
      : `/dashboard/manager/crop-seasons/${cropSeason.id}/milestones/${m.id}/overview${q}`;
  };

  const manageMilestonesUrl = () => {
    const p = new URLSearchParams();
    if (zoneId) p.set("zoneId", zoneId);
    return `/dashboard/manager/crop-seasons/${cropSeason.id}/milestones${p.toString() ? `?${p}` : ""}`;
  };

  if (listQuery.isLoading) {
    return (
      <div className="flex gap-4">
        <Skeleton className="h-64 w-48 shrink-0" />
        <Skeleton className="h-64 flex-1" />
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border rounded-md bg-muted/20">
        <Layers className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium">Chưa có mốc công việc</p>
        <p className="text-xs text-muted-foreground mt-1 mb-3">Tạo mốc để lên kế hoạch và cấu hình thiết bị</p>
        {isWizardState && (
          <Button size="sm" onClick={() => navigate(manageMilestonesUrl())}>
            <Plus className="h-3 w-3 mr-1" />
            Thêm mốc
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-0 min-h-[420px]">
      {/* Left: milestone list */}
      <div className="w-52 shrink-0 border-r">
        <div className="flex items-center justify-between px-3 py-2.5 border-b">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {milestones.length} mốc
          </span>
          {isWizardState && (
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => navigate(manageMilestonesUrl())}>
              <Settings className="h-3 w-3" />
            </Button>
          )}
        </div>
        <nav className="p-1.5 space-y-0.5">
          {milestones.map((m) => {
            const meta = MILESTONE_STATUS_META[m.status] ?? { label: m.status, variant: "secondary" as const };
            const isActive = m.id === (selected?.id ?? "");
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedId(m.id)}
                className={`w-full text-left rounded-md px-3 py-2.5 transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent/60"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[10px] font-mono shrink-0 ${isActive ? "opacity-70" : "text-muted-foreground"}`}>
                    #{m.milestoneOrder}
                  </span>
                  <span className="text-sm font-medium truncate">{m.stageName}</span>
                </div>
                <Badge
                  variant={isActive ? "outline" : meta.variant}
                  className={`text-[10px] ${isActive ? "border-primary-foreground/40 text-primary-foreground/80" : ""}`}
                >
                  {meta.label}
                </Badge>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right: detail pane */}
      <div className="flex-1 min-w-0 pl-5 pt-3">
        {selected ? (
          <MilestoneDetailPane
            milestone={selected}
            cropSeason={cropSeason}
            isWizardState={isWizardState}
            onGoConfig={() => navigate(msUrl(selected))}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Chọn mốc để xem chi tiết
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Incident tab constants
// ══════════════════════════════════════════════════════════════

const SEVERITY_LABEL: Record<string, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  critical: "Nghiêm trọng",
};

const SEVERITY_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  low: "secondary",
  medium: "default",
  high: "destructive",
  critical: "destructive",
};

const TICKET_STATUS_LABEL: Record<string, string> = {
  open: "Mở",
  assigned: "Đã phân công",
  in_progress: "Đang xử lý",
  resolved: "Đã giải quyết",
  closed: "Đã đóng",
  cancelled: "Đã hủy",
};

const TICKET_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "default",
  assigned: "secondary",
  in_progress: "default",
  resolved: "secondary",
  closed: "outline",
  cancelled: "outline",
};

// ── Per-milestone sensor section (used inside SensorOverviewTab) ───────

function MilestoneSensorSection({
  milestone,
}: {
  milestone: ProductionMilestoneResType;
}) {
  const assignmentQuery = useManagerMilestoneAssignment(milestone.id, true);
  const assignment = assignmentQuery.data?.data?.data ?? null;
  const assignmentId = assignment?.assignmentId ?? "";
  const readingsQuery = useManagerLatestSensorReadings(assignmentId, !!assignmentId);
  const readings = readingsQuery.data?.data ?? [];
  const meta = MILESTONE_STATUS_META[milestone.status] ?? { label: milestone.status, variant: "secondary" as const };

  if (assignmentQuery.isLoading) {
    return <Skeleton className="h-48 w-full rounded-lg" />;
  }
  if (!assignment) return null;

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-muted-foreground shrink-0">#{milestone.milestoneOrder}</span>
          <p className="font-semibold truncate">{milestone.stageName}</p>
          <Badge variant={meta.variant} className="text-xs shrink-0">{meta.label}</Badge>
        </div>
        <Separator className="flex-1" />
        <div className="flex items-center gap-1.5 shrink-0">
          <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{assignment.device.deviceName}</span>
        </div>
      </div>

      {readingsQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : readings.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Chưa có dữ liệu cảm biến</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {readings.map((r) => (
            <SensorCard key={r.sensorId} reading={r} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Alert panel ────────────────────────────────────────────────────────

const ALERT_SEVERITY_COLORS: Record<string, string> = {
  low: "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-300",
  medium: "border-orange-300 bg-orange-50 dark:bg-orange-950/20 text-orange-800 dark:text-orange-300",
  high: "border-red-300 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300",
  critical: "border-red-500 bg-red-100 dark:bg-red-950/30 text-red-900 dark:text-red-200",
};

const ALERT_SEVERITY_LABEL: Record<string, string> = {
  low: "Thấp", medium: "Trung bình", high: "Cao", critical: "Nghiêm trọng",
};

function AlertsTable({
  alerts,
  isLoading,
}: {
  alerts: AlertResType[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center border rounded-md bg-muted/20">
        <AlertTriangle className="h-8 w-8 text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground">Không có cảnh báo nào</p>
      </div>
    );
  }
  return (
    <div className="rounded-md border overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="text-left px-3 py-2 font-medium text-muted-foreground w-20">Mức độ</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Cảnh báo</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground w-24">Giá trị</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground w-24">Ngưỡng</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {alerts.map((a) => (
            <tr
              key={a.id}
              className={`${ALERT_SEVERITY_COLORS[a.severity] ?? ""} transition-colors`}
            >
              <td className="px-3 py-2.5">
                <Badge
                  variant="outline"
                  className={`text-[10px] ${ALERT_SEVERITY_COLORS[a.severity] ?? ""}`}
                >
                  {ALERT_SEVERITY_LABEL[a.severity]}
                </Badge>
              </td>
              <td className="px-3 py-2.5">
                <p className="font-medium leading-snug">{a.title}</p>
                <p className="opacity-70 mt-0.5 line-clamp-2">{a.message}</p>
              </td>
              <td className="px-3 py-2.5 font-mono">{a.actualValue ?? "—"}</td>
              <td className="px-3 py-2.5 font-mono">{a.thresholdValue ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SensorOverviewTab({ cropSeason }: { cropSeason: CropSeasonType }) {
  const listQuery = useManagerListProductionMilestones(cropSeason.id, { page: 1, limit: 50 });
  const milestones = (listQuery.data?.data.data ?? []).slice().sort((a, b) => a.milestoneOrder - b.milestoneOrder);

  const alertsQuery = useListAlerts({ page: 1, limit: 50 });
  const alerts = (alertsQuery.data?.data.data ?? []).filter((a) => !a.isResolved);

  if (listQuery.isLoading) {
    return (
      <div className="flex gap-4">
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36" />)}
          </div>
        </div>
        <div className="w-72 space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-5 min-h-[360px]">
      {/* Left: sensor readings per milestone */}
      <div className="flex-1 min-w-0 space-y-8">
        {milestones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border rounded-md bg-muted/20">
            <Radio className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Chưa có mốc công việc nào</p>
          </div>
        ) : (
          milestones.map((m) => (
            <MilestoneSensorSection key={m.id} milestone={m} />
          ))
        )}
      </div>

      {/* Right: alerts table */}
      <div className="w-72 xl:w-80 shrink-0">
        <div className="sticky top-4 space-y-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <h4 className="text-sm font-semibold">
              Cảnh báo{" "}
              {alerts.length > 0 && (
                <span className="text-destructive">({alerts.length})</span>
              )}
            </h4>
          </div>
          <AlertsTable alerts={alerts} isLoading={alertsQuery.isLoading} />
        </div>
      </div>
    </div>
  );
}


function IncidentTab({ cropSeason }: { cropSeason: CropSeasonType }) {
  const navigate = useNavigate();
  const zoneId = cropSeason.zoneId;
  const ticketQuery = useManagerTicketList(zoneId, { page: 1, limit: 20 });
  const tickets = ticketQuery.data?.data.data ?? [];

  const toCreate = () =>
    navigate(`/dashboard/manager/tickets`);

  const toDetail = (ticketId: string) =>
    navigate(`/dashboard/manager/tickets?ticketId=${ticketId}`);

  if (ticketQuery.isLoading) {
    return <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {tickets.length > 0 ? `${tickets.length} sự cố gần đây` : "Không có sự cố nào"}
        </p>
        <Button size="sm" onClick={toCreate}>
          <Plus className="h-3 w-3 mr-1.5" />
          Báo cáo sự cố
        </Button>
      </div>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md bg-muted/20">
          <Ticket className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium">Không có sự cố nào</p>
          <p className="text-xs text-muted-foreground mt-1">Sự cố trong khu vực này sẽ hiển thị tại đây</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Mã</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead className="w-28">Mức độ</TableHead>
                <TableHead className="w-32">Trạng thái</TableHead>
                <TableHead className="w-36">Người báo</TableHead>
                <TableHead className="w-32">Ngày tạo</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket: TicketIncidentResType) => (
                <TableRow
                  key={ticket.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toDetail(ticket.id)}
                >
                  <TableCell className="font-mono text-xs">{ticket.ticketNumber}</TableCell>
                  <TableCell className="font-medium max-w-52 truncate">{ticket.title}</TableCell>
                  <TableCell>
                    <Badge variant={SEVERITY_VARIANT[ticket.severity]} className="text-xs">
                      {SEVERITY_LABEL[ticket.severity]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={TICKET_STATUS_VARIANT[ticket.status]} className="text-xs">
                      {TICKET_STATUS_LABEL[ticket.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{ticket.creator.fullName}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(ticket.createdAt), "dd/MM/yy HH:mm", { locale: vi })}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); toDetail(ticket.id); }}>
                      Xem
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function DailyTasksTab({ cropSeason }: { cropSeason: CropSeasonType }) {
  const listQuery = useManagerListProductionMilestones(cropSeason.id, { page: 1, limit: 50 });
  const milestones = listQuery.data?.data.data ?? [];
  const inProgressMilestone = milestones.find((m) => m.status === "in_progress");
  const isActive = cropSeason.status === ProductionStatusName.Active;

  if (listQuery.isLoading) return <Skeleton className="h-48 w-full" />;

  if (!inProgressMilestone) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md bg-muted/20">
        <ListTodo className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium">Không có mốc đang thực hiện</p>
        <p className="text-xs text-muted-foreground mt-1">Nhật ký task sẽ hiển thị khi có mốc ở trạng thái đang thực hiện</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Mốc đang thực hiện:</span>
        <span className="font-medium">#{inProgressMilestone.milestoneOrder} {inProgressMilestone.stageName}</span>
        <Badge variant="default" className="text-xs">Đang thực hiện</Badge>
      </div>
      <Separator />
      <ManagerMilestoneTasksSection milestoneId={inProgressMilestone.id} canEdit={isActive} />
    </div>
  );
}

// ── Tracking helpers & sub-components ─────────────────────────────────────

function formatVariance(variance: VarianceType | null): string {
  if (!variance || variance.type === "none") return "Không đổi";
  if (variance.type === "days") {
    const days = Math.abs(variance.value as number);
    if (variance.direction === "early") return `${days} ngày sớm`;
    if (variance.direction === "late") return `${days} ngày trễ`;
    if (variance.direction === "on-time") return "Đúng hạn";
    return `${days} ngày`;
  }
  if (variance.type === "percent") return `${variance.value}%`;
  if (variance.type === "absolute") return String(variance.value ?? "—");
  if (variance.type === "label" || variance.type === "changed") {
    return variance.direction ?? String(variance.value ?? "—");
  }
  return "—";
}

function TrackingDiffSection({
  section,
  milestones,
}: {
  section: TrackedSectionType;
  milestones: Array<{ id: string; stageName?: string | null; milestoneOrder?: number }>;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {getEntityTypeLabel(section.entityType)}
      </p>
      {section.entities.map((entity) => {
        const milestone = milestones.find((m) => m.id === entity.entityId);
        const entityLabel = milestone
          ? `#${milestone.milestoneOrder} ${milestone.stageName}`
          : entity.entityId.slice(0, 8) + "…";
        return (
          <div key={entity.entityId} className="space-y-1">
            {section.entityType !== "crop_season" && (
              <p className="text-xs text-muted-foreground pl-1">{entityLabel}</p>
            )}
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Trường</TableHead>
                    <TableHead>Kế hoạch</TableHead>
                    <TableHead>Thực tế</TableHead>
                    <TableHead className="w-32">Chênh lệch</TableHead>
                    <TableHead className="w-20 text-center">Thay đổi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entity.fields.map((field) => (
                    <TableRow key={field.fieldName}>
                      <TableCell className="font-medium text-sm">
                        {getFieldLabel(field.fieldName)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTrackingValue(field.planValue, field.dataType)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatTrackingValue(field.actualValue, field.dataType)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatVariance(field.variance)}
                      </TableCell>
                      <TableCell className="text-sm text-center text-muted-foreground">
                        {field.changeCount}x
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrackingLogList({
  logs,
  isLoading,
}: {
  logs: TrackingLogItemType[];
  isLoading: boolean;
}) {
  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md bg-muted/20">
        <NotebookPen className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium">Chưa có thay đổi nào được ghi lại</p>
        <p className="text-xs text-muted-foreground mt-1">
          Nhật ký sẽ xuất hiện sau khi có thay đổi trên các trường đang theo dõi
        </p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-32">Thời gian</TableHead>
            <TableHead className="w-36">Đối tượng</TableHead>
            <TableHead>Trường</TableHead>
            <TableHead>Giá trị cũ</TableHead>
            <TableHead>Giá trị mới</TableHead>
            <TableHead className="w-36">Người thay đổi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-xs text-muted-foreground">
                {format(new Date(log.changedAt), "dd/MM/yy HH:mm", { locale: vi })}
              </TableCell>
              <TableCell className="text-xs">
                {getEntityTypeLabel(log.entityType)}
              </TableCell>
              <TableCell className="text-sm font-medium">
                {getFieldLabel(log.fieldName)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatTrackingValue(log.oldValueJson, log.dataType)}
              </TableCell>
              <TableCell className="text-sm">
                {formatTrackingValue(log.newValueJson, log.dataType)}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {log.changedBy ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ── All entity type options ───────────────────────────────────────────────
const ENTITY_TYPE_OPTIONS: Array<{ value: TrackingEntityType | "all"; label: string }> = [
  { value: "all", label: "Tất cả đối tượng" },
  { value: "crop_season", label: "Mùa vụ" },
  { value: "production_milestone", label: "Giai đoạn sản xuất" },
  { value: "employee_task", label: "Công việc" },
  { value: "harvest_record", label: "Bản ghi thu hoạch" },
  { value: "iot_device_assignment", label: "Thiết bị IoT" },
];

function TrackingOperationalView({ cropSeason }: { cropSeason: CropSeasonType }) {
  const [trackingView, setTrackingView] = useState<"diff" | "log">("diff");

  // Log filter state
  const [filterEntity, setFilterEntity] = useState<string>("all");
  const [filterField, setFilterField] = useState<string>("all");
  const [filterFrom, setFilterFrom] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");

  // Configured fields — used to build the field dropdown
  const configsQuery = useTrackingConfigs(cropSeason.id);
  const allConfigs = (configsQuery.data?.data?.data ?? []).filter((c) => c.isActive);

  // Field options scoped to selected entity type
  const fieldOptions = allConfigs
    .filter((c) => filterEntity === "all" || c.entityType === filterEntity)
    .map((c) => ({ value: `${c.entityType}:${c.fieldName}`, label: getFieldLabel(c.fieldName), entityType: c.entityType, fieldName: c.fieldName }))
    .filter((opt, idx, arr) => arr.findIndex((o) => o.value === opt.value) === idx);

  // Reset field filter when entity changes
  const handleEntityChange = (val: string) => {
    setFilterEntity(val);
    setFilterField("all");
  };

  // Build query for the log endpoint
  const logQuery = useTrackingLog(
    cropSeason.id,
    {
      page: 1,
      limit: 100,
      ...(filterEntity !== "all" && { entityType: filterEntity as TrackingEntityType }),
      ...(filterField !== "all" && { fieldName: filterField.split(":")[1] }),
      ...(filterFrom && { from: filterFrom }),
      ...(filterTo && { to: filterTo }),
    },
    trackingView === "log",
  );

  const diffQuery = useTrackingDiff(cropSeason.id);
  const listQuery = useManagerListProductionMilestones(cropSeason.id, { page: 1, limit: 100 });
  const milestones = listQuery.data?.data.data ?? [];

  const diff = diffQuery.data?.data;
  const logs = logQuery.data?.data.data ?? [];

  const hasActiveFilter = filterEntity !== "all" || filterField !== "all" || !!filterFrom || !!filterTo;

  const clearFilters = () => {
    setFilterEntity("all");
    setFilterField("all");
    setFilterFrom("");
    setFilterTo("");
  };

  const totalTrackedFields = diff?.tracked.reduce(
    (sum, s) => sum + s.entities.reduce((es, e) => es + e.fields.length, 0),
    0,
  ) ?? 0;

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={trackingView === "diff" ? "default" : "outline"}
          size="sm"
          onClick={() => setTrackingView("diff")}
        >
          So sánh kế hoạch
        </Button>
        <Button
          variant={trackingView === "log" ? "default" : "outline"}
          size="sm"
          onClick={() => setTrackingView("log")}
        >
          Nhật ký thay đổi
        </Button>
        <div className="flex-1" />
        {trackingView === "diff" && !diffQuery.isLoading && (
          <p className="text-xs text-muted-foreground">
            {totalTrackedFields} trường đang theo dõi
          </p>
        )}
      </div>

      {/* Log filters — only shown on log view */}
      {trackingView === "log" && (
        <div className="flex flex-wrap items-end gap-2 rounded-md border bg-muted/30 p-3">
          {/* Entity type */}
          <div className="flex flex-col gap-1 min-w-[160px]">
            <span className="text-xs text-muted-foreground font-medium">Đối tượng</span>
            <Select value={filterEntity} onValueChange={handleEntityChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Field name */}
          <div className="flex flex-col gap-1 min-w-[180px]">
            <span className="text-xs text-muted-foreground font-medium">Trường</span>
            <Select
              value={filterField}
              onValueChange={setFilterField}
              disabled={fieldOptions.length === 0}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tất cả trường" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Tất cả trường</SelectItem>
                {fieldOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* From date */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">Từ ngày</span>
            <Input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="h-8 text-xs w-36"
            />
          </div>

          {/* To date */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">Đến ngày</span>
            <Input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="h-8 text-xs w-36"
            />
          </div>

          {/* Clear */}
          {hasActiveFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 self-end text-xs text-muted-foreground"
              onClick={clearFilters}
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Xoá bộ lọc
            </Button>
          )}

          {/* Result count */}
          {!logQuery.isLoading && (
            <span className="self-end text-xs text-muted-foreground ml-auto">
              {logs.length} kết quả
            </span>
          )}
        </div>
      )}

      {/* Diff view */}
      {trackingView === "diff" && (
        diffQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : !diff || diff.tracked.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md bg-muted/20">
            <SlidersHorizontal className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium">Chưa có dữ liệu so sánh</p>
            <p className="text-xs text-muted-foreground mt-1">
              Dữ liệu sẽ xuất hiện sau khi mùa vụ được kích hoạt và có thay đổi
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {diff.tracked.map((section) => (
              <TrackingDiffSection
                key={section.entityType}
                section={section}
                milestones={milestones}
              />
            ))}
          </div>
        )
      )}

      {/* Log view */}
      {trackingView === "log" && (
        <TrackingLogList logs={logs} isLoading={logQuery.isLoading} />
      )}
    </div>
  );
}

function TrackingLogTab({ cropSeason }: { cropSeason: CropSeasonType }) {
  const isPlanningState =
    cropSeason.status === ProductionStatusName.Planning ||
    cropSeason.status === ProductionStatusName.Rejected;

  if (isPlanningState) {
    return (
      <TrackingConfigPanel
        cropSeasonId={cropSeason.id}
        readOnly={cropSeason.status === ProductionStatusName.Rejected}
      />
    );
  }

  return <TrackingOperationalView cropSeason={cropSeason} />;
}

function HarvestRecordTab({ cropSeason }: { cropSeason: CropSeasonType }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Thu hoạch dự kiến</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatDate(cropSeason.expectedHarvestDate)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Thu hoạch thực tế</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatDate(cropSeason.actualHarvestDate)}</p>
            {!cropSeason.actualHarvestDate && (
              <p className="text-xs text-muted-foreground mt-1">Chưa có ngày thu hoạch thực tế</p>
            )}
          </CardContent>
        </Card>
      </div>

      {cropSeason.plantCount != null && (
        <div className="rounded-md border p-4">
          <p className="text-xs text-muted-foreground">Số lượng cây trồng</p>
          <p className="text-xl font-bold mt-1">{cropSeason.plantCount}</p>
        </div>
      )}

      {cropSeason.notes && (
        <div className="rounded-md border p-4">
          <p className="text-xs text-muted-foreground mb-2">Ghi chú</p>
          <p className="text-sm">{cropSeason.notes}</p>
        </div>
      )}

      {canEdit(cropSeason.status) && (
        <div className="flex gap-2">
          <UpdateCropSeasonDialog season={cropSeason} />
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// History view — completed / cancelled seasons
// ══════════════════════════════════════════════════════════════

function HistoryView({ seasons, isLoading }: { seasons: CropSeasonType[]; isLoading: boolean }) {
  if (isLoading) {
    return <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  }

  if (seasons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border rounded-md bg-muted/20">
        <History className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium">Chưa có lịch sử vụ mùa</p>
        <p className="text-xs text-muted-foreground mt-1">Các vụ mùa đã hoàn thành hoặc huỷ sẽ xuất hiện ở đây</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {seasons.map((s) => (
        <div key={s.id} className="flex items-center justify-between rounded-md border px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{s.cropName}</span>
              {s.variety && <span className="text-xs text-muted-foreground">({s.variety})</span>}
              <StatusBadge status={s.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Trồng: {formatDate(s.plantDate)} · Thu hoạch: {formatDate(s.actualHarvestDate ?? s.expectedHarvestDate)}
            </p>
          </div>
          <CropSeasonDetailSheet season={s} />
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Zone landing — shown when no zoneId in URL
// ══════════════════════════════════════════════════════════════

function ZoneLanding({ zones, isLoading, onSelect }: {
  zones: ZoneType[];
  isLoading: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <Badge className="mb-2">Cổng quản lý</Badge>
        <h1 className="text-2xl font-bold">Quản lý mùa vụ</h1>
        <p className="text-sm text-muted-foreground">Chọn khu vực để quản lý mùa vụ và theo dõi sản xuất.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
        </div>
      ) : zones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-muted/20">
          <MapPin className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium">Chưa được phân công khu vực</p>
          <p className="text-sm text-muted-foreground mt-1">Liên hệ chủ vườn để được phân công quản lý khu vực.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone) => (
            <motion.div
              key={zone.id}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
            >
              <Card
                className="cursor-pointer hover:border-primary/60 hover:shadow-md transition-all"
                onClick={() => onSelect(zone.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base leading-tight truncate">{zone.name}</CardTitle>
                      {zone.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{zone.description}</p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">Trồng trọt</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    {zone.areaSqm != null ? (
                      <span className="text-sm text-muted-foreground">{zone.areaSqm.toLocaleString()} m²</span>
                    ) : (
                      <span className="text-sm text-muted-foreground/50">—</span>
                    )}
                    <Button size="sm" variant="ghost" className="gap-1.5 text-primary" onClick={() => onSelect(zone.id)}>
                      Quản lý
                      <SquareArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════════════════════════

const HISTORY_STATUSES = new Set(["completed", "cancelled"]);

export default function ManagerCropSeasonsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"now" | "history">("now");
  const zoneId = searchParams.get("zoneId")?.trim() ?? "";

  // Zone queries
  const assignedZonesQuery = useManagerListAssignedZones({ page: 1, limit: 100 });
  const assignedZones = assignedZonesQuery.data?.data.data ?? [];
  const hasAssignedZones = assignedZones.length > 0;
  const selectedZoneName = assignedZones.find((z) => z.id === zoneId)?.name;

  // Clear invalid zoneId
  useEffect(() => {
    if (!zoneId || assignedZonesQuery.isLoading) return;
    if (assignedZones.some((z) => z.id === zoneId)) return;
    const next = new URLSearchParams(searchParams);
    next.delete("zoneId");
    setSearchParams(next, { replace: true });
  }, [assignedZones, assignedZonesQuery.isLoading, searchParams, setSearchParams, zoneId]);

  // All seasons for zone (split into now/history client-side)
  const { data: allData, isLoading: seasonsLoading } = useManagerListCropSeasons(zoneId, {
    page: 1,
    limit: 50,
  });
  const allSeasons = allData?.data.data ?? [];
  const nowSeason = allSeasons.find((s) => !HISTORY_STATUSES.has(s.status)) ?? null;
  const historySeasons = allSeasons.filter((s) => HISTORY_STATUSES.has(s.status));

  useEffect(() => {
    if (!zoneId && showCreate) setShowCreate(false);
  }, [showCreate, zoneId]);

  // Zone landing gate — no zone selected yet
  if (!zoneId && !assignedZonesQuery.isLoading) {
    return (
      <ZoneLanding
        zones={assignedZones}
        isLoading={assignedZonesQuery.isLoading}
        onSelect={(id) => {
          const next = new URLSearchParams(searchParams);
          next.set("zoneId", id);
          setSearchParams(next);
        }}
      />
    );
  }

  if (!zoneId) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (showCreate && zoneId) {
    return (
      <CreateCropSeasonScreen
        zoneId={zoneId}
        zoneName={selectedZoneName}
        onBack={() => setShowCreate(false)}
      />
    );
  }

  const isPlanningState =
    nowSeason?.status === ProductionStatusName.Planning ||
    nowSeason?.status === ProductionStatusName.Rejected;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete("zoneId");
              setSearchParams(next);
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-xs text-muted-foreground">Quản lý mùa vụ</p>
            <h1 className="text-xl font-bold leading-tight">{selectedZoneName ?? "Khu vực"}</h1>
          </div>
        </div>

        {/* Zone switcher — compact */}
        {hasAssignedZones && assignedZones.length > 1 && (
          <Select
            value={zoneId}
            onValueChange={(value) => {
              const next = new URLSearchParams(searchParams);
              next.set("zoneId", value);
              setSearchParams(next);
            }}
          >
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {assignedZones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id} className="text-xs">{zone.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex gap-4 min-h-[600px]">
          {/* Left mini-sidebar */}
          <div className="w-44 shrink-0">
            <nav className="space-y-1 sticky top-4">
              <button
                type="button"
                onClick={() => setSidebarTab("now")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                  sidebarTab === "now"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-accent text-foreground"
                }`}
              >
                <Sprout className="h-4 w-4 shrink-0" />
                Vụ mùa hiện tại
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab("history")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                  sidebarTab === "history"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-accent text-foreground"
                }`}
              >
                <History className="h-4 w-4 shrink-0" />
                Lịch sử
              </button>

              <Separator className="my-3" />

              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left hover:bg-accent text-foreground"
              >
                <Plus className="h-4 w-4 shrink-0" />
                Tạo mùa vụ
              </button>
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* ── NOW tab ── */}
            {sidebarTab === "now" && (
              seasonsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-36 w-full" />
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : !nowSeason ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <Wheat className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm font-medium">Chưa có vụ mùa hiện tại</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">Tạo mùa vụ mới để bắt đầu lên kế hoạch</p>
                    <Button size="sm" onClick={() => setShowCreate(true)}>
                      <Plus className="h-3 w-3 mr-1" />
                      Tạo mùa vụ
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Summary card — always shown */}
                  <CropSeasonSummaryCard season={nowSeason} zoneId={zoneId} />

                  {/* Status-based tabs */}
                  {isPlanningState ? (
                    <Tabs defaultValue="milestones">
                      <TabsList className="w-full md:w-auto">
                        <TabsTrigger value="milestones" className="flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5" />
                          Mốc công việc
                        </TabsTrigger>
                        <TabsTrigger value="requests" className="flex items-center gap-1.5">
                          <Send className="h-3.5 w-3.5" />
                          Yêu cầu phê duyệt
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="milestones" className="mt-4">
                        <motion.div key="milestones" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: "easeOut" }}>
                          <MilestonesWithDetailTab cropSeason={nowSeason} zoneId={zoneId} />
                        </motion.div>
                      </TabsContent>
                      <TabsContent value="requests" className="mt-4">
                        <motion.div key="requests" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: "easeOut" }}>
                          <RequestsHistoryTab cropSeasonId={nowSeason.id} readOnly={false} />
                        </motion.div>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <Tabs defaultValue="milestones-op">
                      <TabsList className="w-full md:w-auto flex-wrap h-auto gap-1">
                        <TabsTrigger value="milestones-op" className="flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5" />
                          Mốc công việc
                        </TabsTrigger>
                        <TabsTrigger value="sensors" className="flex items-center gap-1.5">
                          <Radio className="h-3.5 w-3.5" />
                          Cảm biến
                        </TabsTrigger>
                        <TabsTrigger value="incidents" className="flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Sự cố
                        </TabsTrigger>
                        <TabsTrigger value="daily-tasks" className="flex items-center gap-1.5">
                          <NotebookPen className="h-3.5 w-3.5" />
                          Nhật ký task
                        </TabsTrigger>
                        <TabsTrigger value="tracking" className="flex items-center gap-1.5">
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                          Tracking log
                        </TabsTrigger>
                        <TabsTrigger value="harvest" className="flex items-center gap-1.5">
                          <Wheat className="h-3.5 w-3.5" />
                          Thu hoạch
                        </TabsTrigger>
                        <TabsTrigger value="requests" className="flex items-center gap-1.5">
                          <Send className="h-3.5 w-3.5" />
                          Yêu cầu duyệt
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="milestones-op" className="mt-4">
                        <motion.div key="milestones-op" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: "easeOut" }}>
                          <MilestonesWithDetailTab cropSeason={nowSeason} zoneId={zoneId} />
                        </motion.div>
                      </TabsContent>
                      <TabsContent value="sensors" className="mt-4">
                        <motion.div key="sensors" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: "easeOut" }}>
                          <SensorOverviewTab cropSeason={nowSeason} />
                        </motion.div>
                      </TabsContent>
                      <TabsContent value="incidents" className="mt-4">
                        <motion.div key="incidents" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: "easeOut" }}>
                          <IncidentTab cropSeason={nowSeason} />
                        </motion.div>
                      </TabsContent>
                      <TabsContent value="daily-tasks" className="mt-4">
                        <motion.div key="daily-tasks" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: "easeOut" }}>
                          <DailyTasksTab cropSeason={nowSeason} />
                        </motion.div>
                      </TabsContent>
                      <TabsContent value="tracking" className="mt-4">
                        <motion.div key="tracking" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: "easeOut" }}>
                          <TrackingLogTab cropSeason={nowSeason} />
                        </motion.div>
                      </TabsContent>
                      <TabsContent value="harvest" className="mt-4">
                        <motion.div key="harvest" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: "easeOut" }}>
                          <HarvestRecordTab cropSeason={nowSeason} />
                        </motion.div>
                      </TabsContent>
                      <TabsContent value="requests" className="mt-4">
                        <motion.div key="requests-op" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: "easeOut" }}>
                          <RequestsHistoryTab cropSeasonId={nowSeason.id} readOnly={true} />
                        </motion.div>
                      </TabsContent>
                    </Tabs>
                  )}
                </div>
              )
            )}

            {/* ── HISTORY tab ── */}
            {sidebarTab === "history" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold">Lịch sử vụ mùa</h2>
                  {historySeasons.length > 0 && (
                    <span className="text-sm text-muted-foreground">{historySeasons.length} vụ</span>
                  )}
                </div>
                <HistoryView seasons={historySeasons} isLoading={seasonsLoading} />
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
