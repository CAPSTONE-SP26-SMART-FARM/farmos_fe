import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  useCreateCropCategory,
  useUpdateCropCategory,
} from "@/queries/useCropCategory";
import {
  CreateCropCategoryBodySchema,
  UpdateCropCategoryBodySchema,
  type CreateCropCategoryBodyType,
  type CropCategoryType,
  type UpdateCropCategoryBodyType,
} from "@/schemaValidatation/cropCategory";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { Info, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

interface AdminCropCategoryFormPanelProps {
  category?: CropCategoryType;
  onBack: () => void;
}

// Shape gộp create + update để chia sẻ JSX. `code` được lock ở mode edit
// và không gửi đi khi submit update.
type FormShape = {
  code: string;
  name: string;
  scientificName?: string;
  description?: string;
  minPlantingDensity: number;
  maxPlantingDensity: number;
  recommendedDensity?: number;
  defaultCycleDays?: number;
  minAreaSqm?: number;
};

const NUMBER_FIELDS = [
  "minPlantingDensity",
  "maxPlantingDensity",
  "recommendedDensity",
  "defaultCycleDays",
  "minAreaSqm",
] as const;

/** Tự strip optional field rỗng (NaN sau valueAsNumber) trước khi submit. */
function stripUndefinedNumbers<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj };
  NUMBER_FIELDS.forEach((key) => {
    const val = out[key];
    if (typeof val === "number" && Number.isNaN(val)) {
      delete out[key];
    }
    if (val === null) {
      delete out[key];
    }
  });
  return out;
}

