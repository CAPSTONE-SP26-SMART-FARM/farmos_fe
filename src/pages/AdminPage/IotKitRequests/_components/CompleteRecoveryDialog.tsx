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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCompleteRecovery } from "@/queries/useIotKitRequest";
import {
  completeRecoverySchema,
  type CompleteRecoveryBodyType,
  type KitRequestDetailResType,
  type RecoveryBoardOutcomeType,
} from "@/schemaValidatation/iotKitRequest";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  AlertTriangle,
  CheckCircle2,
  PackageCheck,
  Recycle,
  Tractor,
  Warehouse,
  XCircle,
} from "lucide-react";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";

interface Props {
  open: boolean;
  request: KitRequestDetailResType;
  onClose: () => void;
}

const OUTCOME_LABEL: Record<
  RecoveryBoardOutcomeType,
  { label: string; description: string; icon: typeof PackageCheck }
> = {
  recovered_good: {
    label: "Thu được, còn tốt",
    description: "Kit còn dùng được, đưa về kho",
    icon: PackageCheck,
  },
  recovered_damaged: {
    label: "Thu được, đã hỏng",
    description: "Kit hỏng, cần kiểm tra/sửa chữa",
    icon: Recycle,
  },
  not_recovered: {
    label: "Không thu được",
    description: "Owner không cho, mất, hoặc lý do khác",
    icon: XCircle,
  },
};

