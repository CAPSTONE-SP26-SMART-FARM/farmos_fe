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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateFaultReport } from "@/queries/useIotKitRequest";
import {
  createFaultReportSchema,
  type CreateFaultReportBodyType,
} from "@/schemaValidatation/iotKitRequest";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

/**
 * Dialog báo lỗi thiết bị IoT — dùng chung cho owner và manager.
 * `iotDeviceId` được preselect từ trang detail thiết bị → không hiển thị
 * field chọn device để tránh user chọn nhầm sang device khác.
 *
 * Khi success: hook đã toast "Đã gửi yêu cầu...", parent chỉ cần đóng
 * dialog. Lỗi 422 (đã có fault open cho device này) cũng hiển thị toast
 * chuẩn qua `onMutationError`.
 */

interface ReportFaultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  iotDeviceId: string;
  /** Tên ngắn của thiết bị để header dialog hiển thị (label hoặc deviceName). */
  deviceLabel?: string;
}

function ReportFaultForm({
  iotDeviceId,
  deviceLabel,
  onClose,
}: {
  iotDeviceId: string;
  deviceLabel?: string;
  onClose: () => void;
}) {
  const mutation = useCreateFaultReport();

  const form = useForm<CreateFaultReportBodyType>({
    resolver: zodResolver(createFaultReportSchema),
    defaultValues: {
      iotDeviceId,
      title: "",
      description: "",
    },
  });

  const onSubmit = form.handleSubmit((data) =>
    mutation.mutate(data, { onSuccess: () => onClose() }),
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>Báo lỗi thiết bị</DialogTitle>
        <DialogDescription>
          Mô tả tình trạng cho quản trị viên xử lý
          {deviceLabel ? (
            <>
              {" "}
              — thiết bị <strong>{deviceLabel}</strong>
            </>
          ) : null}
          .
        </DialogDescription>
      </DialogHeader>

      <form
        onSubmit={onSubmit}
        className="space-y-3"
      >
        <FieldGroup>
          <Controller
            control={form.control}
            name="title"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="fault-title">Tiêu đề</FieldLabel>
                <Input
                  id="fault-title"
                  {...field}
                  placeholder="VD: Cảm biến nhiệt độ không gửi data"
                  maxLength={255}
                />
                {fieldState.error ? (
                  <FieldError>{fieldState.error.message}</FieldError>
                ) : null}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="description"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="fault-description">Mô tả chi tiết</FieldLabel>
                <Textarea
                  id="fault-description"
                  {...field}
                  rows={5}
                  placeholder="Tình trạng cụ thể: đèn báo, thời điểm phát hiện, đã thử khắc phục gì..."
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
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Đang gửi..." : "Gửi yêu cầu"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function ReportFaultDialog({
  open,
  onOpenChange,
  iotDeviceId,
  deviceLabel,
}: ReportFaultDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        {open ? (
          <ReportFaultForm
            key={iotDeviceId}
            iotDeviceId={iotDeviceId}
            deviceLabel={deviceLabel}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
