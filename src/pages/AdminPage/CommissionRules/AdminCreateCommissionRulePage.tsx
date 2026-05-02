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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { getApiErrorMessageVi } from "@/lib/error-message";
import { useAdminTicketCategoryList } from "@/queries/useTicketCategory";
import { useCreateCommissionRule } from "@/queries/useCommissionRule";
import {
  CommissionScopeSchema,
  CreateCommissionRuleBodySchema,
  DoctorTierSchema,
  type CommissionScopeType,
  type CreateCommissionRuleBodyType,
} from "@/schemaValidatation/commissionRule";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  CalendarDays,
  ChartColumnIncreasing,
  Info,
  Loader2,
} from "lucide-react";
import { format, isValid, parse } from "date-fns";
import { useNavigate } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";

const LIST_PATH = "/dashboard/admin/commission-rules";

const SCOPE_LABELS: Record<CommissionScopeType, string> = {
  CATEGORY_DEFAULT: "Mặc định danh mục",
  DOCTOR_TIER: "Cấp bậc bác sĩ",
  DOCTOR: "Bác sĩ cụ thể",
};

const SCOPE_DESCRIPTIONS: Record<CommissionScopeType, string> = {
  CATEGORY_DEFAULT:
    "Tỷ lệ mặc định cho tất cả bác sĩ khi xử lý ticket thuộc danh mục được chọn. Quy tắc cụ thể hơn (cấp bậc, cá nhân) sẽ ghi đè quy tắc này.",
  DOCTOR_TIER:
    "Áp dụng cho tất cả bác sĩ thuộc cấp bậc đã chọn, bất kể danh mục ticket. Độ ưu tiên cao hơn quy tắc mặc định danh mục.",
  DOCTOR:
    "Áp dụng riêng cho một bác sĩ cụ thể. Có độ ưu tiên cao nhất, ghi đè mọi quy tắc khác.",
};

const OPTION_FETCH_LIMIT = 99;
const DATE_DISPLAY_FORMAT = "dd/MM/yyyy";
const DATE_PAYLOAD_FORMAT = "yyyy-MM-dd";

function parseBackendDate(value: string | null | undefined) {
  if (!value) return undefined;
  const parsed = parse(value, DATE_PAYLOAD_FORMAT, new Date());
  if (isValid(parsed)) return parsed;

  const fallback = new Date(value);
  return isValid(fallback) ? fallback : undefined;
}

function formatPickerDate(value: string | null | undefined) {
  const parsed = parseBackendDate(value);
  return parsed ? format(parsed, DATE_DISPLAY_FORMAT) : "";
}

