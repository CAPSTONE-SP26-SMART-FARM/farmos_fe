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
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import {
  Plus,
  Eye,
  Send,
  Pencil,
  Loader2,
  Clock,
  Milestone,
  ArrowLeft,
  CalendarDays,
} from "lucide-react";
import {
  addMonths,
  format,
  isBefore,
  isValid,
  parse,
  startOfDay,
} from "date-fns";
import ProPagination from "@/components/common/pro-pagination";
import { toast } from "sonner";

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

const canEdit = (status: string) => status === ProductionStatusName.Planning;
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
}: {
  label: string;
  value: string;
  error?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  minDate?: Date;
  helperText?: string;
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

            <Field
              label="Giống / Loại"
              error={form.formState.errors.variety?.message}
            >
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

            <Field
              label="Số lượng cây"
              error={form.formState.errors.plantCount?.message}
            >
              <Input
                type="number"
                {...form.register("plantCount", { valueAsNumber: true })}
                autoComplete="off"
              />
            </Field>

            <Field
              label="Ghi chú"
              error={form.formState.errors.notes?.message}
            >
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
      totalAreaSqm: season.totalAreaSqm ?? undefined,
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

  if (!canEdit(season.status)) return null;

  const onSubmit = async (data: UpdateCropSeasonBodyType) => {
    form.clearErrors(["plantDate", "expectedHarvestDate"]);
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

    try {
      await mutateAsync(data);
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
          <Field
            label="Tên cây trồng"
            error={form.formState.errors.cropName?.message}
          >
            <Input
              {...form.register("cropName")}
              autoComplete="off"
            />
          </Field>
          <Field
            label="Giống / Loại"
            error={form.formState.errors.variety?.message}
          >
            <Input
              {...form.register("variety")}
              autoComplete="off"
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
                />
              )}
            />
          </div>
          <Field
            label="Số lượng cây"
            error={form.formState.errors.plantCount?.message}
          >
            <Input
              type="number"
              {...form.register("plantCount", { valueAsNumber: true })}
              autoComplete="off"
            />
          </Field>
          <Field
            label="Ghi chú"
            error={form.formState.errors.notes?.message}
          >
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
  useClearServerFieldErrors(form);

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
    try {
      await mutateAsync(data);
      setOpen(false);
    } catch (error) {
      if (
        isApiErrorUnprocessableEntityResponse<SendProductionRequestBodyType>(
          error,
        )
      ) {
        handleApiErrorUnprocessentity<SendProductionRequestBodyType>(
          error.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }

      if (isApiErrorResponse(error)) {
        toast.error(error.response?.data.message ?? "Gửi yêu cầu thất bại");
        return;
      }

      toast.error("Gửi yêu cầu thất bại");
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
            <Field
              label="Ghi chú cho chủ vườn (tuỳ chọn)"
              error={form.formState.errors.description?.message}
            >
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

// ── Main Page ─────────────────────────────────────────────────────────────

export default function ManagerCropSeasonsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);
  const page = Number(searchParams.get("page") ?? "1");
  const statusFilter = (searchParams.get("status") ?? "") as any;
  const zoneId = searchParams.get("zoneId")?.trim() ?? "";

  const assignedZonesQuery = useManagerListAssignedZones({
    page: 1,
    limit: 100,
  });
  const assignedZones = assignedZonesQuery.data?.data.data ?? [];
  const hasAssignedZones = assignedZones.length > 0;
  const selectedZoneName = assignedZones.find((z) => z.id === zoneId)?.name;

  useEffect(() => {
    if (zoneId || !hasAssignedZones) return;
    const next = new URLSearchParams(searchParams);
    next.set("zoneId", assignedZones[0].id);
    next.delete("page");
    setSearchParams(next, { replace: true });
  }, [assignedZones, hasAssignedZones, searchParams, setSearchParams, zoneId]);

  useEffect(() => {
    if (!zoneId || assignedZonesQuery.isLoading) return;
    if (assignedZones.some((zone) => zone.id === zoneId)) return;

    const next = new URLSearchParams(searchParams);
    next.delete("zoneId");
    next.delete("page");
    setSearchParams(next, { replace: true });
  }, [
    assignedZones,
    assignedZonesQuery.isLoading,
    searchParams,
    setSearchParams,
    zoneId,
  ]);

  const { data, isLoading } = useManagerListCropSeasons(zoneId, {
    page,
    limit: 10,
    status: statusFilter || undefined,
  });

  const seasons = data?.data.data ?? [];
  const totalPages = data?.data.meta.totalPages ?? 0;
  const totalItems = data?.data.meta.totalItems ?? 0;

  useEffect(() => {
    if (!zoneId && showCreate) {
      setShowCreate(false);
    }
  }, [showCreate, zoneId]);

  if (showCreate && zoneId) {
    return (
      <CreateCropSeasonScreen
        zoneId={zoneId}
        zoneName={selectedZoneName}
        onBack={() => setShowCreate(false)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge className="mb-2">Cổng quản lý</Badge>
          <h1 className="text-2xl font-bold">Quản lý mùa vụ</h1>
          <p className="text-muted-foreground">
            Lên kế hoạch, theo dõi và gửi phê duyệt mùa vụ cho chủ vườn.
          </p>
          {selectedZoneName && (
            <p className="text-sm text-muted-foreground mt-1">
              Khu vực hiện tại:{" "}
              <span className="font-medium">{selectedZoneName}</span>
            </p>
          )}
        </div>
        {zoneId && (
          <Button
            size="sm"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Tạo mùa vụ
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-2 items-end">
            <Field
              label="Khu vực được phân công"
              className="flex-1"
            >
              {assignedZonesQuery.isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : !hasAssignedZones ? (
                <div className="h-10 rounded-md border px-3 text-sm text-muted-foreground flex items-center">
                  Bạn chưa được phân công khu vực nào.
                </div>
              ) : (
                <Select
                  value={zoneId || "all"}
                  onValueChange={(value) => {
                    const next = new URLSearchParams(searchParams);
                    if (value === "all") {
                      next.delete("zoneId");
                    } else {
                      next.set("zoneId", value);
                    }
                    next.delete("page");
                    setSearchParams(next);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn khu vực" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Chọn khu vực</SelectItem>
                    {assignedZones.map((zone) => (
                      <SelectItem
                        key={zone.id}
                        value={zone.id}
                      >
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Field>
            {zoneId && (
              <Button
                variant="ghost"
                size="sm"
                className="mb-0.5"
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.delete("zoneId");
                  next.delete("page");
                  setSearchParams(next);
                }}
              >
                Xoá
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {zoneId && (
        <div className="flex gap-2 items-center">
          <Select
            value={statusFilter || "all"}
            onValueChange={(v) => {
              const p = new URLSearchParams(searchParams);
              if (v === "all") {
                p.delete("status");
              } else {
                p.set("status", v);
              }
              p.delete("page");
              setSearchParams(p);
            }}
          >
            <SelectTrigger className="w-50">
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <SelectItem
                  key={k}
                  value={k}
                >
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {statusFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const p = new URLSearchParams(searchParams);
                p.delete("status");
                setSearchParams(p);
              }}
            >
              Xoá bộ lọc
            </Button>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Danh sách mùa vụ
            {!isLoading && zoneId && (
              <span className="text-muted-foreground font-normal text-sm">
                ({totalItems} mùa vụ)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cây trồng</TableHead>
                  <TableHead>Giống</TableHead>
                  <TableHead>Ngày trồng</TableHead>
                  <TableHead>Thu hoạch dự kiến</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                {!isLoading && seasons.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-12"
                    >
                      {!zoneId
                        ? hasAssignedZones
                          ? "Chọn khu vực bên trên để xem danh sách mùa vụ"
                          : "Bạn chưa được phân công khu vực nào."
                        : 'Chưa có mùa vụ nào. Bấm "Tạo mùa vụ" để bắt đầu!'}
                    </TableCell>
                  </TableRow>
                )}
                {seasons.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.cropName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.variety ?? "—"}
                    </TableCell>
                    <TableCell>{formatDate(s.plantDate)}</TableCell>
                    <TableCell>{formatDate(s.expectedHarvestDate)}</TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end flex-wrap">
                        <CropSeasonDetailSheet season={s} />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const params = new URLSearchParams();
                            if (zoneId) {
                              params.set("zoneId", zoneId);
                            }
                            const search = params.toString();
                            navigate({
                              pathname: `/dashboard/manager/crop-seasons/${s.id}/milestones`,
                              search: search ? `?${search}` : "",
                            });
                          }}
                        >
                          <Milestone className="h-3 w-3 mr-1" />
                          Mốc công việc
                        </Button>
                        <UpdateCropSeasonDialog season={s} />
                        <SendRequestDialog season={s} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <p className="text-xs text-muted-foreground">
                Trang {page} / {totalPages}
              </p>
              <ProPagination
                currentPage={page}
                totalPages={totalPages}
                buildHref={(p) => {
                  const params = new URLSearchParams(searchParams);
                  if (p) {
                    params.set("page", String(p));
                  } else {
                    params.delete("page");
                  }
                  return {
                    pathname: location.pathname,
                    search: params.toString(),
                  };
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
