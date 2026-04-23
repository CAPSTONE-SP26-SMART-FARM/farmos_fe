import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import { useSubscriptionCancel } from "@/queries/useSubscription";
import { CancelSubscriptionBodySchema } from "@/schemaValidatation/subscription";

const CANCEL_REASON_OPTIONS = [
  { value: "TOO_EXPENSIVE", label: "Quá đắt" },
  { value: "MISSING_FEATURES", label: "Thiếu tính năng cần thiết" },
  { value: "NOT_USING", label: "Không dùng nữa" },
  { value: "SWITCHING_PLAN", label: "Chuyển sang gói khác" },
  { value: "OTHER", label: "Lý do khác" },
] as const;

const LOCAL_SCHEMA = z
  .object({
    reasonCode: z.enum([
      "TOO_EXPENSIVE",
      "MISSING_FEATURES",
      "NOT_USING",
      "SWITCHING_PLAN",
      "OTHER",
    ]),
    cancelReason: CancelSubscriptionBodySchema.shape.cancelReason,
  })
  .strict();

type LocalFormType = z.infer<typeof LOCAL_SCHEMA>;

interface CancelSubscriptionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
  onCancelled?: () => void;
}

function CancelSubscriptionSheet({
  open,
  onOpenChange,
  subscriptionId,
  onCancelled,
}: CancelSubscriptionSheetProps) {
  const form = useForm<LocalFormType>({
    resolver: zodResolver(LOCAL_SCHEMA),
    defaultValues: {
      reasonCode: "OTHER",
      cancelReason: "",
    },
  });

  useClearServerFieldErrors(form);

  const cancelMutation = useSubscriptionCancel();

  const onSubmit = async (values: LocalFormType) => {
    const reasonLabel =
      CANCEL_REASON_OPTIONS.find((o) => o.value === values.reasonCode)?.label ??
      "";
    const composed = [reasonLabel, values.cancelReason?.trim()]
      .filter(Boolean)
      .join(" — ");

    try {
      await cancelMutation.mutateAsync({
        id: subscriptionId,
        data: { cancelReason: composed || undefined },
      });
      toast.success("Đã hủy gói đăng ký.");
      form.reset({ reasonCode: "OTHER", cancelReason: "" });
      onOpenChange(false);
      onCancelled?.();
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse<LocalFormType>(error)) {
        handleApiErrorUnprocessentity<LocalFormType>(
          error.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }
      if (isApiErrorResponse(error)) {
        toast.error(error.response?.data.message ?? "Hủy đăng ký thất bại.");
        return;
      }
      toast.error(getApiErrorMessageVi(error, "Hủy đăng ký thất bại."));
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Hủy gói đăng ký</SheetTitle>
          <SheetDescription>
            Cho chúng tôi biết lý do để cải thiện dịch vụ. Gói sẽ bị hủy ngay
            sau khi xác nhận.
          </SheetDescription>
        </SheetHeader>

        <form
          className="space-y-4 px-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <Controller
            name="reasonCode"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="cancel-reason-code">Lý do</FieldLabel>
                <FieldContent>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="cancel-reason-code">
                      <SelectValue placeholder="Chọn lý do" />
                    </SelectTrigger>
                    <SelectContent>
                      {CANCEL_REASON_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            name="cancelReason"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="cancel-reason-note">
                  Ghi chú thêm (không bắt buộc)
                </FieldLabel>
                <FieldContent>
                  <Textarea
                    id="cancel-reason-note"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Bạn có thể mô tả thêm để chúng tôi cải thiện."
                    rows={4}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </FieldContent>
              </Field>
            )}
          />

          <SheetFooter className="gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Giữ lại gói
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Đang hủy..." : "Xác nhận hủy"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default CancelSubscriptionSheet;
