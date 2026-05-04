import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { isApiErrorResponse, isApiErrorUnprocessableEntityResponse } from "@/lib/utils";
import { useUpdateCropSeason } from "@/queries/useCropSeason";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UpdateCropSeasonBodySchema,
  type UpdateCropSeasonBodyType,
  type CropSeasonType,
} from "@/types/cropSeason";
import { addMonths, format, startOfDay } from "date-fns";
import { useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Field, DatePickerField } from "./Field";
import {
  parseBackendDate,
  getMinPlantDate,
  validateCropSeasonFormDates,
  getCropSeasonEditMode,
  canEdit,
} from "./helpers";

export function UpdateCropSeasonDialog({ season }: { season: CropSeasonType }) {
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

    const payload: UpdateCropSeasonBodyType = planOnlyDisabled
      ? {
          ...(data.actualHarvestDate ? { actualHarvestDate: data.actualHarvestDate } : {}),
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
      if (dateErrors.plantDate)
        form.setError("plantDate", { type: "manual", message: dateErrors.plantDate });
      if (dateErrors.expectedHarvestDate)
        form.setError("expectedHarvestDate", { type: "manual", message: dateErrors.expectedHarvestDate });
      if (dateErrors.plantDate || dateErrors.expectedHarvestDate) return;
    }

    try {
      await mutateAsync(payload);
      setOpen(false);
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse<UpdateCropSeasonBodyType>(error)) {
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="h-3 w-3 mr-1" />
          Sửa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cập nhật mùa vụ</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {planOnlyDisabled && (
            <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
              Các trường kế hoạch đã khóa sau khi phê duyệt. Chỉ có thể cập nhật ghi chú và ngày thu hoạch thực tế.
            </p>
          )}
          <Field label="Tên cây trồng" error={form.formState.errors.cropName?.message}>
            <Input {...form.register("cropName")} autoComplete="off" disabled={planOnlyDisabled} />
          </Field>
          <Field label="Giống / Loại">
            <Input {...form.register("variety")} autoComplete="off" disabled={planOnlyDisabled} />
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
            <Textarea {...form.register("notes")} rows={2} className="resize-none" />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
