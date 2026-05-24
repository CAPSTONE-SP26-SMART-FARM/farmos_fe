import { Button } from "@/components/ui/button";
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
import {
  COMMON_HARVEST_UNITS,
  isPresetHarvestUnit,
} from "@/constants/harvestUnits";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import {
  useCreateHarvestRecord,
  useUpdateHarvestRecord,
} from "@/queries/useHarvestRecord";
import {
  CreateHarvestRecordBodySchema,
  type CreateHarvestRecordBodyType,
  type HarvestRecordResType,
  type UpdateHarvestRecordBodyType,
} from "@/schemaValidatation/harvestRecord";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

// Form Sheet dùng chung create / edit cho Harvest Record. Schema 1-1 với BE
// `farm_os_be/src/modules/harvest-record/harvest-record.model.ts`.
//
// Form state lưu `harvestDate` dạng `yyyy-MM-dd` (docs §5.1); service convert
// sang ISO trước khi gửi BE.


interface Props {
  mode: "create" | "edit";
  zoneId: string;
  cropSeasonId: string;
  initialData: HarvestRecordResType | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function HarvestRecordFormSheet({
  mode,
  zoneId,
  cropSeasonId,
  initialData,
  onSuccess,
  onCancel,
}: Props) {
  const createMutation = useCreateHarvestRecord(zoneId);
  const updateMutation = useUpdateHarvestRecord();

  const form = useForm<CreateHarvestRecordBodyType>({
    resolver: zodResolver(CreateHarvestRecordBodySchema),
    defaultValues: {
      cropSeasonId,
      harvestDate: initialData?.harvestDate ?? "",
      quantity: initialData?.quantity ?? (undefined as unknown as number),
      unit: initialData?.unit ?? "",
      qualityGrade: initialData?.qualityGrade ?? "",
      notes: initialData?.notes ?? "",
    },
  });
  useClearServerFieldErrors(form);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = form;

  const isPending =
    createMutation.isPending || updateMutation.isPending || isSubmitting;

  const onSubmit = async (data: CreateHarvestRecordBodyType) => {
    const sanitized: CreateHarvestRecordBodyType = {
      ...data,
      qualityGrade: data.qualityGrade?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
    };

    try {
      if (mode === "create") {
        await createMutation.mutateAsync(sanitized);
        toast.success("Đã tạo bản ghi thu hoạch.");
      } else if (initialData) {
        // Update body khác Create body — không gửi cropSeasonId/milestoneId.
        // BE `.strict()`: optional KHÔNG nullable → clear field = undefined
        // (bị JSON.stringify bỏ qua), KHÔNG gửi null.
        const updateBody: UpdateHarvestRecordBodyType = {
          harvestDate: sanitized.harvestDate,
          quantity: sanitized.quantity,
          unit: sanitized.unit,
          qualityGrade: sanitized.qualityGrade,
          notes: sanitized.notes,
        };
        await updateMutation.mutateAsync({
          id: initialData.id,
          body: updateBody,
        });
        toast.success("Đã cập nhật bản ghi thu hoạch.");
      }
      onSuccess();
    } catch (error) {
      if (
        isApiErrorUnprocessableEntityResponse<CreateHarvestRecordBodyType>(error)
      ) {
        handleApiErrorUnprocessentity<CreateHarvestRecordBodyType>(
          error.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }
      if (isApiErrorResponse(error)) {
        toast.error(
          error.response?.data.message ?? getApiErrorMessageVi(error),
        );
        return;
      }
      toast.error("Đã có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  // FE-only: chặn chọn ngày trong tương lai.
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col flex-1 overflow-hidden"
    >
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Hidden cropSeasonId — bind sẵn từ context. BE enforce phải thuộc zone. */}
        <input
          type="hidden"
          {...register("cropSeasonId")}
        />

        {/* Ngày thu hoạch */}
        <Controller
          name="harvestDate"
          control={control}
          render={({ field, fieldState }) => (
            <DatePickerField
              label="Ngày thu hoạch *"
              value={field.value ?? ""}
              onChange={field.onChange}
              error={fieldState.error?.message}
              maxDate={today}
              placeholder="Chọn ngày thu hoạch"
            />
          )}
        />

        <Separator />

        {/* Sản lượng + Đơn vị */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-1">
            <Label htmlFor="hr-quantity">
              Sản lượng <span className="text-destructive">*</span>
            </Label>
            <Input
              id="hr-quantity"
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              {...register("quantity", {
                setValueAs: (v) =>
                  v === "" || v === null || v === undefined
                    ? (undefined as unknown as number)
                    : Number(v),
              })}
              aria-invalid={Boolean(errors.quantity)}
            />
            {errors.quantity && (
              <p className="text-destructive text-xs">
                {errors.quantity.message}
              </p>
            )}
          </div>

          <Controller
            name="unit"
            control={control}
            render={({ field, fieldState }) => {
              // Giữ giá trị cũ (legacy / custom) hiển thị trong dropdown nếu
              // không trùng preset — tránh edit form silently mất unit.
              const current = field.value?.trim() ?? "";
              const hasCustom = current.length > 0 && !isPresetHarvestUnit(current);

              return (
                <div className="space-y-1">
                  <Label htmlFor="hr-unit">
                    Đơn vị <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="hr-unit"
                      aria-invalid={Boolean(fieldState.error)}
                    >
                      <SelectValue placeholder="Chọn đơn vị" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_HARVEST_UNITS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.label}
                        </SelectItem>
                      ))}
                      {hasCustom && (
                        <SelectItem value={current}>{current}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {fieldState.error && (
                    <p className="text-destructive text-xs">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              );
            }}
          />
        </div>

        {/* Phẩm cấp */}
        <div className="space-y-1">
          <Label htmlFor="hr-grade">Phẩm cấp / chất lượng</Label>
          <Input
            id="hr-grade"
            placeholder="VD: Loại 1, Hạng A, Xuất khẩu..."
            maxLength={50}
            {...register("qualityGrade")}
            aria-invalid={Boolean(errors.qualityGrade)}
          />
          {errors.qualityGrade && (
            <p className="text-destructive text-xs">
              {errors.qualityGrade.message}
            </p>
          )}
        </div>

        {/* Ghi chú */}
        <div className="space-y-1">
          <Label htmlFor="hr-notes">Ghi chú</Label>
          <Textarea
            id="hr-notes"
            rows={3}
            placeholder="Thông tin bổ sung về đợt thu hoạch..."
            {...register("notes")}
            aria-invalid={Boolean(errors.notes)}
          />
          {errors.notes && (
            <p className="text-destructive text-xs">{errors.notes.message}</p>
          )}
        </div>
      </div>

      {/* Footer sticky */}
      <div className="border-t bg-background px-6 py-3 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Huỷ
        </Button>
        <Button
          type="submit"
          disabled={isPending}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Tạo bản ghi" : "Cập nhật"}
        </Button>
      </div>
    </form>
  );
}
