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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { getApiErrorMessageVi } from "@/lib/error-message";
import { useListFeatures } from "@/queries/useFeature";
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
import { ArrowLeft, Loader2, Tag } from "lucide-react";
import { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const LIST_PATH = "/dashboard/admin/ticket-categories";
const OPTION_FETCH_LIMIT = 99;
const FALLBACK_TICKET_CODES = [
  "ticket_general",
  "ticket_disease",
  "ticket_nutrition",
  "ticket_reproduction",
  "ticket_emergency",
];

const LEGACY_TO_TICKET_CODE = {
  general: "ticket_general",
  disease: "ticket_disease",
  nutrition: "ticket_nutrition",
  reproduction: "ticket_reproduction",
  emergency: "ticket_emergency",
} as const;

type LegacyCategoryValue = keyof typeof LEGACY_TO_TICKET_CODE;

export default function AdminCreateTicketCategoryPage() {
  const navigate = useNavigate();
  const createMutation = useCreateTicketCategory();
  const featureQuery = useListFeatures({
    page: 1,
    limit: OPTION_FETCH_LIMIT,
    search: "",
  });
  const categoryQuery = useAdminTicketCategoryList({
    page: 1,
    limit: OPTION_FETCH_LIMIT,
    search: "",
  });

  const featureRows = featureQuery.data?.data?.data ?? [];
  const categoryRows = categoryQuery.data?.data?.data ?? [];

  const featureNameMap = useMemo(
    () => new Map(featureRows.map((item) => [item.code, item.name])),
    [featureRows],
  );

  const featureCodeOptions = useMemo(() => {
    const set = new Set<string>(FALLBACK_TICKET_CODES);
    featureRows
      .filter((item) => item.code.startsWith("ticket_"))
      .forEach((item) => set.add(item.code));
    categoryRows.forEach((item) => {
      if (item.featureCode) set.add(item.featureCode);
    });
    return Array.from(set).sort();
  }, [categoryRows, featureRows]);

  const creditTypeOptions = useMemo(() => {
    const set = new Set<string>(FALLBACK_TICKET_CODES);
    categoryRows.forEach((item) => {
      if (item.creditType) set.add(item.creditType);
    });
    return Array.from(set).sort();
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
      featureCode: "ticket_general",
      creditType: "ticket_general",
      legacyCategory: "general",
      legacyTicketType: "general_support",
    },
  });
  useClearServerFieldErrors(form);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = form;

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
            hoa hồng mặc định cho bác sĩ
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
              Mã và tên danh mục là định danh chính. Chọn kỹ vì không thể sửa
              sau khi tạo.
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
                  placeholder="VD: DOCTOR_CONSULT"
                  aria-invalid={Boolean(errors.code)}
                  className="font-mono uppercase"
                />
                {errors.code ? (
                  <p className="text-destructive text-xs">
                    {errors.code.message}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Dùng chữ in hoa, gạch dưới. Không thể sửa sau khi tạo.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">
                  Tên danh mục <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="VD: Tư vấn bác sĩ"
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
              Đơn giá được dùng khi tính hóa đơn ticket. Hoa hồng mặc định áp
              dụng khi không có quy tắc hoa hồng cụ thể nào khớp với bác sĩ.
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
            <CardDescription>
              Bắt buộc chọn để đồng bộ quota subscription ({"featureCode"}) và
              ví credit ({"creditType"}).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="featureCode">
                  Feature code <span className="text-destructive">*</span>
                </Label>
                <Controller
                  control={control}
                  name="featureCode"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="featureCode"
                        aria-invalid={Boolean(errors.featureCode)}
                      >
                        <SelectValue placeholder="Chọn feature code" />
                      </SelectTrigger>
                      <SelectContent>
                        {featureCodeOptions.map((code) => (
                          <SelectItem
                            key={code}
                            value={code}
                          >
                            {code}
                            {featureNameMap.get(code)
                              ? ` — ${featureNameMap.get(code)}`
                              : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.featureCode ? (
                  <p className="text-destructive text-xs">
                    {errors.featureCode.message}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Nên chọn feature có prefix <code>ticket_</code>.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="creditType">
                  Credit type <span className="text-destructive">*</span>
                </Label>
                <Controller
                  control={control}
                  name="creditType"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="creditType"
                        aria-invalid={Boolean(errors.creditType)}
                      >
                        <SelectValue placeholder="Chọn credit type" />
                      </SelectTrigger>
                      <SelectContent>
                        {creditTypeOptions.map((code) => (
                          <SelectItem
                            key={code}
                            value={code}
                          >
                            {code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.creditType ? (
                  <p className="text-destructive text-xs">
                    {errors.creditType.message}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Credit type phải khớp với service package bán lẻ của loại
                    ticket này.
                  </p>
                )}
              </div>
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
                  Ticket danh mục này sẽ được gán tự động cho chủ trang trại khi
                  đăng ký gói dịch vụ có bao gồm loại này.
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
                  Chủ trang trại có thể mua thêm ticket loại này theo đơn lẻ
                  ngoài gói đăng ký.
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

        {/* ── Section 5: Legacy / Tương thích ngược ────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Legacy / Tương thích ngược
            </CardTitle>
            <CardDescription>
              Map danh mục này về enum cũ để hệ thống hiện tại tiếp tục hoạt
              động trong quá trình migration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="legacyCategory">
                  Legacy Category <span className="text-destructive">*</span>
                </Label>
                <Controller
                  control={control}
                  name="legacyCategory"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        const next = v as LegacyCategoryValue;
                        field.onChange(next);
                        const mappedCode = LEGACY_TO_TICKET_CODE[next];
                        setValue("featureCode", mappedCode, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                        setValue("creditType", mappedCode, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                        setValue(
                          "legacyTicketType",
                          next === "emergency" ? "incident" : "general_support",
                          {
                            shouldDirty: true,
                            shouldValidate: true,
                          },
                        );
                      }}
                    >
                      <SelectTrigger id="legacyCategory">
                        <SelectValue placeholder="Chọn loại category cũ..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">
                          general — Tư vấn chung
                        </SelectItem>
                        <SelectItem value="disease">
                          disease — Bệnh tật
                        </SelectItem>
                        <SelectItem value="nutrition">
                          nutrition — Dinh dưỡng
                        </SelectItem>
                        <SelectItem value="reproduction">
                          reproduction — Sinh sản
                        </SelectItem>
                        <SelectItem value="emergency">
                          emergency — Khẩn cấp
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Map sang enum <code>TicketCategory</code> trong hệ thống cũ.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="legacyTicketType">
                  Legacy Ticket Type <span className="text-destructive">*</span>
                </Label>
                <Controller
                  control={control}
                  name="legacyTicketType"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="legacyTicketType">
                        <SelectValue placeholder="Chọn loại ticket cũ..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general_support">
                          general_support — Hỗ trợ chung
                        </SelectItem>
                        <SelectItem value="incident">
                          incident — Sự cố khẩn cấp
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Map sang enum <code>TicketType</code> trong hệ thống cũ.
                </p>
              </div>
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
