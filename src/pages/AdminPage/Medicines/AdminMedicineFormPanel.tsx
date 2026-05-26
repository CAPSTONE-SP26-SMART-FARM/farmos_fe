import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import {
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import { useCreateMedicine, useUpdateMedicine } from "@/queries/useMedicine";
import {
  CreateMedicineBodySchema,
  MEDICINE_FORM_LABEL,
  MedicineFormSchema,
  type CreateMedicineBodyType,
  type MedicineFormType,
  type MedicineResType,
  type UpdateMedicineBodyType,
} from "@/schemaValidatation/medicine";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

// Form dùng chung create / edit. Schema 1-1 với BE
// `farm_os_be/src/modules/medicine/medicine.model.ts` — tuyệt đối không thêm
// field thừa (BE `.strict()` → 422 UNRECOGNIZED).

interface AdminMedicineFormPanelProps {
  mode: "create" | "edit";
  initialData: MedicineResType | null;
  onSuccess: () => void;
  onCancel: () => void;
  /** Khi A2 freetext stats prefill name → khoá field code/name + auto-suggest code. */
  prefillName?: string | null;
}

const FORM_OPTIONS = MedicineFormSchema.options;

// Đơn vị thường gặp cho thuốc BVTV / phân bón.
const UNIT_OPTIONS = [
  { value: "ml", label: "ml (mililít)" },
  { value: "L", label: "L (lít)" },
  { value: "g", label: "g (gram)" },
  { value: "kg", label: "kg (kilogram)" },
  { value: "gói", label: "Gói" },
  { value: "chai", label: "Chai" },
  { value: "bao", label: "Bao" },
] as const;

export default function AdminMedicineFormPanel({
  mode,
  initialData,
  onSuccess,
  onCancel,
  prefillName,
}: AdminMedicineFormPanelProps) {
  const createMutation = useCreateMedicine();
  const updateMutation = useUpdateMedicine();

  const form = useForm<CreateMedicineBodyType>({
    resolver: zodResolver(CreateMedicineBodySchema),
    defaultValues: {
      code: initialData?.code ?? "",
      name: initialData?.name ?? prefillName ?? "",
      scientificName: initialData?.scientificName ?? "",
      form: initialData?.form ?? ("OTHER" as MedicineFormType),
      unit: initialData?.unit ?? "",
      contraindications: initialData?.contraindications ?? "",
      sideEffects: initialData?.sideEffects ?? "",
      withdrawalPeriodDays: initialData?.withdrawalPeriodDays ?? undefined,
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

  const onSubmit = async (data: CreateMedicineBodyType) => {
    // Trim chuỗi rỗng → undefined cho field optional. BE strict không nuốt
    // được "" cho field optional có max constraint.
    const sanitized: CreateMedicineBodyType = {
      ...data,
      scientificName: data.scientificName?.trim() || undefined,
      contraindications: data.contraindications?.trim() || undefined,
      sideEffects: data.sideEffects?.trim() || undefined,
    };

    try {
      if (mode === "create") {
        await createMutation.mutateAsync(sanitized);
        toast.success("Đã tạo thuốc mới.");
      } else if (initialData) {
        // Update body khác Create body (không có `code`). Cast subset.
        const updateBody: UpdateMedicineBodyType = {
          name: sanitized.name,
          scientificName: sanitized.scientificName ?? null,
          form: sanitized.form,
          unit: sanitized.unit,
          contraindications: sanitized.contraindications ?? null,
          sideEffects: sanitized.sideEffects ?? null,
          withdrawalPeriodDays: sanitized.withdrawalPeriodDays ?? null,
        };
        await updateMutation.mutateAsync({
          id: initialData.id,
          body: updateBody,
        });
        toast.success("Đã cập nhật thuốc.");
      }
      onSuccess();
    } catch (error) {
      if (
        isApiErrorUnprocessableEntityResponse<CreateMedicineBodyType>(error)
      ) {
        handleApiErrorUnprocessentity<CreateMedicineBodyType>(
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-4">
        {/* Read-only badge — chỉ ở mode edit */}
        {mode === "edit" && initialData && (
          <div className="rounded-md border bg-muted/50 p-3 space-y-2">
            <p className="text-xs text-muted-foreground font-medium">
              Thông tin hệ thống
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Mã: {initialData.code}</Badge>
              <Badge variant="secondary">
                Cập nhật:{" "}
                {new Date(initialData.updatedAt).toLocaleString("vi-VN")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Mã thuốc không thể thay đổi sau khi tạo.
            </p>
          </div>
        )}

        {/* Mã + Tên + Hoạt chất khoa học */}
        {mode === "create" && (
          <div className="space-y-1">
            <Label htmlFor="med-code">
              Mã thuốc <span className="text-destructive">*</span>
            </Label>
            <Input
              id="med-code"
              placeholder="VD: AMOX-500"
              {...register("code")}
              aria-invalid={Boolean(errors.code)}
            />
            {errors.code ? (
              <p className="text-destructive text-xs">{errors.code.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Định danh duy nhất của thuốc, không thay đổi được sau khi tạo.
              </p>
            )}
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="med-name">
            Tên thuốc <span className="text-destructive">*</span>
          </Label>
          <Input
            id="med-name"
            placeholder="VD: Amoxicillin 500mg"
            {...register("name")}
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && (
            <p className="text-destructive text-xs">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="med-scientificName">Tên khoa học</Label>
          <Input
            id="med-scientificName"
            placeholder="VD: Amoxicillin trihydrate"
            {...register("scientificName")}
            aria-invalid={Boolean(errors.scientificName)}
          />
          {errors.scientificName && (
            <p className="text-destructive text-xs">
              {errors.scientificName.message}
            </p>
          )}
        </div>

        <Separator />

        {/* Dạng + Đơn vị */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="med-form">
              Dạng <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="form"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="med-form">
                    <SelectValue placeholder="Chọn dạng thuốc" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORM_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt}
                        value={opt}
                      >
                        {MEDICINE_FORM_LABEL[opt]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.form && (
              <p className="text-destructive text-xs">{errors.form.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="med-unit">
              Đơn vị <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="unit"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="med-unit">
                    <SelectValue placeholder="Chọn đơn vị" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.unit && (
              <p className="text-destructive text-xs">{errors.unit.message}</p>
            )}
          </div>
        </div>

        {/* Số ngày ngừng thuốc */}
        <div className="space-y-1">
          <Label htmlFor="med-withdrawal">
            Số ngày ngừng thuốc trước thu hoạch
          </Label>
          <div className="relative">
            <Input
              id="med-withdrawal"
              type="number"
              min={0}
              step={1}
              placeholder="0"
              {...register("withdrawalPeriodDays", {
                setValueAs: (v) =>
                  v === "" || v === null || v === undefined
                    ? undefined
                    : Number(v),
              })}
              aria-invalid={Boolean(errors.withdrawalPeriodDays)}
              className="pr-14"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground font-medium">
              ngày
            </span>
          </div>
          {errors.withdrawalPeriodDays ? (
            <p className="text-destructive text-xs">
              {errors.withdrawalPeriodDays.message}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Đơn thuốc sẽ hiển thị cảnh báo cho người dùng khi giá trị này
              lớn hơn 0.
            </p>
          )}
        </div>

        <Separator />

        {/* Chống chỉ định + Tác dụng phụ */}
        <div className="space-y-1">
          <Label htmlFor="med-contraindications">Chống chỉ định</Label>
          <Textarea
            id="med-contraindications"
            placeholder="Tình huống/đối tượng không được dùng thuốc này..."
            rows={3}
            {...register("contraindications")}
            aria-invalid={Boolean(errors.contraindications)}
          />
          {errors.contraindications && (
            <p className="text-destructive text-xs">
              {errors.contraindications.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="med-sideEffects">Tác dụng phụ</Label>
          <Textarea
            id="med-sideEffects"
            placeholder="Các phản ứng phụ có thể gặp..."
            rows={3}
            {...register("sideEffects")}
            aria-invalid={Boolean(errors.sideEffects)}
          />
          {errors.sideEffects && (
            <p className="text-destructive text-xs">
              {errors.sideEffects.message}
            </p>
          )}
        </div>
      </div>

      <Separator />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Huỷ
        </Button>
        <Button type="submit" disabled={isPending} className="min-w-32">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Tạo thuốc" : "Cập nhật"}
        </Button>
      </div>
    </form>
  );
}
