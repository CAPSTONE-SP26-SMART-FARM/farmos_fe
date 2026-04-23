import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import {
  AdminUnassignOwnerBodySchema,
  type AdminUnassignOwnerBodyType,
} from "@/schemaValidatation/iotDevice";
import { useAdminUnassignIotOwner } from "@/queries/useIotDevice";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface UnassignOwnerDialogProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  iotDeviceId: string;
  deviceName: string;
  farmName?: string;
}

export default function UnassignOwnerDialog({
  open,
  onOpenChange,
  iotDeviceId,
  deviceName,
  farmName,
}: UnassignOwnerDialogProps) {
  const form = useForm<AdminUnassignOwnerBodyType>({
    resolver: zodResolver(AdminUnassignOwnerBodySchema),
    defaultValues: {
      iotDeviceId,
      reason: "",
    },
  });

  const { mutateAsync, isPending } = useAdminUnassignIotOwner();

  const reset = () => {
    form.reset({ iotDeviceId, reason: "" });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (isPending) return;
    try {
      await mutateAsync({
        iotDeviceId: values.iotDeviceId,
        reason: values.reason?.trim() ? values.reason.trim() : undefined,
      });
      toast.success("Thu hồi owner khỏi thiết bị thành công");
      onOpenChange(false);
      reset();
    } catch {
      // error toast handled by onMutationError in the hook
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thu hồi owner khỏi thiết bị?</DialogTitle>
          <DialogDescription>
            Thiết bị{" "}
            <span className="font-medium text-foreground">{deviceName}</span>{" "}
            sẽ được gỡ khỏi{" "}
            {farmName ? (
              <span className="font-medium text-foreground">{farmName}</span>
            ) : (
              "chủ vườn hiện tại"
            )}
            . Hành động này có thể ảnh hưởng tới các cấu hình liên quan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <FieldGroup>
            <Controller
              name="reason"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Lý do (không bắt buộc)</FieldLabel>
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    rows={4}
                    maxLength={500}
                    placeholder="Ví dụ: chủ vườn đã trả thiết bị, chuyển sang gói khác..."
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
              >
                Hủy
              </Button>
            </DialogClose>
            <Button
              type="submit"
              variant="destructive"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang thu hồi...
                </>
              ) : (
                "Thu hồi"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