export default function AdminCropCategoryFormPanel({
  category,
  onBack,
}: AdminCropCategoryFormPanelProps) {
  const isEdit = !!category;
  const createMutation = useCreateCropCategory();
  const updateMutation = useUpdateCropCategory();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const defaultValues: FormShape = useMemo(
    () => ({
      code: category?.code ?? "",
      name: category?.name ?? "",
      scientificName: category?.scientificName ?? "",
      description: category?.description ?? "",
      minPlantingDensity: category?.minPlantingDensity ?? Number.NaN,
      maxPlantingDensity: category?.maxPlantingDensity ?? Number.NaN,
      recommendedDensity: category?.recommendedDensity ?? undefined,
      defaultCycleDays: category?.defaultCycleDays ?? undefined,
      minAreaSqm: category?.minAreaSqm ?? undefined,
    }),
    [category],
  );

  const form = useForm<FormShape>({
    resolver: zodResolver(
      isEdit ? UpdateCropCategoryBodySchema : CreateCropCategoryBodySchema,
    ) as Resolver<FormShape>,
    defaultValues,
  });
  useClearServerFieldErrors(form);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = form;

  const watchedCode = watch("code");
  const watchedMin = watch("minPlantingDensity");
  const watchedMax = watch("maxPlantingDensity");
  const watchedRecommended = watch("recommendedDensity");
  const watchedCycleDays = watch("defaultCycleDays");

  const cycleExample = useMemo(() => {
    if (
      typeof watchedCycleDays !== "number" ||
      Number.isNaN(watchedCycleDays) ||
      watchedCycleDays <= 0
    ) {
      return null;
    }
    const min = Math.round(watchedCycleDays * 0.5);
    const max = Math.round(watchedCycleDays * 2);
    return { value: watchedCycleDays, min, max };
  }, [watchedCycleDays]);

  // Live density preview để admin thấy nhanh khoảng cho phép
  const minMaxPreview = useMemo(() => {
    const minOk = typeof watchedMin === "number" && !Number.isNaN(watchedMin);
    const maxOk = typeof watchedMax === "number" && !Number.isNaN(watchedMax);
    if (!minOk || !maxOk) return null;
    if (watchedMin > watchedMax) return "invalid";
    if (
      typeof watchedRecommended === "number" &&
      !Number.isNaN(watchedRecommended) &&
      (watchedRecommended < watchedMin || watchedRecommended > watchedMax)
    ) {
      return "recommendedOutOfRange";
    }
    return "ok";
  }, [watchedMin, watchedMax, watchedRecommended]);

  // Diễn giải mật độ dưới dạng "số cây trên 100 m²" để admin dễ hình dung
  // (số thập phân kiểu 0.3 cây/m² rất khó cảm nhận). Bonus: với cây thưa
  // (density < 1) còn quy ra "trung bình mỗi cây cần X m² đất".
  const densityNarrative = useMemo(() => {
    if (minMaxPreview !== "ok") return null;
    const plantsPer100 = (d: number) =>
      new Intl.NumberFormat("vi-VN").format(Math.round(d * 100));
    const hasRecommended =
      typeof watchedRecommended === "number" &&
      !Number.isNaN(watchedRecommended);

    // Sparse crop (cây thưa) — quy ra m² trên một cây cho dễ tưởng tượng.
    const referenceDensity = hasRecommended
      ? watchedRecommended
      : (watchedMin + watchedMax) / 2;
    const sparseHint =
      referenceDensity > 0 && referenceDensity < 1
        ? {
            min: (1 / watchedMax).toFixed(1),
            max: (1 / watchedMin).toFixed(1),
          }
        : null;

    return {
      minOn100: plantsPer100(watchedMin),
      maxOn100: plantsPer100(watchedMax),
      recommendedOn100: hasRecommended
        ? plantsPer100(watchedRecommended)
        : null,
      sparseHint,
    };
  }, [minMaxPreview, watchedMin, watchedMax, watchedRecommended]);

  const onSubmit = async (data: FormShape) => {
    const cleaned = stripUndefinedNumbers(data);
    try {
      if (isEdit && category) {
        const body: UpdateCropCategoryBodyType = {
          name: cleaned.name,
          scientificName: cleaned.scientificName || null,
          description: cleaned.description || null,
          minPlantingDensity: cleaned.minPlantingDensity,
          maxPlantingDensity: cleaned.maxPlantingDensity,
          recommendedDensity: cleaned.recommendedDensity ?? null,
          defaultCycleDays: cleaned.defaultCycleDays ?? null,
          minAreaSqm: cleaned.minAreaSqm ?? null,
        };
        await updateMutation.mutateAsync({ id: category.id, body });
        toast.success("Đã cập nhật loại cây trồng.");
      } else {
        const body: CreateCropCategoryBodyType = {
          code: cleaned.code,
          name: cleaned.name,
          scientificName: cleaned.scientificName || undefined,
          description: cleaned.description || undefined,
          minPlantingDensity: cleaned.minPlantingDensity,
          maxPlantingDensity: cleaned.maxPlantingDensity,
          recommendedDensity: cleaned.recommendedDensity,
          defaultCycleDays: cleaned.defaultCycleDays,
          minAreaSqm: cleaned.minAreaSqm,
        };
        await createMutation.mutateAsync(body);
        toast.success("Đã tạo loại cây trồng mới.");
      }
      onBack();
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 422) {
        handleApiErrorUnprocessentity(err.response.data.errors, form.setError, {
          getValues: form.getValues,
        });
      } else {
        toast.error(getApiErrorMessageVi(err));
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
      {/* ── Section 1: Thông tin cơ bản ───────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cc-code">
                Mã loại cây <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cc-code"
                {...register("code", {
                  setValueAs: (v) =>
                    typeof v === "string" ? v.trim().toUpperCase() : v,
                })}
                placeholder="VD: TOMATO"
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
                  Mã viết liền, không dấu, dùng chữ in hoa, số, dấu gạch dưới
                  hoặc gạch ngang — từ 2 đến 64 ký tự. Sau khi tạo sẽ không thể
                  sửa lại.
                </p>
              )}
              {isEdit && (
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs flex items-center gap-1.5">
                  <Info className="h-3 w-3" />
                  <span className="font-mono">{watchedCode}</span>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cc-name">
                Tên hiển thị <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cc-name"
                {...register("name")}
                placeholder="VD: Cà chua"
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
            <Label htmlFor="cc-scientific">Tên khoa học</Label>
            <Input
              id="cc-scientific"
              {...register("scientificName")}
              placeholder="VD: Solanum lycopersicum"
              aria-invalid={Boolean(errors.scientificName)}
            />
            {errors.scientificName && (
              <p className="text-destructive text-xs">
                {errors.scientificName.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cc-description">Mô tả</Label>
            <Textarea
              id="cc-description"
              {...register("description")}
              rows={3}
              placeholder="Mô tả ngắn về loại cây (đặc tính, mùa thích hợp, lưu ý...)..."
            />
          </div>

          {isEdit && category && (
            <div className="flex flex-wrap gap-2 rounded-md border bg-muted/40 p-3">
              <Badge variant="secondary">Mã: {category.code}</Badge>
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

      {/* ── Section 2: Mật độ (bắt buộc) ──────────────────────────── */}
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Mật độ trồng cho phép</CardTitle>
          <p className="text-xs text-muted-foreground">
            Số cây có thể trồng trên một mét vuông đất. Có thể nhập số thập phân
            (ví dụ <strong>0,3</strong>) cho cây thân lớn cần khoảng cách rộng
            như thanh long, dưa hấu.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="cc-minDensity">
                Trồng thưa nhất <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="cc-minDensity"
                  type="number"
                  step="any"
                  min={0}
                  {...register("minPlantingDensity", { valueAsNumber: true })}
                  aria-invalid={Boolean(errors.minPlantingDensity)}
                  className="pr-16"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground font-medium">
                  cây/m²
                </span>
              </div>
              {errors.minPlantingDensity && (
                <p className="text-destructive text-xs">
                  {errors.minPlantingDensity.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cc-maxDensity">
                Trồng dày nhất <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="cc-maxDensity"
                  type="number"
                  step="any"
                  min={0}
                  {...register("maxPlantingDensity", { valueAsNumber: true })}
                  aria-invalid={Boolean(errors.maxPlantingDensity)}
                  className="pr-16"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground font-medium">
                  cây/m²
                </span>
              </div>
              {errors.maxPlantingDensity && (
                <p className="text-destructive text-xs">
                  {errors.maxPlantingDensity.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cc-recommended">Đề xuất</Label>
              <div className="relative">
                <Input
                  id="cc-recommended"
                  type="number"
                  step="any"
                  min={0}
                  {...register("recommendedDensity", { valueAsNumber: true })}
                  aria-invalid={Boolean(errors.recommendedDensity)}
                  placeholder="(tuỳ chọn)"
                  className="pr-16"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground font-medium">
                  cây/m²
                </span>
              </div>
              {errors.recommendedDensity && (
                <p className="text-destructive text-xs">
                  {errors.recommendedDensity.message}
                </p>
              )}
            </div>
          </div>

          {minMaxPreview === "invalid" && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              Mức trồng dày nhất phải lớn hơn hoặc bằng mức trồng thưa nhất.
            </div>
          )}
          {minMaxPreview === "recommendedOutOfRange" && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Mật độ đề xuất nên nằm giữa mức trồng thưa nhất và trồng dày nhất
              đã thiết lập ở trên.
            </div>
          )}
          {minMaxPreview === "ok" && densityNarrative && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-2">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                Thông tin
              </p>
              <p className="text-xs">
                Trên một thửa đất <strong>100 m²</strong> (khoảng 10 m × 10 m),
                loại cây này có thể trồng:
              </p>
              <ul className="ml-4 list-disc text-xs space-y-0.5">
                <li>
                  Trồng thưa nhất:{" "}
                  <strong>{densityNarrative.minOn100} cây</strong>
                </li>
                <li>
                  Trồng dày nhất:{" "}
                  <strong>{densityNarrative.maxOn100} cây</strong>
                </li>
                {densityNarrative.recommendedOn100 && (
                  <li>
                    Đề xuất:{" "}
                    <strong>{densityNarrative.recommendedOn100} cây</strong>
                  </li>
                )}
              </ul>
              {densityNarrative.sparseHint && (
                <p className="text-xs text-muted-foreground">
                  Tương đương: trung bình mỗi cây cần khoảng{" "}
                  <strong>
                    {densityNarrative.sparseHint.min} –{" "}
                    {densityNarrative.sparseHint.max} m²
                  </strong>{" "}
                  đất xung quanh.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Khi quản lý tạo vụ mùa, hệ thống sẽ chỉ chấp nhận số cây trồng
                nằm trong khoảng này.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 3: Chu kỳ & diện tích (tuỳ chọn) ──────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Chu kỳ & diện tích (tuỳ chọn)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cc-cycleDays">Chu kỳ mặc định (ngày)</Label>
              <Input
                id="cc-cycleDays"
                type="number"
                step={1}
                min={1}
                {...register("defaultCycleDays", { valueAsNumber: true })}
                aria-invalid={Boolean(errors.defaultCycleDays)}
                placeholder="VD: 90"
              />
              {errors.defaultCycleDays ? (
                <p className="text-destructive text-xs">
                  {errors.defaultCycleDays.message}
                </p>
              ) : cycleExample ? (
                <p className="text-xs text-muted-foreground">
                  Số ngày trung bình từ lúc trồng đến lúc thu hoạch. Với chu kỳ{" "}
                  <strong>{cycleExample.value}</strong> ngày, khi tạo vụ mùa cho
                  loại cây này, hệ thống chỉ chấp nhận đặt thời gian thu hoạch
                  trong khoảng <strong>{cycleExample.min}</strong> đến{" "}
                  <strong>{cycleExample.max}</strong> ngày sau khi trồng.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Số ngày trung bình từ lúc trồng đến lúc thu hoạch. Hệ thống sẽ
                  cảnh báo nếu vụ mùa được đặt thời gian quá ngắn hoặc quá dài
                  so với chu kỳ chuẩn. Có thể bỏ trống nếu loại cây không có chu
                  kỳ cố định.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cc-minArea">Diện tích tối thiểu (m²)</Label>
              <Input
                id="cc-minArea"
                type="number"
                step="any"
                min={0}
                {...register("minAreaSqm", { valueAsNumber: true })}
                aria-invalid={Boolean(errors.minAreaSqm)}
                placeholder="(tuỳ chọn)"
              />
              {errors.minAreaSqm && (
                <p className="text-destructive text-xs">
                  {errors.minAreaSqm.message}
                </p>
              )}
            </div>
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
        <Button
          type="submit"
          disabled={isPending}
          className="min-w-32"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : isEdit ? (
            "Lưu thay đổi"
          ) : (
            "Tạo loại cây"
          )}
        </Button>
      </div>
    </form>
  );
}
