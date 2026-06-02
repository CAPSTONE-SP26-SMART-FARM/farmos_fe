import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { startOfDay } from "date-fns";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Lock,
  PackageCheck,
  Recycle,
  Tractor,
  Warehouse,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import DatePickerField from "@/components/common/DatePickerField";
import { DEVICE_STATUS_LABEL_ADMIN } from "@/constants/iotDeviceDisplay";
import { cn } from "@/lib/utils";
import {
  useCompleteRecovery,
  useScheduleRecovery,
} from "@/queries/useIotKitRequest";
import {
  completeRecoverySchema,
  scheduleRecoverySchema,
  type CompleteRecoveryBodyType,
  type KitRequestDetailResType,
  type RecoveryBoardOutcomeType,
} from "@/schemaValidatation/iotKitRequest";
import { useAuthStore } from "@/stores/authStore";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  KIT_TIME_SLOTS,
  ScheduledSummary,
  StepBadge,
  composeKitScheduleIso,
} from "./kitActionPanelShared";

/**
 * Panel inline cho flow RECOVERY_SCHEDULE — 1 khung chia đôi:
 *   - Trái  : thông tin thu hồi (lý do) + lên lịch (form / đã hẹn).
 *   - Phải  : danh sách thiết bị cần thu + ghi tình trạng & xác nhận.
 * Card 2 khóa tới khi đã lên lịch ở card 1.
 */

interface Props {
  request: KitRequestDetailResType;
  onClose: () => void;
}

