import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { RATING_TAG_OPTIONS } from "@/constants/ticketQualityLabels";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import { useCloseTicket, useRateTicket } from "@/queries/useTicket";
import {
  SubmitRatingBodySchema,
  type SubmitRatingBodyType,
} from "@/schemaValidatation/rating";
import type { TicketFullResType } from "@/schemaValidatation/ticket";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, CheckCircle, Loader2, Pill, Star } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import StarRating from "./StarRating";

interface CloseAndRateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  ticketFull: TicketFullResType;
}

// Modal 2-step: Step 1 review giải pháp + đơn thuốc, Step 2 đánh giá sao.
// Trên ticket AI (`isAIResolved=true`): ẩn step rate, đi thẳng confirm close.
// BE B6 reject rating cho AI ticket (BR-79).

type Step = "review" | "rate";

export default function CloseAndRateModal({
  open,
  onOpenChange,
  ticketId,
  ticketFull,
}: CloseAndRateModalProps) {
  const isAI = ticketFull.ticket.isAIResolved;
  const [step, setStep] = useState<Step>("review");

  const closeMutation = useCloseTicket();
  const rateMutation = useRateTicket(ticketId);

  // Reset step về "review" mỗi khi mở modal — handle qua onOpenChange ở cuối
  // file (tránh setState-in-effect anti-pattern).

  // Form state cho step 2 (rate). Stars max 5 — BE hard-cap.
  const form = useForm<SubmitRatingBodyType>({
    resolver: zodResolver(SubmitRatingBodySchema),
    defaultValues: {
      stars: 0 as unknown as number, // 0 = chưa chọn; submit sẽ validate ≥1
      feedback: "",
      tags: [],
    },
  });
  useClearServerFieldErrors(form);

  const {
    handleSubmit,
    control,
    register,
    formState: { errors, isSubmitting },
  } = form;

  const isPending =
    closeMutation.isPending || rateMutation.isPending || isSubmitting;

  // Dùng `useWatch` (memoized, react-compiler safe) thay vì `form.watch()`.
  const stars = useWatch({ control, name: "stars" });
  const tags = useWatch({ control, name: "tags" }) ?? [];

  const handleClose = (toast_msg = "Đã đóng ticket.") => {
    onOpenChange(false);
    toast.success(toast_msg);
  };

  // Đóng ticket KHÔNG kèm rate (AI ticket hoặc user skip).
  const handleSkipRateAndClose = async () => {
    try {
      await closeMutation.mutateAsync({ ticketId, body: {} });
      handleClose("Đã đóng ticket.");
    } catch (error) {
      // Close không có form fields → mọi lỗi đều show toast.
      if (isApiErrorResponse(error)) {
        toast.error(
          error.response?.data.message ?? getApiErrorMessageVi(error),
        );
        return;
      }
      toast.error("Không thể đóng ticket. Vui lòng thử lại.");
    }
  };

  // Submit step 2: close → rate → close modal.
  const onSubmitRate = async (data: SubmitRatingBodyType) => {
    const sanitized: SubmitRatingBodyType = {
      ...data,
      feedback: data.feedback?.trim() || undefined,
      tags: data.tags && data.tags.length > 0 ? data.tags : undefined,
    };

    try {
      // Step 1: close ticket. Nếu fail (vd 409 race auto-close) → toast + abort.
      await closeMutation.mutateAsync({ ticketId, body: {} });
    } catch (error) {
      if (isApiErrorResponse(error)) {
        toast.error(
          error.response?.data.message ??
            "Không thể đóng ticket. " + getApiErrorMessageVi(error),
        );
        return;
      }
      toast.error("Không thể đóng ticket. Vui lòng thử lại.");
      return;
    }

    // Step 2: rate. Nếu fail → close vẫn thành công, chỉ toast warning.
    try {
      await rateMutation.mutateAsync(sanitized);
      handleClose("Đã đóng ticket. Cảm ơn đánh giá của bạn.");
    } catch (error) {
      if (
        isApiErrorUnprocessableEntityResponse<SubmitRatingBodyType>(error)
      ) {
        // Ticket đã close — đánh giá fail là phụ. Map field error nhưng
        // KHÔNG đóng modal để user có thể sửa và submit lại rating riêng.
        handleApiErrorUnprocessentity<SubmitRatingBodyType>(
          error.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        toast.warning(
          "Ticket đã đóng. Đánh giá chưa lưu được — vui lòng kiểm tra lại.",
        );
        return;
      }
      toast.warning(
        "Ticket đã đóng. Đánh giá chưa lưu được: " +
          getApiErrorMessageVi(error),
      );
      onOpenChange(false);
    }
  };

  const toggleTag = (tag: string, checked: boolean) => {
    const current = form.getValues("tags") ?? [];
    if (checked) {
      form.setValue("tags", [...current, tag]);
    } else {
      form.setValue(
        "tags",
        current.filter((t) => t !== tag),
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) {
          // Mở: reset về step review.
          setStep("review");
        } else {
          // Đóng: reset form.
          form.reset();
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "review" ? "Xem lại trước khi đóng" : "Đánh giá bác sĩ"}
          </DialogTitle>
          <DialogDescription>
            {step === "review"
              ? "Vui lòng xem giải pháp và đơn thuốc bác sĩ đã ghi trước khi xác nhận đóng ticket."
              : "Đánh giá của bạn giúp hệ thống cập nhật chất lượng bác sĩ."}
          </DialogDescription>
        </DialogHeader>

        {step === "review" && (
          <div className="space-y-3 text-sm">
            {isAI && (
              <Alert
                variant="default"
                className="bg-amber-500/10 border-amber-200"
              >
                <Bot className="h-4 w-4 text-amber-700" />
                <AlertDescription className="text-amber-900 text-xs">
                  Ticket này được xử lý bởi AI. Bạn không thể đánh giá ticket
                  AI — chỉ có thể đóng.
                </AlertDescription>
              </Alert>
            )}

            {/* Tóm tắt giải pháp */}
            {ticketFull.solution && (
              <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Giải pháp tóm tắt
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vấn đề gốc</p>
                  <p className="line-clamp-2">
                    {ticketFull.solution.rootCause}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cách điều trị</p>
                  <p className="line-clamp-2">
                    {ticketFull.solution.treatment}
                  </p>
                </div>
              </div>
            )}

            {/* Đơn thuốc tóm tắt */}
            {ticketFull.prescription &&
              ticketFull.prescription.items.length > 0 && (
                <div className="rounded-md border bg-muted/30 p-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <Pill className="h-3.5 w-3.5" />
                    Đơn thuốc ({ticketFull.prescription.items.length} mục)
                  </div>
                  <ul className="space-y-1 text-xs">
                    {ticketFull.prescription.items.slice(0, 3).map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-1.5"
                      >
                        <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                        <span className="font-medium">
                          {item.medicineName ??
                            item.customMedicineName ??
                            "—"}
                        </span>
                        <span className="text-muted-foreground">
                          · {item.dosage}
                        </span>
                      </li>
                    ))}
                    {ticketFull.prescription.items.length > 3 && (
                      <li className="text-muted-foreground italic">
                        + {ticketFull.prescription.items.length - 3} mục khác
                      </li>
                    )}
                  </ul>
                </div>
              )}

            <p className="text-xs text-muted-foreground">
              Sau khi đóng, ticket sẽ chuyển sang trạng thái "Đã đóng" và hệ
              thống sẽ thanh toán hoa hồng cho bác sĩ (nếu có).
            </p>
          </div>
        )}

        {step === "rate" && !isAI && (
          <form
            onSubmit={handleSubmit(onSubmitRate)}
            className="space-y-4"
            id="rate-form"
          >
            <div className="space-y-2">
              <Label>Số sao</Label>
              <Controller
                name="stars"
                control={control}
                render={({ field }) => (
                  <StarRating
                    value={field.value ?? 0}
                    onChange={field.onChange}
                    max={5}
                    size="lg"
                    ariaLabel="Đánh giá bác sĩ"
                  />
                )}
              />
              {errors.stars && (
                <p className="text-destructive text-xs">
                  {errors.stars.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="rate-feedback">Nhận xét (tuỳ chọn)</Label>
              <Textarea
                id="rate-feedback"
                placeholder="Trải nghiệm của bạn với bác sĩ..."
                rows={3}
                {...register("feedback")}
                aria-invalid={Boolean(errors.feedback)}
              />
              {errors.feedback && (
                <p className="text-destructive text-xs">
                  {errors.feedback.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Gắn thẻ (tuỳ chọn)</Label>
              <div className="flex flex-wrap gap-2">
                {RATING_TAG_OPTIONS.map((tag) => {
                  const id = `tag-${tag}`;
                  const checked = tags.includes(tag);
                  return (
                    <label
                      key={tag}
                      htmlFor={id}
                      className="flex items-center gap-1.5 cursor-pointer rounded-md border px-2.5 py-1.5 text-xs hover:bg-muted/50"
                    >
                      <Checkbox
                        id={id}
                        checked={checked}
                        onCheckedChange={(c) => toggleTag(tag, Boolean(c))}
                      />
                      {tag}
                    </label>
                  );
                })}
              </div>
            </div>
          </form>
        )}

        <Separator />

        <DialogFooter>
          {step === "review" ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Huỷ
              </Button>
              {isAI ? (
                <Button
                  type="button"
                  onClick={handleSkipRateAndClose}
                  disabled={isPending}
                >
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Đóng ticket
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSkipRateAndClose}
                    disabled={isPending}
                  >
                    Đóng không đánh giá
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStep("rate")}
                    disabled={isPending}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Tiếp tục đánh giá
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("review")}
                disabled={isPending}
              >
                Quay lại
              </Button>
              <Button
                type="submit"
                form="rate-form"
                disabled={isPending || !stars}
              >
                {isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Đóng ticket &amp; Đánh giá
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