function DatePickerField({
  label,
  value,
  onChange,
  error,
  helperText,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
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
              onChange(date ? format(date, DATE_PAYLOAD_FORMAT) : "")
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {error ? (
        <p className="text-destructive text-xs">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  );
}

export default function AdminCreateCommissionRulePage() {
  const navigate = useNavigate();
  const createMutation = useCreateCommissionRule();
  const categoriesQuery = useAdminTicketCategoryList({
    page: 1,
    limit: OPTION_FETCH_LIMIT,
    search: "",
    isActive: true,
  });
  const categories = (categoriesQuery.data?.data?.data ?? []).filter(
    (category) => category.isActive,
  );

  const form = useForm<CreateCommissionRuleBodyType>({
    resolver: zodResolver(CreateCommissionRuleBodySchema),
    defaultValues: {
      scope: "CATEGORY_DEFAULT",
      commissionPercent: 0,
      note: "",
      effectiveFrom: "",
      effectiveTo: "",
    },
  });
  useClearServerFieldErrors(form);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const scope = watch("scope");

  const onSubmit = async (data: CreateCommissionRuleBodyType) => {
    const payload = {
      ...data,
      effectiveFrom: data.effectiveFrom
        ? new Date(`${data.effectiveFrom}T00:00:00.000Z`).toISOString()
        : undefined,
      effectiveTo: data.effectiveTo
        ? new Date(`${data.effectiveTo}T00:00:00.000Z`).toISOString()
        : undefined,
      categoryId: data.categoryId || undefined,
      doctorTier: data.doctorTier || undefined,
      doctorId: data.doctorId || undefined,
      note: data.note?.trim() ? data.note : undefined,
    };
    try {
      await createMutation.mutateAsync(payload);
      toast.success("Tạo quy tắc hoa hồng thành công.");
      navigate(LIST_PATH);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 422) {
        handleApiErrorUnprocessentity<CreateCommissionRuleBodyType>(
          err.response.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
      } else if (isAxiosError(err) && err.response?.status === 409) {
        toast.warning(
          "Quy tắc có thể bị trùng lặp với quy tắc đang hoạt động. Kiểm tra lại khoảng thời gian hiệu lực.",
        );
      } else {
        toast.error(getApiErrorMessageVi(err));
      }
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300 mx-auto">
      {/* ── Breadcrumb ─────────────────────────────────────────────── */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              className="cursor-pointer"
              onClick={() => navigate("/dashboard/admin")}
            >
              Quản trị
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              className="cursor-pointer"
              onClick={() => navigate(LIST_PATH)}
            >
              Quy Tắc Hoa Hồng
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Thêm quy tắc mới</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ── Page header ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1.5"
            >
              <ChartColumnIncreasing className="h-3 w-3" />
              Tạo mới
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Thêm Quy Tắc Hoa Hồng
          </h1>
          <p className="text-sm text-muted-foreground">
            Quy tắc hoa hồng xác định % bác sĩ nhận được từ mỗi ticket. Hệ thống
            áp dụng quy tắc theo độ ưu tiên: Cá nhân → Cấp bậc → Danh mục mặc
            định.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(LIST_PATH)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {/* ── Section 1: Phạm vi áp dụng ────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Phạm vi áp dụng</CardTitle>
            <CardDescription>
              Xác định quy tắc này áp dụng cho ai. Phạm vi không thể thay đổi
              sau khi tạo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>
                Loại phạm vi <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="scope"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phạm vi..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CommissionScopeSchema.options.map((s) => (
                        <SelectItem
                          key={s}
                          value={s}
                        >
                          {SCOPE_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Contextual description of chosen scope */}
            {scope && (
              <div className="flex gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{SCOPE_DESCRIPTIONS[scope]}</p>
              </div>
            )}

            {/* Scope-dependent target field */}
            {scope === "CATEGORY_DEFAULT" && (
              <div className="space-y-1.5">
                <Label>
                  Danh mục ticket <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger aria-invalid={Boolean(errors.categoryId)}>
                        <SelectValue placeholder="Chọn danh mục..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            Chưa có danh mục nào đang hoạt động.
                          </div>
                        ) : (
                          categories.map((c) => (
                            <SelectItem
                              key={c.id}
                              value={c.id}
                            >
                              {c.name}{" "}
                              <span className="text-muted-foreground">
                                ({c.code})
                              </span>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.categoryId && (
                  <p className="text-destructive text-xs">
                    {errors.categoryId.message}
                  </p>
                )}
              </div>
            )}

            {scope === "DOCTOR_TIER" && (
              <div className="space-y-1.5">
                <Label>
                  Cấp bậc bác sĩ <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="doctorTier"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger aria-invalid={Boolean(errors.doctorTier)}>
                        <SelectValue placeholder="Chọn cấp bậc bác sĩ..." />
                      </SelectTrigger>
                      <SelectContent>
                        {DoctorTierSchema.options.map((tier) => (
                          <SelectItem
                            key={tier}
                            value={tier}
                          >
                            {tier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.doctorTier ? (
                  <p className="text-destructive text-xs">
                    {errors.doctorTier.message}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Chỉ chọn một trong các tier hợp lệ của backend.
                  </p>
                )}
              </div>
            )}

            {scope === "DOCTOR" && (
              <div className="space-y-1.5">
                <Label>
                  ID bác sĩ <span className="text-destructive">*</span>
                </Label>
                <Input
                  {...register("doctorId")}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  aria-invalid={Boolean(errors.doctorId)}
                  className="font-mono text-sm"
                />
                {errors.doctorId ? (
                  <p className="text-destructive text-xs">
                    {errors.doctorId.message}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    UUID của bác sĩ — tìm trong trang quản lý bác sĩ.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Section 2: Tỷ lệ hoa hồng ────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tỷ lệ hoa hồng</CardTitle>
            <CardDescription>
              Phần trăm bác sĩ nhận được trên đơn giá của ticket sau khi hoàn
              thành tư vấn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-xs space-y-1.5">
              <Label>
                Hoa hồng <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  {...register("commissionPercent", { valueAsNumber: true })}
                  aria-invalid={Boolean(errors.commissionPercent)}
                  className="pr-8"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground font-medium">
                  %
                </span>
              </div>
              {errors.commissionPercent ? (
                <p className="text-destructive text-xs">
                  {errors.commissionPercent.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Giá trị từ 0 đến 100. VD: 20 = bác sĩ nhận 20% đơn giá ticket.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Section 3: Thời gian hiệu lực ─────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thời gian hiệu lực</CardTitle>
            <CardDescription>
              Để trống cả hai nếu quy tắc áp dụng vĩnh viễn. Hệ thống sẽ cảnh
              báo nếu có quy tắc trùng khoảng thời gian với cùng phạm vi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Controller
                name="effectiveFrom"
                control={control}
                render={({ field, fieldState }) => (
                  <DatePickerField
                    label="Hiệu lực từ"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                    helperText="Để trống = áp dụng ngay từ đầu."
                  />
                )}
              />
              <Controller
                name="effectiveTo"
                control={control}
                render={({ field, fieldState }) => (
                  <DatePickerField
                    label="Hiệu lực đến"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                    helperText="Để trống = không có ngày hết hạn."
                  />
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Ghi chú</Label>
              <Textarea
                {...register("note")}
                rows={2}
                placeholder="Ghi chú lý do tạo quy tắc, đợt khuyến mãi, hoặc hợp đồng liên quan..."
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Sticky action bar ──────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 rounded-lg border bg-card p-4 shadow-sm">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(LIST_PATH)}
            disabled={isSubmitting}
          >
            Huỷ
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-36"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tạo...
              </>
            ) : (
              "Thêm quy tắc"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
