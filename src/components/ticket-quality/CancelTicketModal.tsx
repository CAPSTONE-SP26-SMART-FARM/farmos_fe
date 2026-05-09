import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useCancelTicketV2 } from "@/queries/useTicketV2";
import {
  CancelTicketV2BodySchema,
  type CancelTicketV2BodyType,
} from "@/schemaValidatation/ticketV2";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface CancelTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  /** Callback gọi sau khi cancel thành công (vd điều hướng về list). */
  onCancelled?: () => void;
}

// Mục 4.1 walkthrough — Owner cancel V2 khi status=open. BE sẽ refund nguồn
// quota (`SUBSCRIPTION_GRANT` → ledger +1, `PURCHASED` → balance +1) và set
// status=cancelled. BE guard P0-1: chỉ cho cancel khi status=open. Nếu doctor
// đã accept (assigned/in_progress), BE trả 422 → người dùng phải đi qua
// abandon-resolution thay vì cancel.
export default function CancelTicketModal({
  open,
  onOpenChange,
  ticketId,
  onCancelled,
}: CancelTicketModalProps) {
  const cancelMutation = useCancelTicketV2();

  const form = useForm<CancelTicketV2BodyType>({
    resolver: zodResolver(CancelTicketV2BodySchema),
    defaultValues: { reason: "" },
  });
  useClearServerFieldErrors(form);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const isPending = cancelMutation.isPending || isSubmitting;

  const onSubmit = async (data: CancelTicketV2BodyType) => {
    const sanitized: CancelTicketV2BodyType = {
      reason: data.reason?.trim() || undefined,
    };
    try {
      await cancelMutation.mutateAsync({ id: ticketId, body: sanitized });
      toast.success("Đã hủy ticket. Quota đã được hoàn về tài khoản.");
      form.reset();
      onOpenChange(false);
      onCancelled?.();
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse<CancelTicketV2BodyType>(error)) {
        handleApiErrorUnprocessentity<CancelTicketV2BodyType>(
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
      onOpenChange={(value) => {
        if (!value) form.reset();
        onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Huỷ ticket
          </DialogTitle>
          <DialogDescription>
            Ticket sẽ chuyển sang trạng thái <strong>đã huỷ</strong> và quota
            (gói đăng ký hoặc credit mua lẻ) sẽ được hoàn về tài khoản của
            chủ trang trại.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Chỉ huỷ được khi ticket còn ở trạng thái <strong>Mở</strong>.
              Nếu bác sĩ đã tiếp nhận, hãy chờ hệ thống phát hiện im lặng rồi
              chọn FALLBACK_AI / REFUND_TICKET ở modal "Xử lý khi không có bác
              sĩ".
            </AlertDescription>
          </Alert>

          <div className="space-y-1">
            <Label htmlFor="cancel-reason">Lý do (tuỳ chọn)</Label>
            <Textarea
              id="cancel-reason"
              rows={3}
              placeholder="Mô tả ngắn gọn lý do huỷ..."
              {...register("reason")}
              aria-invalid={Boolean(errors.reason)}
            />
            {errors.reason && (
              <p className="text-destructive text-xs">
                {errors.reason.message}
              </p>
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
              variant="destructive"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang huỷ...
                </>
              ) : (
                "Xác nhận huỷ"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