export function RecoveryActionPanel({ request, onClose }: Props) {
  const me = useAuthStore((s) => s.user);
  const isScheduled = !!request.scheduledAt;
  const isMyHandler = request.handlerId === me?.id;

  return (
    <div className="mt-4 space-y-3 border-t pt-4">
      <p className="text-sm font-medium">Thu hồi thiết bị</p>
      <div className="divide-y overflow-hidden rounded-md border md:grid md:grid-cols-2 md:divide-x md:divide-y-0">
        <div className="p-4">
          <RecoveryScheduleCard
            request={request}
            isScheduled={isScheduled}
          />
        </div>
        <div className="p-4">
          <RecoveryCompleteCard
            request={request}
            locked={!isScheduled}
            canSubmit={isMyHandler}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}

// ── Trái — Thông tin thu hồi + lên lịch ───────────────────────────────────

const RECOVERY_REASON_TEXT: Record<
  "milestone_transition" | "cropseason_completed" | "subscription_ended",
  string
> = {
  milestone_transition: "Kết thúc giai đoạn hiện tại, chuyển sang vụ mới.",
  cropseason_completed: "Mùa vụ đã hoàn tất, thu toàn bộ thiết bị về.",
  subscription_ended: "Gói thuê đã kết thúc, thu thiết bị về kho.",
};

function RecoveryScheduleCard({
  request,
  isScheduled,
}: {
  request: KitRequestDetailResType;
  isScheduled: boolean;
}) {
  const mutation = useScheduleRecovery();
  const boardCount = request.devices?.length ?? 0;
  const recoveryReason = request.metadata?.recoveryReason;
  const form = useForm<{ scheduledDate: string; scheduledTime: string }>({
    defaultValues: { scheduledDate: "", scheduledTime: "" },
  });
  const today = useMemo(() => startOfDay(new Date()), []);

  const onSubmit = form.handleSubmit((values) => {
    const composed = composeKitScheduleIso(
      values.scheduledDate,
      values.scheduledTime,
    );
    const parsed = scheduleRecoverySchema.safeParse({ scheduledAt: composed });
    if (!parsed.success) {
      form.setError("scheduledTime", {
        message: parsed.error.issues[0]?.message ?? "Thời gian hẹn không hợp lệ",
      });
      return;
    }
    mutation.mutate({ id: request.id, body: parsed.data });
  });

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <StepBadge active>1</StepBadge>
        <div>
          <p className="font-medium">Lên lịch thu hồi</p>
          <p className="text-xs text-muted-foreground">
            Chốt thời điểm kỹ thuật viên ghé thu kit về.
          </p>
        </div>
      </div>

      {recoveryReason && (
        <div className="mb-3 rounded-md border bg-muted/20 p-3 text-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Lý do thu hồi
          </p>
          <p className="mt-1 leading-relaxed">
            {RECOVERY_REASON_TEXT[recoveryReason]}
          </p>
        </div>
      )}

      {isScheduled && request.scheduledAt ? (
        <ScheduledSummary
          title="Đã lên lịch thu hồi"
          scheduledAt={request.scheduledAt}
        />
      ) : (
        <form
          onSubmit={onSubmit}
          className="space-y-3"
        >
          <Controller
            control={form.control}
            name="scheduledDate"
            rules={{ required: "Vui lòng chọn ngày hẹn" }}
            render={({ field, fieldState }) => (
              <DatePickerField
                label="Ngày hẹn"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                placeholder="Chọn ngày"
                minDate={today}
              />
            )}
          />
          <Controller
            control={form.control}
            name="scheduledTime"
            rules={{ required: "Vui lòng chọn giờ hẹn" }}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="recovery-time">Giờ hẹn</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="recovery-time">
                    <SelectValue placeholder="Chọn giờ (mỗi 15 phút)" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {KIT_TIME_SLOTS.map((slot) => (
                      <SelectItem
                        key={slot}
                        value={slot}
                      >
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.error ? (
                  <FieldError>{fieldState.error.message}</FieldError>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Khung giờ làm việc 07:00 – 18:00, cách 15 phút.
                  </p>
                )}
              </Field>
            )}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={mutation.isPending || boardCount === 0}
            >
              <CalendarClock className="h-4 w-4" />
              {mutation.isPending ? "Đang lưu..." : "Lên lịch thu hồi"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Phải — Danh sách board + ghi tình trạng & xác nhận ────────────────────

const OUTCOME_LABEL: Record<
  RecoveryBoardOutcomeType,
  { label: string; description: string; icon: typeof PackageCheck }
> = {
  recovered_good: {
    label: "Thu được, còn tốt",
    description: "Kit còn dùng được",
    icon: PackageCheck,
  },
  recovered_damaged: {
    label: "Thu được, đã hỏng",
    description: "Kit hỏng, cần kiểm tra",
    icon: Recycle,
  },
  not_recovered: {
    label: "Không thu được",
    description: "Owner không cho, mất...",
    icon: XCircle,
  },
};

function RecoveryCompleteCard({
  request,
  locked,
  canSubmit,
  onClose,
}: {
  request: KitRequestDetailResType;
  locked: boolean;
  canSubmit: boolean;
  onClose: () => void;
}) {
  const boards = request.devices ?? [];

  return (
    <div className={cn("transition-opacity", locked && "opacity-90")}>
      <div className="mb-3 flex items-center gap-2">
        <StepBadge active={!locked}>2</StepBadge>
        <div className="flex-1">
          <p className="font-medium">Thiết bị thu hồi ({boards.length})</p>
          <p className="text-xs text-muted-foreground">
            {locked
              ? "Ghi tình trạng từng thiết bị sau khi đã lên lịch."
              : "Ghi tình trạng từng thiết bị đã thu để chốt yêu cầu."}
          </p>
        </div>
        {locked && (
          <Lock
            aria-hidden="true"
            className="h-4 w-4 text-muted-foreground"
          />
        )}
      </div>

      {locked ? (
        <div className="space-y-2">
          {boards.length === 0 ? (
            <p className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
              Không còn thiết bị nào cần thu hồi.
            </p>
          ) : (
            <ul className="max-h-56 space-y-1 overflow-y-auto rounded-md border bg-muted/20 p-2 text-sm">
              {boards.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-2 rounded px-1 py-1"
                >
                  <span className="font-mono font-medium">
                    {d.label ?? d.deviceName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {DEVICE_STATUS_LABEL_ADMIN[d.status] ?? d.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm text-muted-foreground">
            Hãy lên lịch thu ở bước 1 trước khi ghi tình trạng và chốt.
          </p>
        </div>
      ) : (
        <RecoveryCompleteForm
          key={request.id}
          request={request}
          canSubmit={canSubmit}
          onClose={onClose}
        />
      )}
    </div>
  );
}

function RecoveryCompleteForm({
  request,
  canSubmit,
  onClose,
}: {
  request: KitRequestDetailResType;
  canSubmit: boolean;
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

  const onSubmit = form.handleSubmit((values) =>
    mutation.mutate(
      { id: request.id, body: values },
      { onSuccess: () => onClose() },
    ),
  );

  // Đích đến do BE quyết định lúc tạo request — admin chỉ xác nhận tình trạng.
  const boardOutcome: "purchase" | "available" =
    request.metadata?.boardOutcomeOnComplete ??
    (request.metadata?.recoveryReason === "subscription_ended"
      ? "available"
      : "purchase");
  const isReturnToWarehouse = boardOutcome === "available";

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "flex items-start gap-2 rounded-md border p-3 text-sm",
          isReturnToWarehouse
            ? "border-red-300 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30"
            : "border-emerald-300 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30",
        )}
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
            className={cn(
              "font-medium",
              isReturnToWarehouse
                ? "text-red-900 dark:text-red-200"
                : "text-emerald-900 dark:text-emerald-200",
            )}
          >
            {isReturnToWarehouse
              ? "Đích đến: trả về kho hệ thống"
              : "Đích đến: giữ cho chủ trại dùng tiếp"}
          </p>
          <p
            className={cn(
              "text-xs",
              isReturnToWarehouse
                ? "text-red-800/80 dark:text-red-200/80"
                : "text-emerald-800/80 dark:text-emerald-200/80",
            )}
          >
            {isReturnToWarehouse
              ? "Gói thuê đã kết thúc. Thiết bị thu được tốt sẽ chuyển sang 'sẵn sàng cho thuê' trong kho."
              : "Gói thuê còn hiệu lực. Thiết bị thu được tốt sẽ về 'chờ lắp' của chủ trại — dùng được ở vụ sau."}
          </p>
          {isReturnToWarehouse && (
            <p className="mt-1 flex items-start gap-1 text-xs text-red-900 dark:text-red-200">
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 h-3 w-3 shrink-0"
              />
              <span>
                Chủ trại phải đăng ký gói thuê mới và cấu hình lại từ đầu nếu
                muốn dùng lại sau này.
              </span>
            </p>
          )}
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-3"
      >
        <div className="max-h-56 space-y-2 overflow-y-auto">
          {boards.map((board, index) => (
            <div
              key={board.id}
              className="space-y-2 rounded-md border bg-background p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {board.label ?? board.deviceName}
                </p>
                {board.label && board.label !== board.deviceName ? (
                  <p className="text-xs text-muted-foreground">
                    {board.deviceName}
                  </p>
                ) : null}
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

        {!canSubmit && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Chỉ người phụ trách yêu cầu mới được hoàn tất thu hồi.
          </p>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            variant={isReturnToWarehouse ? "destructive" : "default"}
            disabled={mutation.isPending || boards.length === 0 || !canSubmit}
          >
            <CheckCircle2 className="h-4 w-4" />
            {mutation.isPending
              ? "Đang xử lý..."
              : isReturnToWarehouse
                ? "Xác nhận thu về kho"
                : "Xác nhận đã thu xong"}
          </Button>
        </div>
      </form>
    </div>
  );
}
