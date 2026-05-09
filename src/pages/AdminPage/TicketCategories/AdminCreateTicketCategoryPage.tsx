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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  useAdminTicketCategoryList,
  useCreateTicketCategory,
} from "@/queries/useTicketCategory";
import {
  CreateTicketCategoryBodySchema,
  type CreateTicketCategoryBodyType,
} from "@/schemaValidatation/ticketCategory";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { ArrowLeft, Info, Loader2, Sparkles, Tag } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const LIST_PATH = "/dashboard/admin/ticket-categories";
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

export default function AdminCreateTicketCategoryPage() {
  const navigate = useNavigate();
  const createMutation = useCreateTicketCategory();
  const categoryQuery = useAdminTicketCategoryList({
    page: 1,
    limit: OPTION_FETCH_LIMIT,
    search: "",
  });

  const categoryRows = categoryQuery.data?.data?.data ?? [];

  // BE check `existsAnotherActiveByFeatureCode` → 422
  // `TicketCategoryFeatureCodeConflict`. FE pre-warn để admin biết trước khi
  // submit thay vì chờ BE từ chối.
  const activeFeatureCodeMap = useMemo(() => {
    const map = new Map<string, { name: string; code: string }>();
    categoryRows.forEach((item) => {
      if (item.featureCode && item.isActive) {
        map.set(item.featureCode, { name: item.name, code: item.code });
      }
    });
    return map;
  }, [categoryRows]);

  const form = useForm<CreateTicketCategoryBodyType>({
    resolver: zodResolver(CreateTicketCategoryBodySchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      unitPrice: 0,
      defaultCommissionPercent: 0,
      eligibleForSubscriptionGrant: false,
      eligibleForPurchase: true,
      featureCode: "",
    },
  });
  useClearServerFieldErrors(form);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = form;

  const watchedCode = watch("code");
  const previewCreditType = watchedCode
    ? `ticket_cat_${watchedCode.toLowerCase()}`
    : "ticket_cat_<mã danh mục>";

  const watchedFeatureCode = watch("featureCode");
  const featureCodeConflict = watchedFeatureCode
    ? activeFeatureCodeMap.get(watchedFeatureCode)
    : undefined;

  // Auto-suggest featureCode khi user gõ `code` — chỉ áp dụng khi field
  // featureCode còn rỗng hoặc trùng với suggestion trước đó (tức user chưa
  // tự gõ tay), tránh ghi đè input của user.
  const lastAutoFeatureCode = useRef<string>("");
  useEffect(() => {
    const suggested = deriveFeatureCode(watchedCode ?? "");
    if (!suggested) return;
    const current = form.getValues("featureCode") ?? "";
    if (current === "" || current === lastAutoFeatureCode.current) {
      setValue("featureCode", suggested, { shouldValidate: false });
      lastAutoFeatureCode.current = suggested;
    }
  }, [watchedCode, form, setValue]);

  // Suggestion chips: 5 mã chuẩn + mã derive từ code hiện tại (nếu khác).
  const suggestionChips = useMemo(() => {
    const set = new Set<string>(STANDARD_FEATURE_CODES);
    const derived = deriveFeatureCode(watchedCode ?? "");
    if (derived) set.add(derived);
    return Array.from(set);
  }, [watchedCode]);

  const featureCodeFormatInvalid =
    !!watchedFeatureCode && !FEATURE_CODE_REGEX.test(watchedFeatureCode);

  const onSubmit = async (data: CreateTicketCategoryBodyType) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success("Tạo danh mục ticket thành công.");
      navigate(LIST_PATH);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 422) {
        handleApiErrorUnprocessentity<CreateTicketCategoryBodyType>(
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
              Danh Mục Ticket
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Tạo danh mục mới</BreadcrumbPage>
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
              <Tag className="h-3 w-3" />
              Tạo mới
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Tạo Danh Mục Ticket
          </h1>
          <p className="text-sm text-muted-foreground">
            Danh mục định nghĩa loại dịch vụ ticket, đơn giá tính tiền và tỷ lệ
            hoa hồng mặc định cho bác sĩ.
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
        {/* ── Section 1: Thông tin cơ bản ───────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
            <CardDescription>
              Mã và tên danh mục là định danh chính. Mã không thể sửa sau khi
              tạo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="code">
                  Mã danh mục <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  {...register("code")}
                  placeholder="VD: DISEASE_DIAGNOSIS"
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
                  <p className="font-mono font-medium">{previewCreditType}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">
                  Tên danh mục <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
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
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                {...register("description")}
                rows={3}
                placeholder="Mô tả ngắn về mục đích và phạm vi áp dụng của danh mục này..."
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Section 2: Giá & hoa hồng ─────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Giá & Hoa hồng</CardTitle>
            <CardDescription>
              Đơn giá lock vào ticket khi tạo (snapshot). Hoa hồng mặc định áp
              dụng khi không có quy tắc cụ thể nào khớp với bác sĩ.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="unitPrice">
                  Đơn giá <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="unitPrice"
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
                    Đơn giá cho 1 lượt sử dụng dịch vụ.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="defaultCommissionPercent">
                  Hoa hồng mặc định <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="defaultCommissionPercent"
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
                    Tỷ lệ hoa hồng áp dụng khi không có quy tắc cụ thể.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 3: Liên kết hệ thống ──────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Liên kết hệ thống</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="featureCode">
                Feature code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="featureCode"
                {...register("featureCode", {
                  setValueAs: (v) =>
                    typeof v === "string" ? v.trim().toUpperCase() : v,
                })}
                onChange={(e) => {
                  const next = e.target.value.toUpperCase();
                  setValue("featureCode", next, { shouldValidate: false });
                  // User đã tự gõ → khoá auto-suggest từ code.
                  lastAutoFeatureCode.current = "__user_edited__";
                }}
                placeholder="VD: TICKET_DISEASE_CREDITS hoặc TICKET_12_CREDITS"
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
                  const isActive = watchedFeatureCode === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      disabled={Boolean(taken)}
                      onClick={() => {
                        setValue("featureCode", code, {
                          shouldValidate: true,
                        });
                        lastAutoFeatureCode.current = "__user_edited__";
                      }}
                      className={`rounded-md border px-2 py-0.5 text-xs font-mono transition-colors ${
                        isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : taken
                            ? "border-destructive/30 bg-destructive/5 text-destructive/60 cursor-not-allowed line-through"
                            : "border-border bg-muted/30 hover:bg-muted"
                      }`}
                      title={
                        taken
                          ? `Đã dùng bởi category "${taken.name}"`
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
                  Feature code này đang được category active{" "}
                  <strong>"{featureCodeConflict.name}"</strong> (
                  <code>{featureCodeConflict.code}</code>) sử dụng. Mỗi
                  category cần có featureCode riêng — hãy chọn mã khác (vd{" "}
                  <code>{deriveFeatureCode(watchedCode ?? "")}</code>) hoặc vô
                  hiệu hoá category đó trước.
                </p>
              ) : featureCodeFormatInvalid ? (
                <p className="text-destructive text-xs">
                  Định dạng không hợp lệ — phải UPPERCASE, bắt đầu bằng chữ
                  cái, độ dài 3-64 ký tự (A-Z, 0-9, _).
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Mỗi category nên có featureCode riêng. Mã chuẩn dạng{" "}
                  <code>TICKET_*_CREDITS</code>; với code không chuẩn (vd{" "}
                  <code>TICKET_12</code>), dùng <code>TICKET_12_CREDITS</code>{" "}
                  hoặc tên có ý nghĩa nghiệp vụ.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Section 4: Quyền truy cập ─────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quyền truy cập</CardTitle>
            <CardDescription>
              Kiểm soát cách người dùng có thể nhận ticket thuộc danh mục này.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-0.5 flex-1">
                <p className="text-sm font-medium">Cấp qua gói đăng ký</p>
                <p className="text-xs text-muted-foreground">
                  Trừ vào quota subscription (entitlement match featureCode) khi
                  farmer tạo ticket trên mobile.
                </p>
              </div>
              <Switch
                id="eligibleForSubscriptionGrant"
                checked={watch("eligibleForSubscriptionGrant")}
                onCheckedChange={(v) =>
                  setValue("eligibleForSubscriptionGrant", Boolean(v))
                }
              />
            </div>
            <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-0.5 flex-1">
                <p className="text-sm font-medium">Cho phép mua lẻ</p>
                <p className="text-xs text-muted-foreground">
                  Trừ vào pool credit riêng <code>{previewCreditType}</code> khi
                  owner đã mua ticket bundle bound vào danh mục này.
                </p>
              </div>
              <Switch
                id="eligibleForPurchase"
                checked={watch("eligibleForPurchase")}
                onCheckedChange={(v) =>
                  setValue("eligibleForPurchase", Boolean(v))
                }
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
            className="min-w-32"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tạo...
              </>
            ) : (
              "Tạo danh mục"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
