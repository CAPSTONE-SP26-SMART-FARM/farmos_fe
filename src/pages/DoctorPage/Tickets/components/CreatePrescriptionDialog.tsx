import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pill } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CreatePrescriptionBodySchema } from "@/schemaValidatation/prescription";
import type { CreatePrescriptionBodyType } from "@/schemaValidatation/prescription";
import { useCreatePrescription } from "@/queries/useTicket";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import {
  isApiErrorUnprocessableEntityResponse,
  isApiErrorResponse,
} from "@/lib/utils";

interface CreatePrescriptionDialogProps {
  ticketId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePrescriptionDialog({
  ticketId,
  open,
  onOpenChange,
}: CreatePrescriptionDialogProps) {
  const createRxMutation = useCreatePrescription(ticketId);

  const form = useForm<CreatePrescriptionBodyType>({
    resolver: zodResolver(CreatePrescriptionBodySchema),
    defaultValues: {
      medicineName: "",
      dosage: "",
    },
  });
  useClearServerFieldErrors(form);

  const onSubmit = async (data: CreatePrescriptionBodyType) => {
    try {
      await createRxMutation.mutateAsync(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      if (
        isApiErrorUnprocessableEntityResponse<CreatePrescriptionBodyType>(error)
      ) {
        handleApiErrorUnprocessentity<CreatePrescriptionBodyType>(
          error.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }

      if (isApiErrorResponse(error)) {
        toast.error(error.response?.data.message ?? "Tạo đơn thuốc thất bại");
        return;
      }

      toast.error("Tạo đơn thuốc thất bại");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-4 w-4" />
            Thêm đơn thuốc
          </DialogTitle>
          <DialogDescription>Kê đơn thuốc cho sự cố này.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Tên thuốc / hóa chất</label>
            <Input
              placeholder="Ví dụ: Abamectin 1.8EC"
              {...form.register("medicineName")}
            />
            {form.formState.errors.medicineName && (
              <p className="text-xs text-destructive">
                {form.formState.errors.medicineName.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Liều lượng</label>
            <Input
              placeholder="Ví dụ: 10ml/lít, phun 3 lần/tuần"
              {...form.register("dosage")}
            />
            {form.formState.errors.dosage && (
              <p className="text-xs text-destructive">
                {form.formState.errors.dosage.message}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={createRxMutation.isPending}
              className="flex-1"
            >
              {createRxMutation.isPending ? "Đang lưu..." : "Lưu đơn thuốc"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
