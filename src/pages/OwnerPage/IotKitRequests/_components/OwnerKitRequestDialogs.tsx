import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useCancelKitRequest } from "@/queries/useIotKitRequest";
import {
  cancelRequestSchema,
  type CancelRequestBodyType,
} from "@/schemaValidatation/iotKitRequest";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

/**
 * Owner chỉ còn 1 dialog action duy nhất với kit request: hủy FAULT_REPORT
 * mình tạo. INSTALL_SCHEDULE là auto-create, owner không có quyền cancel
 * (BE từ chối).
 */

interface CancelRequestProps {
  open: boolean;
  requestId: string;
  onClose: () => void;
}

function CancelRequestForm({
  requestId,
  onClose,
}: {
  requestId: string;
  onClose: () => void;
}) {
  const mutation = useCancelKitRequest();
  const form = useForm<CancelRequestBodyType>({
    resolver: zodResolver(cancelRequestSchema),
    defaultValues: { reason: "" },
  });

  const onSubmit = form.handleSubmit((data) =>
    mutation.mutate(
      { id: requestId, body: data },
      { onSuccess: () => onClose() },
    ),
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>Hủy yêu cầu</DialogTitle>
        <DialogDescription>
          Sau khi hủy, quản trị viên sẽ không tiếp nhận yêu cầu này nữa. Nếu sự
          cố thiết bị vẫn còn, bạn có thể tạo yêu cầu mới.
        </DialogDescription>
      </DialogHeader>
      <form
        onSubmit={onSubmit}
        className="space-y-3"
      >
        <FieldGroup>
          <Controller
            control={form.control}
            name="reason"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="cancel-reason">Lý do hủy</FieldLabel>
                <Textarea
                  id="cancel-reason"
                  {...field}
                  rows={4}
                  placeholder="VD: Thiết bị đã hoạt động lại, không cần xử lý nữa..."
                />
                {fieldState.error ? (
                  <FieldError>{fieldState.error.message}</FieldError>
                ) : null}
              </Field>
            )}
          />
        </FieldGroup>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Quay lại
          </Button>
          <Button
            type="submit"
            variant="destructive"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Đang xử lý..." : "Xác nhận hủy"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function CancelRequestDialog({
  open,
  requestId,
  onClose,
}: CancelRequestProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogContent>
        {open ? (
          <CancelRequestForm
            key={requestId}
            requestId={requestId}
            onClose={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
