import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { isApiErrorResponse, isApiErrorUnprocessableEntityResponse } from "@/lib/utils";
import { useCreateCropSeason } from "@/queries/useCropSeason";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateCropSeasonBodySchema,
  type CreateCropSeasonBodyType,
} from "@/types/cropSeason";
import { addMonths, format, startOfDay } from "date-fns";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Field, DatePickerField } from "./Field";
import { parseBackendDate, getMinPlantDate, validateCropSeasonFormDates } from "./helpers";

export function CreateCropSeasonScreen({
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
    defaultValues: { zoneId, cropName: "", plantDate: "", expectedHarvestDate: "" },
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
            <>: <span className="font-medium text-foreground">{zoneName}</span></>
          ) : null}
          .
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin mùa vụ</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <Field label="Tên cây trồng *" error={form.formState.errors.cropName?.message}>
              <Input {...form.register("cropName")} placeholder="Ớt đỏ, cà chua..." autoComplete="off" />
            </Field>

            <Field label="Giống / Loại">
              <Input {...form.register("variety")} placeholder="(tuỳ chọn)" autoComplete="off" />
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
              <Textarea {...form.register("notes")} rows={2} className="resize-none" />
            </Field>

            <p className="text-xs text-muted-foreground">
              * Ngày trồng phải sau hôm nay ít nhất 1 tháng. Ngày thu hoạch phải sau ngày trồng ít nhất 1 tháng.
            </p>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={handleBack} disabled={isPending}>
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