export function CompleteRecoveryDialog({ open, request, onClose }: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogContent className="flex max-h-[min(90vh,760px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {open ? (
          <CompleteRecoveryForm
            key={request.id}
            request={request}
            onClose={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CompleteRecoveryForm({
  request,
  onClose,
}: {
  request: KitRequestDetailResType;
  onClose: () => void;
}) {
  const mutation = useCompleteRecovery();
  const boards = request.devices ?? [];

  const form = useForm<CompleteRecoveryBodyType>({
    resolver: zodResolver(completeRecoverySchema),
    defaultValues: {
      outcomes: boards.map((b) => ({
        deviceId: b.id,
        outcome: "recovered_good" as const,
        note: "",
      })),
      resolutionNote: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate(
      { id: request.id, body: values },
      { onSuccess: () => onClose() },
    );
  });

  const scheduledLabel = useMemo(
    () =>
      request.scheduledAt
        ? format(new Date(request.scheduledAt), "HH:mm 'ngày' dd/MM/yyyy", {
            locale: vi,
          })
        : null,
    [request.scheduledAt],
  );

  // Outcome quyết định bởi BE lúc tạo request — admin chỉ confirm tình trạng
  // vật lý từng board. Default phòng case request cũ chưa có metadata field.
  const boardOutcome: "purchase" | "available" =
    request.metadata?.boardOutcomeOnComplete ??
    (request.metadata?.recoveryReason === "subscription_ended"
      ? "available"
      : "purchase");
  const isReturnToWarehouse = boardOutcome === "available";

  return (
    <>
      <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4 pr-12 text-left">
        <DialogTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Hoàn tất thu hồi
        </DialogTitle>
        <DialogDescription>
          {isReturnToWarehouse
            ? "Thiết bị sẽ được trả về kho hệ thống sau khi xác nhận — chủ trại không còn quyền sử dụng. Hành động này không thể hoàn tác."
            : "Thiết bị sẽ được giữ lại cho chủ trại dùng tiếp ở vụ sau sau khi xác nhận. Yêu cầu sẽ đóng và không thể chỉnh sửa."}
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
        <div
          className={
            "flex items-start gap-2 rounded-md border p-3 text-sm " +
            (isReturnToWarehouse
              ? "border-red-300 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30"
              : "border-emerald-300 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30")
          }
        >
          {isReturnToWarehouse ? (
            <Warehouse
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-red-700 dark:text-red-300"
            />
          ) : (
            <Tractor
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300"
            />
          )}
          <div className="space-y-0.5">
            <p
              className={
                "font-medium " +
                (isReturnToWarehouse
                  ? "text-red-900 dark:text-red-200"
                  : "text-emerald-900 dark:text-emerald-200")
              }
            >
              {isReturnToWarehouse
                ? "Đích đến: trả về kho hệ thống"
                : "Đích đến: giữ cho chủ trại dùng tiếp"}
            </p>
            <p
              className={
                "text-xs " +
                (isReturnToWarehouse
                  ? "text-red-800/80 dark:text-red-200/80"
                  : "text-emerald-800/80 dark:text-emerald-200/80")
              }
            >
              {isReturnToWarehouse
                ? "Gói thuê của chủ trại đã kết thúc. Thiết bị thu được tốt sẽ chuyển sang trạng thái 'sẵn sàng cho thuê' trong kho."
                : "Gói thuê còn hiệu lực. Thiết bị thu được tốt sẽ chuyển về trạng thái 'chờ lắp' của chủ trại — dùng được ở vụ sau."}
            </p>
            {isReturnToWarehouse && (
              <p className="mt-1 flex items-start gap-1 text-xs text-red-900 dark:text-red-200">
                <AlertTriangle
                  aria-hidden="true"
                  className="mt-0.5 h-3 w-3 shrink-0"
                />
                <span>
                  Chủ trại sẽ phải đăng ký gói thuê mới và cấu hình lại từ đầu
                  nếu muốn dùng lại sau này.
                </span>
              </p>
            )}
          </div>
        </div>

        {scheduledLabel && (
          <p className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Đã lên lịch:</span>{" "}
            <span className="font-medium">{scheduledLabel}</span>
          </p>
        )}

        <form
          id="complete-recovery-form"
          onSubmit={onSubmit}
          className="space-y-3"
        >
          <p className="text-sm font-medium">
            Tình trạng từng thiết bị ({boards.length})
          </p>
          <div className="space-y-2">
            {boards.map((board, index) => (
              <div
                key={board.id}
                className="rounded-md border bg-background p-3 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {board.label ?? board.deviceName}
                    </p>
                    {board.label && board.label !== board.deviceName ? (
                      <p className="text-xs text-muted-foreground">
                        {board.deviceName}
                      </p>
                    ) : null}
                  </div>
                </div>
                <Controller
                  control={form.control}
                  name={`outcomes.${index}.outcome`}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel
                        htmlFor={`outcome-${board.id}`}
                        className="text-xs text-muted-foreground"
                      >
                        Tình trạng
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id={`outcome-${board.id}`}>
                          <SelectValue placeholder="Chọn tình trạng" />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            Object.keys(OUTCOME_LABEL) as RecoveryBoardOutcomeType[]
                          ).map((key) => {
                            const opt = OUTCOME_LABEL[key];
                            const Icon = opt.icon;
                            return (
                              <SelectItem
                                key={key}
                                value={key}
                              >
                                <span className="flex items-center gap-2">
                                  <Icon
                                    aria-hidden="true"
                                    className="h-3.5 w-3.5"
                                  />
                                  <span>
                                    <span className="font-medium">
                                      {opt.label}
                                    </span>
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      {opt.description}
                                    </span>
                                  </span>
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {fieldState.error ? (
                        <FieldError>{fieldState.error.message}</FieldError>
                      ) : null}
                    </Field>
                  )}
                />
              </div>
            ))}
          </div>

          <Controller
            control={form.control}
            name="resolutionNote"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="complete-recovery-note">
                  Ghi chú chung (tùy chọn)
                </FieldLabel>
                <Textarea
                  id="complete-recovery-note"
                  {...field}
                  value={field.value ?? ""}
                  rows={3}
                  placeholder="VD: Owner hợp tác tốt, kit còn nguyên vẹn."
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
          form="complete-recovery-form"
          variant={isReturnToWarehouse ? "destructive" : "default"}
          disabled={mutation.isPending || boards.length === 0}
        >
          <CheckCircle2 className="h-4 w-4" />
          {mutation.isPending
            ? "Đang xử lý..."
            : isReturnToWarehouse
              ? "Xác nhận thu về kho"
              : "Xác nhận đã thu xong"}
        </Button>
      </DialogFooter>
    </>
  );
}
