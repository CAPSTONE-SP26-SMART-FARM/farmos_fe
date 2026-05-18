import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { isApiErrorResponse, isApiErrorUnprocessableEntityResponse } from "@/lib/utils";
import { useCreateCropSeason } from "@/queries/useCropSeason";
import { useActiveCropCategoryList } from "@/queries/useCropCategory";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateCropSeasonBodySchema,
  type CreateCropSeasonBodyType,
} from "@/types/cropSeason";
import { addDays, format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Field, DatePickerField } from "./Field";
import {
  parseBackendDate,
  getMinPlantDate,
  validateCropSeasonFormDates,
  findCategory,
  sortActiveCategories,
  mapCropSeasonServerError,
} from "./helpers";
import {
  CropCategoryPicker,
  DensityBadge,
  CycleHintLine,
  AreaMismatchWarning,
} from "./CropSeasonFormParts";

export function CreateCropSeasonScreen({
  zoneId,
  zoneName,
  zoneAreaSqm,
  onBack,
}: {
  zoneId: string;
  zoneName?: string;
  zoneAreaSqm?: number | null;
  onBack: () => void;
}) {
  const [show, setShow] = useState(false);
  const { mutateAsync, isPending } = useCreateCropSeason();
  const { data: catData } = useActiveCropCategoryList();
  const categories = sortActiveCategories(catData?.data?.data);

  const defaultArea =
    Number.isFinite(zoneAreaSqm) && (zoneAreaSqm as number) > 0
      ? (zoneAreaSqm as number)
      : undefined;

  const form = useForm<CreateCropSeasonBodyType>({
    resolver: zodResolver(CreateCropSeasonBodySchema),
    defaultValues: {
      zoneId,
      cropCategoryId: "",
      cropName: "",
      plantDate: "",
      expectedHarvestDate: "",
      totalAreaSqm: defaultArea,
    },
  });
  useClearServerFieldErrors(form);

  const plantDateValue = form.watch("plantDate");
  const expectedHarvestDateValue = form.watch("expectedHarvestDate");
  const cropCategoryIdValue = form.watch("cropCategoryId");
  const totalAreaSqmValue = form.watch("totalAreaSqm");
  const plantCountValue = form.watch("plantCount");

  const minPlantDate = getMinPlantDate();
  const parsedPlantDate = parseBackendDate(plantDateValue);
  const minExpectedHarvestDate = parsedPlantDate
    ? addDays(parsedPlantDate, 1)
    : undefined;

  const selectedCategory = findCategory(categories, cropCategoryIdValue);

  // Tự gợi ý ngày thu hoạch theo chu kỳ điển hình của loại cây — chỉ khi
  // user chưa tự chỉnh tay.
  const harvestTouchedRef = useRef(false);
  useEffect(() => {
    if (harvestTouchedRef.current) return;
    if (!parsedPlantDate || !selectedCategory?.defaultCycleDays) return;
    const suggested = addDays(parsedPlantDate, selectedCategory.defaultCycleDays);
    form.setValue("expectedHarvestDate", format(suggested, "yyyy-MM-dd"), {
      shouldDirty: false,
      shouldValidate: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantDateValue, cropCategoryIdValue, selectedCategory?.defaultCycleDays]);

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

    if (dateErrors.plantDate)
      form.setError("plantDate", { type: "manual", message: dateErrors.plantDate });
    if (dateErrors.expectedHarvestDate)
      form.setError("expectedHarvestDate", { type: "manual", message: dateErrors.expectedHarvestDate });
    if (dateErrors.plantDate || dateErrors.expectedHarvestDate) return;

    try {
      await mutateAsync(data);
      handleBack();
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse<CreateCropSeasonBodyType>(error)) {
        const mapped = mapCropSeasonServerError(
          error.response!.data.errors as Array<{
            field?: string;
            message?: string;
          }>,
        );
        handleApiErrorUnprocessentity<CreateCropSeasonBodyType>(
          mapped,
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
            <>: <span className="font-medium text-foreground">{zoneName}</span></>
          ) : null}
          {defaultArea != null && (
            <> (diện tích {defaultArea.toLocaleString("vi-VN")} m²)</>
          )}
          .
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin mùa vụ</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* ── Phần 1: Cây trồng ─────────────────────────────────────── */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Cây trồng
              </h3>

              <Controller
                name="cropCategoryId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <CropCategoryPicker
                    value={field.value}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              </div>
            </section>

            {/* ── Phần 2: Thời gian ─────────────────────────────────────── */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Thời gian
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      onChange={(v) => {
                        harvestTouchedRef.current = true;
                        field.onChange(v);
                      }}
                      minDate={minExpectedHarvestDate}
                      helperText={
                        selectedCategory?.defaultCycleDays
                          ? `Gợi ý: ${selectedCategory.defaultCycleDays} ngày sau ngày trồng`
                          : minExpectedHarvestDate
                            ? `Sau ngày ${format(parsedPlantDate!, "dd/MM/yyyy")}`
                            : "Chọn ngày trồng trước"
                      }
                    />
                  )}
                />
              </div>

              <CycleHintLine
                plantDate={plantDateValue}
                expectedHarvestDate={expectedHarvestDateValue}
                category={selectedCategory}
              />
            </section>

            {/* ── Phần 3: Quy mô ────────────────────────────────────────── */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Quy mô trồng
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field
                  label="Diện tích trồng (m²) *"
                  error={form.formState.errors.totalAreaSqm?.message}
                >
                  <Input
                    type="number"
                    step="0.01"
                    min={0.01}
                    placeholder="VD: 100"
                    {...form.register("totalAreaSqm", { valueAsNumber: true })}
                    autoComplete="off"
                  />
                  {defaultArea != null && (
                    <p className="text-xs text-muted-foreground">
                      Mặc định = diện tích khu vực ({defaultArea.toLocaleString("vi-VN")} m²).
                      Sửa lại nếu chỉ trồng trên một phần.
                    </p>
                  )}
                </Field>
                <Field
                  label="Số lượng cây"
                  error={form.formState.errors.plantCount?.message}
                >
                  <Input
                    type="number"
                    min={1}
                    placeholder="VD: 300"
                    {...form.register("plantCount", { valueAsNumber: true })}
                    autoComplete="off"
                  />
                </Field>
              </div>

              <AreaMismatchWarning
                totalAreaSqm={totalAreaSqmValue}
                zoneAreaSqm={zoneAreaSqm}
              />

              <div className="flex flex-wrap gap-2">
                <DensityBadge
                  totalAreaSqm={totalAreaSqmValue}
                  plantCount={plantCountValue}
                  category={selectedCategory}
                  onSuggestCount={(count) =>
                    form.setValue("plantCount", count, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
              </div>
            </section>

            {/* ── Phần 4: Ghi chú ───────────────────────────────────────── */}
            <section className="space-y-2">
              <Field label="Ghi chú">
                <Textarea
                  {...form.register("notes")}
                  rows={2}
                  placeholder="Ghi chú thêm (tuỳ chọn)"
                  className="resize-none"
                />
              </Field>
            </section>

            <p className="text-xs text-muted-foreground">
              Sau khi lưu, hệ thống sẽ tự kiểm tra mật độ cây/m² và chu kỳ vụ
              theo loại cây đã chọn.
            </p>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isPending}
              >
                Huỷ
              </Button>
              <Button type="submit" disabled={isPending}>
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
