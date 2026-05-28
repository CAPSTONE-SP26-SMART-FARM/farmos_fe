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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  useAdminTicketCategoryList,
  useCreateTicketCategory,
  useUpdateTicketCategory,
} from "@/queries/useTicketCategory";
import {
  CreateTicketCategoryBodySchema,
  UpdateTicketCategoryBodySchema,
  type CreateTicketCategoryBodyType,
  type TicketCategoryType,
  type UpdateTicketCategoryBodyType,
} from "@/schemaValidatation/ticketCategory";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { Info, Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

const OPTION_FETCH_LIMIT = 99;
const FEATURE_CODE_REGEX = /^[A-Z][A-Z0-9_]{2,63}$/;

const STANDARD_FEATURE_CODES = [
  "TICKET_GENERAL_CREDITS",
  "TICKET_DISEASE_CREDITS",
  "TICKET_NUTRITION_CREDITS",
  "TICKET_REPRODUCTION_CREDITS",
  "TICKET_EMERGENCY_CREDITS",
];

const STANDARD_CODE_TO_FEATURE: Record<string, string> = {
  GENERAL_CONSULTATION: "TICKET_GENERAL_CREDITS",
  DISEASE_DIAGNOSIS: "TICKET_DISEASE_CREDITS",
  NUTRITION: "TICKET_NUTRITION_CREDITS",
  REPRODUCTION: "TICKET_REPRODUCTION_CREDITS",
  EMERGENCY: "TICKET_EMERGENCY_CREDITS",
};

function deriveFeatureCode(code: string): string {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return "";
  if (STANDARD_CODE_TO_FEATURE[normalized])
    return STANDARD_CODE_TO_FEATURE[normalized];
  return `${normalized}_CREDITS`;
}

interface AdminTicketCategoryFormPanelProps {
  category?: TicketCategoryType;
  onBack: () => void;
}

export default function AdminTicketCategoryFormPanel({
  category,
  onBack,
}: AdminTicketCategoryFormPanelProps) {
  const isEdit = !!category;
  const createMutation = useCreateTicketCategory();
  const updateMutation = useUpdateTicketCategory();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const categoryQuery = useAdminTicketCategoryList({
    page: 1,
    limit: OPTION_FETCH_LIMIT,
    search: "",
  });

  // BE check `existsAnotherActiveByFeatureCode` → pre-warn admin trước khi submit.
  const activeFeatureCodeMap = useMemo(() => {
    const rows = categoryQuery.data?.data?.data ?? [];
    const map = new Map<string, { name: string; code: string; id: string }>();
    rows.forEach((item) => {
      if (item.featureCode && item.isActive) {
        map.set(item.featureCode, {
          name: item.name,
          code: item.code,
          id: item.id,
        });
      }
    });
    return map;
  }, [categoryQuery.data]);

  // Form: shape khác giữa create/update — dùng union type và resolver tương ứng.
  type FormShape = CreateTicketCategoryBodyType & {
    code: string;
  };

  const defaultValues: FormShape = useMemo(
    () => ({
      code: category?.code ?? "",
      name: category?.name ?? "",
      description: category?.description ?? "",
      unitPrice: category?.unitPrice ?? 0,
      defaultCommissionPercent: category?.defaultCommissionPercent ?? 0,
      eligibleForSubscriptionGrant:
        category?.eligibleForSubscriptionGrant ?? false,
      eligibleForPurchase: category?.eligibleForPurchase ?? true,
      featureCode: category?.featureCode ?? "",
      metadata: category?.metadata ?? undefined,
    }),
    [category],
  );

  const form = useForm<FormShape>({
    resolver: zodResolver(
      isEdit ? UpdateTicketCategoryBodySchema : CreateTicketCategoryBodySchema,
    ) as Resolver<FormShape>,
    defaultValues,
  });
  useClearServerFieldErrors(form);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = form;

  const watchedCode = watch("code");
  const previewCreditType = watchedCode
    ? `ticket_cat_${watchedCode.toLowerCase()}`
    : "ticket_cat_<mã danh mục>";

  const watchedGrant = watch("eligibleForSubscriptionGrant");
  const watchedFeatureCode = watch("featureCode");
  const featureCodeConflictRaw = watchedFeatureCode
    ? activeFeatureCodeMap.get(watchedFeatureCode)
    : undefined;
  // Khi edit, nếu featureCode trùng với chính category đang sửa thì không phải conflict.
  const featureCodeConflict =
    featureCodeConflictRaw && featureCodeConflictRaw.id !== category?.id
      ? featureCodeConflictRaw
      : undefined;

  // Auto-suggest featureCode khi user gõ `code` — chỉ apply khi field còn rỗng
  // hoặc trùng suggestion trước đó, tránh ghi đè input của user.
  // Skip nếu switch "cấp qua gói đăng ký" tắt — featureCode lúc đó vô nghĩa.
  const lastAutoFeatureCode = useRef<string>("");
  useEffect(() => {
    if (isEdit) return;
    if (!watchedGrant) return;
    const suggested = deriveFeatureCode(watchedCode ?? "");
    if (!suggested) return;
    const current = form.getValues("featureCode") ?? "";
    if (current === "" || current === lastAutoFeatureCode.current) {
      setValue("featureCode", suggested, { shouldValidate: false });
      lastAutoFeatureCode.current = suggested;
    }
  }, [watchedCode, watchedGrant, form, setValue, isEdit]);

  // Khi tắt switch "cấp qua gói đăng ký" → clear featureCode để submit gửi null.
  // Khi bật lại → trigger auto-suggest qua effect ở trên (reset ref).
  const prevGrantRef = useRef<boolean>(watchedGrant ?? false);
  useEffect(() => {
    const prev = prevGrantRef.current;
    if (prev && !watchedGrant) {
      setValue("featureCode", "", { shouldValidate: false });
      lastAutoFeatureCode.current = "";
    } else if (!prev && watchedGrant) {
      lastAutoFeatureCode.current = "";
    }
    prevGrantRef.current = watchedGrant ?? false;
  }, [watchedGrant, setValue]);

  const suggestionChips = useMemo(() => {
    const set = new Set<string>(STANDARD_FEATURE_CODES);
    const derived = deriveFeatureCode(watchedCode ?? "");
    if (derived) set.add(derived);
    return Array.from(set);
  }, [watchedCode]);

  const featureCodeFormatInvalid =
    !!watchedFeatureCode && !FEATURE_CODE_REGEX.test(watchedFeatureCode);

  const onSubmit = async (data: FormShape) => {
    // BE accept featureCode null khi không cấp qua gói đăng ký — gửi null thay
    // vì giá trị rác còn sót trong form state để clear field ở DB.
    const normalizedFeatureCode = data.eligibleForSubscriptionGrant
      ? data.featureCode || null
      : null;
    try {
      if (isEdit && category) {
        const updateBody: UpdateTicketCategoryBodyType = {
          name: data.name,
          description: data.description,
          unitPrice: data.unitPrice,
          defaultCommissionPercent: data.defaultCommissionPercent,
          eligibleForSubscriptionGrant: data.eligibleForSubscriptionGrant,
          eligibleForPurchase: data.eligibleForPurchase,
          featureCode: normalizedFeatureCode,
          metadata: data.metadata,
        };
        await updateMutation.mutateAsync({ id: category.id, body: updateBody });
        toast.success("Đã cập nhật danh mục ticket.");
      } else {
        await createMutation.mutateAsync({
          ...data,
          featureCode: normalizedFeatureCode,
        });
        toast.success("Đã tạo danh mục ticket mới.");
      }
      onBack();
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 422) {
        handleApiErrorUnprocessentity(
          err.response.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
      } else {
        toast.error(getApiErrorMessageVi(err));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* ── Section 1: Thông tin cơ bản ───────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tc-code">
                Mã danh mục <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tc-code"
                {...register("code")}
                placeholder="VD: DISEASE_DIAGNOSIS"
                disabled={isEdit}
                aria-invalid={Boolean(errors.code)}
                className="font-mono uppercase"
              />
              {errors.code ? (
                <p className="text-destructive text-xs">
                  {errors.code.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Chữ in hoa, bắt đầu bằng chữ cái, 3-64 ký tự (A-Z, 0-9, _).
                  Không thể sửa sau khi tạo.
                </p>
              )}
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs space-y-0.5">
                <p className="text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Credit type sẽ được hệ thống tự sinh
                </p>
                <p className="font-mono font-medium">
                  {category?.creditType ?? previewCreditType}
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tc-name">
                Tên danh mục <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tc-name"
                {...register("name")}
                placeholder="VD: Chẩn đoán bệnh"
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && (
                <p className="text-destructive text-xs">
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tc-description">Mô tả</Label>
            <Textarea
              id="tc-description"
              {...register("description")}
              rows={3}
              placeholder="Mô tả ngắn về mục đích và phạm vi áp dụng của danh mục này..."
            />
          </div>

          {isEdit && category && (
            <div className="flex flex-wrap gap-2 rounded-md border bg-muted/40 p-3">
              <Badge variant="secondary">Mã: {category.code}</Badge>
              <Badge variant="secondary">Tiền tệ: {category.currency}</Badge>
              <Badge
                variant="outline"
                className={
                  category.isActive
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "text-muted-foreground"
                }
              >
                {category.isActive ? "Hoạt động" : "Vô hiệu"}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 2: Giá & hoa hồng ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Giá & Hoa hồng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tc-unitPrice">
                Đơn giá <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="tc-unitPrice"
                  type="number"
                  min={0}
                  step={1000}
                  {...register("unitPrice", { valueAsNumber: true })}
                  aria-invalid={Boolean(errors.unitPrice)}
                  className="pr-14"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground font-medium">
                  VNĐ
                </span>
              </div>
              {errors.unitPrice ? (
                <p className="text-destructive text-xs">
                  {errors.unitPrice.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Đơn giá lock vào ticket khi tạo (snapshot).
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tc-commissionPercent">
                Hoa hồng mặc định <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="tc-commissionPercent"
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  {...register("defaultCommissionPercent", {
                    valueAsNumber: true,
                  })}
                  aria-invalid={Boolean(errors.defaultCommissionPercent)}
                  className="pr-8"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground font-medium">
                  %
                </span>
              </div>
              {errors.defaultCommissionPercent ? (
                <p className="text-destructive text-xs">
                  {errors.defaultCommissionPercent.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Áp dụng khi không có quy tắc cụ thể nào khớp với bác sĩ.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 3: Quyền truy cập & Liên kết gói ─────────────── */}
      {/* Switch "Cấp qua gói đăng ký" nằm trên đầu — FeatureCode chỉ ý nghĩa
          khi switch bật → conditional render bên dưới để giảm noise UI. */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Quyền truy cập & Liên kết gói
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
            <div className="space-y-0.5 flex-1">
              <p className="text-sm font-medium">Cấp qua gói đăng ký</p>
              <p className="text-xs text-muted-foreground">
                Bật khi muốn danh mục này trừ vào quota của gói thuê bao. Khi
                bật, cần khai báo Feature code để khớp với entitlement của gói.
              </p>
            </div>
            <Switch
              id="tc-subscriptionGrant"
              checked={watchedGrant}
              onCheckedChange={(v) =>
                setValue("eligibleForSubscriptionGrant", Boolean(v), {
                  shouldValidate: true,
                })
              }
              aria-label="Cấp qua gói đăng ký"
            />
          </div>

          <AnimatePresence initial={false}>
            {watchedGrant && (
              <motion.div
                key="featureCode-block"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-1.5 rounded-lg border bg-muted/20 p-3">
                  <Label htmlFor="tc-featureCode">
                    Feature code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="tc-featureCode"
                    {...register("featureCode", {
                      setValueAs: (v) =>
                        typeof v === "string" ? v.trim().toUpperCase() : v,
                    })}
                    onChange={(e) => {
                      const next = e.target.value.toUpperCase();
                      setValue("featureCode", next, { shouldValidate: false });
                      lastAutoFeatureCode.current = "__user_edited__";
                    }}
                    placeholder="VD: TICKET_DISEASE_CREDITS"
                    aria-invalid={
                      Boolean(errors.featureCode) ||
                      Boolean(featureCodeConflict) ||
                      featureCodeFormatInvalid
                    }
                    className="font-mono uppercase"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Gợi ý:
                    </span>
                    {suggestionChips.map((code) => {
                      const taken = activeFeatureCodeMap.get(code);
                      const takenBySelf = taken && taken.id === category?.id;
                      const isActive = watchedFeatureCode === code;
                      const isTakenByOther = taken && !takenBySelf;
                      return (
                        <button
                          key={code}
                          type="button"
                          disabled={Boolean(isTakenByOther)}
                          onClick={() => {
                            setValue("featureCode", code, {
                              shouldValidate: true,
                            });
                            lastAutoFeatureCode.current = "__user_edited__";
                          }}
                          className={`rounded-md border px-2 py-0.5 text-xs font-mono transition-colors ${
                            isActive
                              ? "border-primary bg-primary/10 text-primary"
                              : isTakenByOther
                                ? "border-destructive/30 bg-destructive/5 text-destructive/60 cursor-not-allowed line-through"
                                : "border-border bg-muted/30 hover:bg-muted"
                          }`}
                          title={
                            isTakenByOther
                              ? `Đã dùng bởi danh mục "${taken!.name}"`
                              : "Bấm để áp dụng"
                          }
                        >
                          {code}
                        </button>
                      );
                    })}
                  </div>
                  {errors.featureCode ? (
                    <p className="text-destructive text-xs">
                      {errors.featureCode.message}
                    </p>
                  ) : featureCodeConflict ? (
                    <p className="text-destructive text-xs">
                      Feature code này đang được danh mục đang hoạt động{" "}
                      <strong>"{featureCodeConflict.name}"</strong> (
                      <code>{featureCodeConflict.code}</code>) sử dụng. Hãy
                      chọn mã khác hoặc vô hiệu hoá danh mục đó trước.
                    </p>
                  ) : featureCodeFormatInvalid ? (
                    <p className="text-destructive text-xs">
                      Sai định dạng — phải in hoa, bắt đầu bằng chữ cái, 3-64
                      ký tự (A-Z, 0-9, _).
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Mỗi danh mục nên có Feature code riêng. Mã chuẩn dạng{" "}
                      <code>TICKET_*_CREDITS</code>.
                      {isEdit && (
                        <span className="block mt-0.5">
                          Chỉ sửa được khi chưa có ticket nào dùng danh mục
                          này.
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
            <div className="space-y-0.5 flex-1">
              <p className="text-sm font-medium">Cho phép mua lẻ</p>
              <p className="text-xs text-muted-foreground">
                Trừ vào pool credit riêng{" "}
                <code>{category?.creditType ?? previewCreditType}</code> khi
                chủ trang trại mua gói ticket gắn vào danh mục này.
              </p>
            </div>
            <Switch
              id="tc-purchase"
              checked={watch("eligibleForPurchase")}
              onCheckedChange={(v) =>
                setValue("eligibleForPurchase", Boolean(v))
              }
              aria-label="Cho phép mua lẻ"
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
            "Tạo danh mục"
          )}
        </Button>
      </div>
    </form>
  );
}
