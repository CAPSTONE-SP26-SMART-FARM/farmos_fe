import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCompleteSwap } from "@/queries/useIotKitRequest";
import { useAdminIotDeviceDetail } from "@/queries/useIotDevice";
import {
  completeSwapSchema,
  type CompleteSwapBodyType,
  type KitRequestDetailResType,
} from "@/schemaValidatation/iotKitRequest";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  PackageCheck,
  Recycle,
} from "lucide-react";
import { DEVICE_STATUS_LABEL_ADMIN } from "@/constants/iotDeviceDisplay";
import { Controller, useForm } from "react-hook-form";

interface Props {
  open: boolean;
  request: KitRequestDetailResType;
  faultyDeviceId: string | null;
  farmId: string | null;
  onClose: () => void;
}

export function CompleteSwapDialog({
  open,
  request,
  faultyDeviceId,
  farmId,
  onClose,
}: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogContent className="flex max-h-[min(90vh,760px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        {open ? (
          <CompleteSwapForm
            key={request.id}
            request={request}
            faultyDeviceId={faultyDeviceId}
            farmId={farmId}
            onClose={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CompleteSwapForm({
  request,
  faultyDeviceId,
  farmId,
  onClose,
}: Omit<Props, "open">) {
  const mutation = useCompleteSwap();
  const replacementId = request.metadata?.replacementDeviceId ?? null;

  const faultyDeviceQuery = useAdminIotDeviceDetail(
    faultyDeviceId ?? "",
    !!faultyDeviceId,
  );
  const faultyDevice = faultyDeviceQuery.data?.data ?? null;

  // Replacement device đã reserved → fetch detail trực tiếp qua device API,
  // không qua list replacement-devices (BE đã loại reserved ra khỏi list).
  void farmId;
  const replacementQuery = useAdminIotDeviceDetail(
    replacementId ?? "",
    !!replacementId,
  );
  const replacementDevice = replacementQuery.data?.data ?? null;

  const form = useForm<CompleteSwapBodyType>({
    resolver: zodResolver(completeSwapSchema),
    defaultValues: {
      oldBoardOutcome: "revoked",
      resolutionNote: "",
    },
  });

  const onSubmit = form.handleSubmit((values) =>
    mutation.mutate(
      { id: request.id, body: values },
      { onSuccess: () => onClose() },
    ),
  );

  const scheduledLabel = request.scheduledAt
    ? format(new Date(request.scheduledAt), "HH:mm 'ngày' dd/MM/yyyy", {
        locale: vi,
      })
    : null;

  // Guard match BE: SwapOldBoardNotInError — thiết bị cũ phải đang ở status
  // `error` mới được swap atomic. Đợi load xong device detail mới phán quyết.
  const faultyStatus = faultyDevice?.status;
  const isOldBoardReady = faultyStatus === "error";
  const isOldBoardLoaded = !faultyDeviceQuery.isLoading && !!faultyDevice;
  const canSubmit =
    !mutation.isPending && isOldBoardLoaded && isOldBoardReady;

  return (
    <>
      <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4 pr-12 text-left">
        <DialogTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Hoàn tất thay thiết bị
        </DialogTitle>
        <DialogDescription>
          Xác nhận đã giao và lắp thiết bị thay thế. Sau khi xác nhận, hai
          thiết bị sẽ đổi vai trò ngay lập tức — không thể hoàn tác.
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
        {/* ① Summary đổi vai trò */}
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Thiết bị cũ
            </p>
            {faultyDeviceQuery.isLoading ? (
              <Skeleton className="mt-1 h-5 w-3/4" />
            ) : faultyDevice ? (
              <>
                <p className="mt-1 font-medium">
                  {faultyDevice.label ?? faultyDevice.deviceName}
                </p>
                {faultyDevice.label &&
                  faultyDevice.label !== faultyDevice.deviceName && (
                    <p className="text-xs text-muted-foreground">
                      {faultyDevice.deviceName}
                    </p>
                  )}
                {faultyDevice.farm?.name && (
                  <p className="text-xs text-muted-foreground">
                    {faultyDevice.farm.name}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">—</p>
            )}
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              Sẽ ngưng hoạt động sau khi hoàn tất
            </p>
          </div>
          <ArrowRight
            aria-hidden="true"
            className="mx-auto h-5 w-5 text-muted-foreground"
          />
          <div className="rounded-md border bg-emerald-50/40 p-3 dark:bg-emerald-950/20">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Thiết bị mới
            </p>
            {replacementQuery.isLoading ? (
              <Skeleton className="mt-1 h-5 w-3/4" />
            ) : replacementDevice ? (
              <>
                <p className="mt-1 font-medium">
                  {replacementDevice.label ?? replacementDevice.deviceName}
                </p>
                {replacementDevice.label &&
                  replacementDevice.label !== replacementDevice.deviceName && (
                    <p className="text-xs text-muted-foreground">
                      {replacementDevice.deviceName}
                    </p>
                  )}
                {replacementDevice.farm?.name && (
                  <p className="text-xs text-muted-foreground">
                    {replacementDevice.farm.name}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                Đã đặt riêng cho yêu cầu này
              </p>
            )}
            <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
              Sẽ thay vào vị trí thiết bị cũ
            </p>
          </div>
        </div>

        {scheduledLabel && (
          <p className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Đã lên lịch:</span>{" "}
            <span className="font-medium">{scheduledLabel}</span>
          </p>
        )}

        {isOldBoardLoaded && !isOldBoardReady && (
          <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
            />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-200">
                Chưa thể hoàn tất thay
              </p>
              <p className="text-amber-800/80 dark:text-amber-200/80">
                Thiết bị cũ hiện đang ở trạng thái{" "}
                <strong>
                  {faultyStatus
                    ? (DEVICE_STATUS_LABEL_ADMIN[faultyStatus] ?? faultyStatus)
                    : "không xác định"}
                </strong>
                . Chỉ thiết bị đang ở trạng thái{" "}
                <strong>Lỗi</strong> mới có thể thực hiện thay tại hiện trường.
                Đợi hệ thống cập nhật trạng thái trước khi tiếp tục.
              </p>
            </div>
          </div>
        )}

        <form
          id="complete-swap-form"
          onSubmit={onSubmit}
          className="space-y-4"
        >
          {/* ② Outcome board cũ */}
          <Controller
            control={form.control}
            name="oldBoardOutcome"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Xử lý thiết bị cũ</FieldLabel>
                <div className="grid gap-2 sm:grid-cols-2">
                  <OutcomeOption
                    icon={Recycle}
                    label="Thu hồi do hỏng"
                    description="Đánh dấu thiết bị hỏng vĩnh viễn, không tái dùng."
                    checked={field.value === "revoked"}
                    onSelect={() => field.onChange("revoked")}
                  />
                  <OutcomeOption
                    icon={PackageCheck}
                    label="Đưa về kho"
                    description="Thiết bị còn dùng được, sẽ được kiểm tra để dùng lại."
                    checked={field.value === "available"}
                    onSelect={() => field.onChange("available")}
                  />
                </div>
                {fieldState.error ? (
                  <FieldError>{fieldState.error.message}</FieldError>
                ) : null}
              </Field>
            )}
          />

          {/* ③ Ghi chú */}
          <Controller
            control={form.control}
            name="resolutionNote"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="complete-swap-note">
                  Ghi chú xử lý (tùy chọn)
                </FieldLabel>
                <Textarea
                  id="complete-swap-note"
                  {...field}
                  value={field.value ?? ""}
                  rows={4}
                  placeholder="VD: Đã thay xong tại 14:30, owner xác nhận thiết bị mới hoạt động bình thường."
                />
                {fieldState.error ? (
                  <FieldError>{fieldState.error.message}</FieldError>
                ) : null}
              </Field>
            )}
          />
        </form>
      </div>

      <DialogFooter className="shrink-0 flex-row gap-2 border-t px-6 py-4 sm:justify-end">
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
          form="complete-swap-form"
          disabled={!canSubmit}
        >
          <CheckCircle2 className="h-4 w-4" />
          {mutation.isPending ? "Đang xử lý..." : "Xác nhận đã thay xong"}
        </Button>
      </DialogFooter>
    </>
  );
}

// ── Outcome option (tile selectable thay cho radio thường) ─────────────────

interface OutcomeOptionProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  checked: boolean;
  onSelect: () => void;
}

function OutcomeOption({
  icon: Icon,
  label,
  description,
  checked,
  onSelect,
}: OutcomeOptionProps) {
  return (
    <Button
      type="button"
      variant="outline"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={`flex h-auto flex-col items-start gap-1 whitespace-normal p-3 text-left ${
        checked ? "border-primary bg-primary/5 hover:bg-primary/10" : ""
      }`}
    >
      <Icon
        aria-hidden="true"
        className={`h-4 w-4 ${checked ? "text-primary" : "text-muted-foreground"}`}
      />
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </Button>
  );
}
