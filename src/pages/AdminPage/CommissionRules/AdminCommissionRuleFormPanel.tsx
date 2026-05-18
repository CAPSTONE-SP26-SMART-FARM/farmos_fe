import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import DatePickerField from "@/components/common/DatePickerField";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { getApiErrorMessageVi } from "@/lib/error-message";
import { useAdminTicketCategoryList } from "@/queries/useTicketCategory";
import {
  useCreateCommissionRule,
  useUpdateCommissionRule,
} from "@/queries/useCommissionRule";
import {
  CommissionScopeSchema,
  CreateCommissionRuleBodySchema,
  DoctorTierSchema,
  UpdateCommissionRuleBodySchema,
  type CommissionRuleType,
  type CommissionScopeType,
  type CreateCommissionRuleBodyType,
  type UpdateCommissionRuleBodyType,
} from "@/schemaValidatation/commissionRule";
import { SCOPE_LABELS } from "./commissionRule.constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { Info, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

const SCOPE_DESCRIPTIONS: Record<CommissionScopeType, string> = {
  CATEGORY_DEFAULT:
    "Tỷ lệ mặc định cho tất cả bác sĩ khi xử lý ticket thuộc danh mục được chọn. Quy tắc cụ thể hơn (cấp bậc, cá nhân) sẽ ghi đè quy tắc này.",
  DOCTOR_TIER:
    "Áp dụng cho tất cả bác sĩ thuộc cấp bậc đã chọn, bất kể danh mục ticket. Độ ưu tiên cao hơn quy tắc mặc định danh mục.",
  DOCTOR:
    "Áp dụng riêng cho một bác sĩ cụ thể. Có độ ưu tiên cao nhất, ghi đè mọi quy tắc khác.",
};

const OPTION_FETCH_LIMIT = 99;

interface AdminCommissionRuleFormPanelProps {
  rule?: CommissionRuleType;
  onBack: () => void;
}

export default function AdminCommissionRuleFormPanel({
  rule,
  onBack,
}: AdminCommissionRuleFormPanelProps) {
  const isEdit = !!rule;
  const createMutation = useCreateCommissionRule();
  const updateMutation = useUpdateCommissionRule();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const categoriesQuery = useAdminTicketCategoryList({
    page: 1,
    limit: OPTION_FETCH_LIMIT,
    search: "",
    isActive: true,
  });
  const categories = (categoriesQuery.data?.data?.data ?? []).filter(
    (category) => category.isActive,
  );

  // Form: union — create shape carries scope+target+commission; edit chỉ có
  // commission/effective/note. Dùng cùng FormShape, resolver switch theo mode.
  type FormShape = CreateCommissionRuleBodyType;

  const defaultValues: FormShape = useMemo(
    () => ({
      scope: rule?.scope ?? "CATEGORY_DEFAULT",
      categoryId: rule?.categoryId ?? undefined,
      doctorTier: rule?.doctorTier ?? undefined,
      doctorId: rule?.doctorId ?? undefined,
      commissionPercent: rule?.commissionPercent ?? 0,
      effectiveFrom: rule?.effectiveFrom?.split("T")[0] ?? "",
      effectiveTo: rule?.effectiveTo?.split("T")[0] ?? "",
      note: rule?.note ?? "",
    }),
    [rule],
  );

  const form = useForm<FormShape>({
    resolver: zodResolver(
      isEdit ? UpdateCommissionRuleBodySchema : CreateCommissionRuleBodySchema,
    ) as Resolver<FormShape>,
    defaultValues,
  });
  useClearServerFieldErrors(form);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = form;

  const scope = watch("scope");

  const onSubmit = async (data: FormShape) => {
    try {
      if (isEdit && rule) {
        const payload: UpdateCommissionRuleBodyType = {
          commissionPercent: data.commissionPercent,
          effectiveFrom: data.effectiveFrom
            ? new Date(`${data.effectiveFrom}T00:00:00.000Z`).toISOString()
            : undefined,
          effectiveTo: data.effectiveTo
            ? new Date(`${data.effectiveTo}T00:00:00.000Z`).toISOString()
            : null,
          note: data.note?.trim() ? data.note : null,
        };
        await updateMutation.mutateAsync({ id: rule.id, body: payload });
        toast.success("Đã cập nhật quy tắc hoa hồng.");
      } else {
        const payload: CreateCommissionRuleBodyType = {
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
        await createMutation.mutateAsync(payload);
        toast.success("Đã tạo quy tắc hoa hồng mới.");
      }
      onBack();
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 422) {
        handleApiErrorUnprocessentity(
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* ── Section 1: Phạm vi áp dụng ────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Phạm vi áp dụng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEdit && rule ? (
            <div className="rounded-md border bg-muted/40 p-3 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">
                Phạm vi (không thể sửa)
              </p>
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="secondary">{SCOPE_LABELS[rule.scope]}</Badge>
                {rule.category && (
                  <Badge variant="outline">
                    Danh mục: {rule.category.name}
                  </Badge>
                )}
                {rule.doctorTier && (
                  <Badge variant="outline">Cấp bậc: {rule.doctorTier}</Badge>
                )}
                {rule.doctor && (
                  <Badge variant="outline">Bác sĩ: {rule.doctor.name}</Badge>
                )}
              </div>
            </div>
          ) : (
            <>
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
                          <SelectItem key={s} value={s}>
                            {SCOPE_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {scope && (
                <div className="flex gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{SCOPE_DESCRIPTIONS[scope]}</p>
                </div>
              )}

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
                        <SelectTrigger
                          aria-invalid={Boolean(errors.categoryId)}
                        >
                          <SelectValue placeholder="Chọn danh mục..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              Chưa có danh mục nào đang hoạt động.
                            </div>
                          ) : (
                            categories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
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
                        <SelectTrigger
                          aria-invalid={Boolean(errors.doctorTier)}
                        >
                          <SelectValue placeholder="Chọn cấp bậc bác sĩ..." />
                        </SelectTrigger>
                        <SelectContent>
                          {DoctorTierSchema.options.map((tier) => (
                            <SelectItem key={tier} value={tier}>
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
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Section 2: Tỷ lệ hoa hồng ────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tỷ lệ hoa hồng</CardTitle>
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
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      <Separator />
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isPending}
        >
          Huỷ
        </Button>
        <Button type="submit" disabled={isPending} className="min-w-32">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : isEdit ? (
            "Lưu thay đổi"
          ) : (
            "Thêm quy tắc"
          )}
        </Button>
      </div>
    </form>
  );
}
