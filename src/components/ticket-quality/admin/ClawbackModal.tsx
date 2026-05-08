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
import { formatCurrencyVnd } from "@/lib/format";
import {
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import { useClawback } from "@/queries/useAdminTicketReports";
import {
  ClawbackTicketBodySchema,
  type ClawbackTicketBodyType,
} from "@/schemaValidatation/ticketReports";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2, Undo2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface ClawbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  ticketNumber?: string;
  /** Số tiền hoa hồng đã trả (tính từ unitPrice × payoutPercent / 100). */
  commissionAmount?: number | null;
}

// B16 — Admin thu hồi hoa hồng đã trả cho doctor (PENALTY transaction).
// Walkthrough §4.4: ledger không bị xoá, chỉ thêm 1 wallet transaction PENALTY.
// Nếu wallet doctor không đủ tiền → BE 409, hiển thị toast.
export default function ClawbackModal({
  open,
  onOpenChange,
  ticketId,
  ticketNumber,
  commissionAmount,
}: ClawbackModalProps) {
  const clawbackMutation = useClawback();

  const form = useForm<ClawbackTicketBodyType>({
    resolver: zodResolver(ClawbackTicketBodySchema),
    defaultValues: { reason: "" },
  });
  useClearServerFieldErrors(form);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const isPending = clawbackMutation.isPending || isSubmitting;

  const onSubmit = async (data: ClawbackTicketBodyType) => {
    const sanitized: ClawbackTicketBodyType = {
      reason: data.reason.trim(),
    };
    try {
      await clawbackMutation.mutateAsync({ ticketId, body: sanitized });
      toast.success("Đã thu hồi hoa hồng thành công.");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      if (
        isApiErrorUnprocessableEntityResponse<ClawbackTicketBodyType>(error)
      ) {
        handleApiErrorUnprocessentity<ClawbackTicketBodyType>(
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
            <Undo2 className="h-4 w-4" />
            Thu hồi hoa hồng
          </DialogTitle>
          <DialogDescription>
            Tạo bản ghi PENALTY trừ vào ví bác sĩ. Ledger gốc vẫn giữ — thao
            tác này được audit. Yêu cầu ví bác sĩ còn đủ số dư.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <Alert
            variant="default"
            className="border-amber-200 bg-amber-500/10"
          >
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <AlertDescription className="text-amber-900 space-y-1">
              {ticketNumber && (
                <p className="text-sm">
                  Ticket: <span className="font-mono">{ticketNumber}</span>
                </p>
              )}
              {typeof commissionAmount === "number" && commissionAmount > 0 && (
                <p className="text-sm">
                  Số tiền sẽ thu hồi:{" "}
                  <span className="font-medium">
                    {formatCurrencyVnd(commissionAmount)}
                  </span>
                </p>
              )}
              <p className="text-xs">
                Hành động không thể hoàn tác qua UI. Hãy chắc chắn lý do hợp lệ.
              </p>
            </AlertDescription>
          </Alert>

          <div className="space-y-1">
            <Label htmlFor="clawback-reason">Lý do *</Label>
            <Textarea
              id="clawback-reason"
              rows={4}
              placeholder="Mô tả lý do thu hồi (tối thiểu 10 ký tự)..."
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
              Huỷ
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận thu hồi"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
