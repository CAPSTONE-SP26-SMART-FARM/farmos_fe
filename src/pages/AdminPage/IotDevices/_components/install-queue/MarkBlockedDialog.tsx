import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  InstallMarkBlockedFormSchema,
  type InstallBlockReasonType,
  type InstallMarkBlockedBodyType,
  type InstallMarkBlockedFormType,
} from "@/schemaValidatation/iotDeviceAdminOps";

interface Props {
  open: boolean;
  deviceCount: number;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: (body: Omit<InstallMarkBlockedBodyType, "deviceIds">) => void;
}

const REASON_OPTIONS: { value: InstallBlockReasonType; label: string }[] = [
  { value: "owner_absent", label: "Chủ trang trại vắng mặt" },
  { value: "site_not_ready", label: "Hiện trường chưa sẵn sàng" },
  { value: "missing_parts", label: "Thiếu phụ kiện" },
  { value: "other", label: "Khác" },
];

const DEFAULT_VALUES: InstallMarkBlockedFormType = {
  blockReason: "owner_absent",
  notes: "",
  retryAfter: "",
};

function formToBody(
  data: InstallMarkBlockedFormType,
): Omit<InstallMarkBlockedBodyType, "deviceIds"> {
  return {
    blockReason: data.blockReason,
    notes: data.notes?.trim() || undefined,
    retryAfterDate: data.retryAfter
      ? new Date(data.retryAfter).toISOString()
      : undefined,
  };
}

function MarkBlockedForm({
  deviceCount,
  isPending,
  onCancel,
  onConfirm,
}: Omit<Props, "open">) {
  const form = useForm<InstallMarkBlockedFormType>({
    resolver: zodResolver(InstallMarkBlockedFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const onSubmit = form.handleSubmit((data) => onConfirm(formToBody(data)));

  return (
    <>
      <DialogHeader>
        <DialogTitle>Đánh dấu không lắp được</DialogTitle>
        <DialogDescription>
          Đã chọn {deviceCount} thiết bị. Thiết bị sẽ vẫn ở trạng thái{" "}
          <strong>Đã cho thuê</strong> nhưng được đánh dấu bị chặn để quản trị
          viên biết lý
          do khi quay lại.
        </DialogDescription>
      </DialogHeader>

      <form
        onSubmit={onSubmit}
        className="space-y-3"
      >
        <FieldGroup>
          <Controller
            control={form.control}
            name="blockReason"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Lý do</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REASON_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.error ? (
                  <FieldError>{fieldState.error.message}</FieldError>
                ) : null}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="notes"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="block-notes">Ghi chú (tuỳ chọn)</FieldLabel>
                <Textarea
                  id="block-notes"
                  {...field}
                  value={field.value ?? ""}
                  placeholder="VD: Hẹn owner thứ 5 tuần sau..."
                  rows={2}
                />
                {fieldState.error ? (
                  <FieldError>{fieldState.error.message}</FieldError>
                ) : null}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="retryAfter"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="retry-after">
                  Hẹn quay lại (tuỳ chọn)
                </FieldLabel>
                <Input
                  id="retry-after"
                  type="date"
                  {...field}
                  value={field.value ?? ""}
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
            onClick={onCancel}
            disabled={isPending}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isPending || deviceCount === 0}
          >
            {isPending ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function MarkBlockedDialog({
  open,
  deviceCount,
  isPending,
  onCancel,
  onConfirm,
}: Props) {
  const handleOpenChange = (next: boolean) => {
    if (!next && !isPending) onCancel();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent>
        {open ? (
          <MarkBlockedForm
            key="mark-blocked-form"
            deviceCount={deviceCount}
            isPending={isPending}
            onCancel={onCancel}
            onConfirm={onConfirm}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
