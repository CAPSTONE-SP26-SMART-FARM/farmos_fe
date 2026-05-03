import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useAbandonResolution } from "@/queries/useTicket";
import {
  AbandonTicketBodySchema,
  type AbandonTicketBodyType,
} from "@/schemaValidatation/abandonLog";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, Loader2, RefreshCcw } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface AbandonResolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  /** Hiển thị banner đặc biệt khi modal mở vì WS `ticket.fallback-required`. */
  triggeredByFallback?: boolean;
}

// Modal cho creator chọn FALLBACK_AI hoặc REFUND_TICKET khi bác sĩ im lặng
// (B7). BE body: {resolution, note?} — KHÔNG `reason`.

const RESOLUTION_OPTIONS = [
  {
    value: "FALLBACK_AI" as const,
    title: "Chuyển sang AI xử lý",
    description:
      "Hệ thống dùng AI tạo giải pháp tạm thời. Không tính tiền cho bác sĩ.",
    icon: Bot,
    iconClass: "bg-amber-500/10 text-amber-700",
  },
  {
    value: "REFUND_TICKET" as const,
    title: "Hoàn ticket về quota",
    description:
      "Trả lại lượt ticket vào quota của bạn để tạo ticket mới sau.",
    icon: RefreshCcw,
    iconClass: "bg-emerald-500/10 text-emerald-700",
  },
];

export default function AbandonResolutionModal({
  open,
  onOpenChange,
  ticketId,
  triggeredByFallback,
}: AbandonResolutionModalProps) {
  const abandonMutation = useAbandonResolution(ticketId);

  const form = useForm<AbandonTicketBodyType>({
    resolver: zodResolver(AbandonTicketBodySchema),
    defaultValues: {
      resolution: "FALLBACK_AI",
      note: "",
    },
  });
  useClearServerFieldErrors(form);

  const {
    handleSubmit,
    control,
    register,
    formState: { errors, isSubmitting },
  } = form;

  const isPending = abandonMutation.isPending || isSubmitting;

  const onSubmit = async (data: AbandonTicketBodyType) => {
    const sanitized: AbandonTicketBodyType = {
      ...data,
      note: data.note?.trim() || undefined,
    };
    try {
      await abandonMutation.mutateAsync(sanitized);
      toast.success(
        sanitized.resolution === "FALLBACK_AI"
          ? "Đã chuyển ticket sang AI xử lý."
          : "Đã hoàn ticket về quota.",
      );
      form.reset();
      onOpenChange(false);
    } catch (error) {
      if (
        isApiErrorUnprocessableEntityResponse<AbandonTicketBodyType>(error)
      ) {
        handleApiErrorUnprocessentity<AbandonTicketBodyType>(
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
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) form.reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Xử lý khi không có bác sĩ</DialogTitle>
          <DialogDescription>
            {triggeredByFallback
              ? "Hệ thống phát hiện bác sĩ đã nhận ticket nhưng không xử lý trong thời gian quy định. Vui lòng chọn cách xử lý tiếp theo."
              : "Chọn cách xử lý ticket khi bác sĩ phụ trách không thể tiếp tục."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <Controller
            name="resolution"
            control={control}
            render={({ field }) => (
              <div
                role="radiogroup"
                className="space-y-2"
              >
                {RESOLUTION_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const checked = field.value === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      onClick={() => field.onChange(opt.value)}
                      className={cn(
                        "w-full text-left rounded-md border p-3 transition-colors",
                        checked
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "h-9 w-9 shrink-0 rounded-full flex items-center justify-center",
                            opt.iconClass,
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">{opt.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {opt.description}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "h-4 w-4 rounded-full border-2 mt-1",
                            checked
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/30",
                          )}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          />
          {errors.resolution && (
            <p className="text-destructive text-xs">
              {errors.resolution.message}
            </p>
          )}

          <div className="space-y-1">
            <Label htmlFor="abandon-note">Ghi chú (tuỳ chọn)</Label>
            <Textarea
              id="abandon-note"
              placeholder="Mô tả thêm tình huống nếu cần..."
              rows={3}
              {...register("note")}
              aria-invalid={Boolean(errors.note)}
            />
            {errors.note && (
              <p className="text-destructive text-xs">{errors.note.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Đóng
            </Button>
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
