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
import { useAdminInvalidateRating } from "@/queries/useTicket";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  InvalidateRatingBodySchema,
  type InvalidateRatingBodyType,
  type RatingResType,
} from "@/schemaValidatation/rating";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface InvalidateRatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  rating?: RatingResType | null;
}

// Modal admin vo hieu hoa danh gia (B17).
// Rating van duoc hien thi nhung khong tinh vao DQS.

export default function InvalidateRatingModal({
  open,
  onOpenChange,
  ticketId,
  rating,
}: InvalidateRatingModalProps) {
  const invalidateMutation = useAdminInvalidateRating();

  const form = useForm<InvalidateRatingBodyType>({
    resolver: zodResolver(InvalidateRatingBodySchema),
    defaultValues: { reason: "" },
  });
  useClearServerFieldErrors(form);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const isPending = invalidateMutation.isPending || isSubmitting;

  const onSubmit = async (data: InvalidateRatingBodyType) => {
    const sanitized: InvalidateRatingBodyType = {
      reason: data.reason.trim(),
    };
    try {
      await invalidateMutation.mutateAsync({
        ticketId,
        body: sanitized,
      });
      toast.success("Da vo hieu hoa danh gia.");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      if (
        isApiErrorUnprocessableEntityResponse<InvalidateRatingBodyType>(error)
      ) {
        handleApiErrorUnprocessentity<InvalidateRatingBodyType>(
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
      toast.error("Da co loi xay ra. Vui long thu lai.");
    }
  };

  const ratingDisabled = !rating || Boolean(rating.invalidatedAt);

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
            <ShieldOff className="h-4 w-4" />
            Vo hieu hoa danh gia
          </DialogTitle>
          <DialogDescription>
            Vo hieu hoa danh gia vi vi pham quy che hoac spam. Danh gia van duoc
            hien thi nhung khong tinh vao DQS.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {ratingDisabled && (
            <Alert
              variant="default"
              className="bg-muted/50"
            >
              <AlertDescription>
                {rating
                  ? "Đánh giá này đã được vô hiệu hoá trước đó."
                  : "Chưa có đánh giá để vô hiệu hoá."}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-1">
            <Label htmlFor="invalidate-reason">Ly do</Label>
            <Textarea
              id="invalidate-reason"
              rows={4}
              placeholder="Nhap ly do vo hieu hoa (toi thieu 10 ky tu)..."
              disabled={ratingDisabled}
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
            >
              Huy
            </Button>
            <Button
              type="submit"
              disabled={isPending || ratingDisabled}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Dang xu ly...
                </>
              ) : (
                "Xac nhan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
