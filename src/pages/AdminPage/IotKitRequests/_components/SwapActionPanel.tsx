import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { startOfDay } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  PackageCheck,
  PackageOpen,
  Recycle,
  Replace,
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
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/common/EmptyState";
import DatePickerField from "@/components/common/DatePickerField";
import { DEVICE_STATUS_LABEL_ADMIN } from "@/constants/iotDeviceDisplay";
import {
  useCompleteSwap,
  useReplacementDevices,
  useScheduleSwap,
} from "@/queries/useIotKitRequest";
import { useAdminIotDeviceDetail } from "@/queries/useIotDevice";
import {
  completeSwapSchema,
  scheduleSwapSchema,
  type CompleteSwapBodyType,
  type KitRequestDetailResType,
  type ReplacementDeviceItemType,
} from "@/schemaValidatation/iotKitRequest";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  KIT_TIME_SLOTS,
  composeKitScheduleIso,
} from "./kitActionPanelShared";
import {
  CompleteSwapInstallCard,
  StartSwapInstallCard,
} from "./SwapInstallCards";

/**
 * Panel inline cho nhánh "thay thiết bị" của FAULT_REPORT. Tự chọn card theo
 * trạng thái: chưa lên lịch → card lên lịch thay; đã lên lịch (có
 * metadata.replacementDeviceId) → card hoàn tất thay. Render trong dialog chi
 * tiết, không mở dialog lồng.
 */

interface Props {
  request: KitRequestDetailResType;
  faultyDeviceId: string | null;
  onClose: () => void;
}

export function SwapActionPanel({ request, faultyDeviceId, onClose }: Props) {
  const replacementId = request.metadata?.replacementDeviceId ?? null;
  // Chọn card theo trạng thái board mới — tách "xác nhận đã thay" khỏi "lắp đặt":
  //   chưa pick    → lên lịch thay
  //   available    → xác nhận đã thay tại hiện trường (board mới chưa đổi status)
  //   purchase     → bắt đầu lắp (purchase → install)
  //   install      → hoàn tất lắp (install → inactive)
  //   inactive/... → đã xong
  const replacementQuery = useAdminIotDeviceDetail(
    replacementId ?? "",
    !!replacementId,
  );
  const replacementStatus = replacementQuery.data?.data?.status;

  if (!replacementId) {
    return (
      <ScheduleSwapCard
        request={request}
        faultyDeviceId={faultyDeviceId}
        onClose={onClose}
      />
    );
  }
  if (replacementQuery.isLoading) {
    return <Skeleton className="h-40 w-full rounded-md" />;
  }
  if (replacementStatus === "available") {
    return (
      <CompleteSwapCard
        request={request}
        faultyDeviceId={faultyDeviceId}
        onClose={onClose}
      />
    );
  }
  if (replacementStatus === "purchase") {
    return (
      <StartSwapInstallCard
        request={request}
        onClose={onClose}
      />
    );
  }
  if (replacementStatus === "install") {
    return (
      <CompleteSwapInstallCard
        request={request}
        onClose={onClose}
      />
    );
  }
  return (
    <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
      Đã hoàn tất thay và lắp thiết bị mới cho yêu cầu này.
    </div>
  );
}

// ── Lên lịch thay ────────────────────────────────────────────────────────

interface ScheduleFormValues {
  scheduledDate: string;
  scheduledTime: string;
  replacementDeviceId: string;
}

function ScheduleSwapCard({ request, faultyDeviceId, onClose }: Props) {
  const navigate = useNavigate();
  const mutation = useScheduleSwap();

  const faultyDeviceQuery = useAdminIotDeviceDetail(
    faultyDeviceId ?? "",
    !!faultyDeviceId,
  );
  const faultyDevice = faultyDeviceQuery.data?.data ?? null;

  // Không filter theo farmId — board kho thường có farmId=null.
  const replacementQuery = useReplacementDevices({ page: 1, limit: 50 }, true);
  const replacements = replacementQuery.data?.data?.data ?? [];

  const form = useForm<ScheduleFormValues>({
    defaultValues: {
      scheduledDate: "",
      scheduledTime: "",
      replacementDeviceId: "",
    },
  });
  const today = useMemo(() => startOfDay(new Date()), []);

  const onSubmit = form.handleSubmit((values) => {
    const composed = composeKitScheduleIso(
      values.scheduledDate,
      values.scheduledTime,
    );
    const parsed = scheduleSwapSchema.safeParse({
      scheduledAt: composed,
      replacementDeviceId: values.replacementDeviceId,
    });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "scheduledAt") {
          form.setError("scheduledTime", { message: issue.message });
        } else if (issue.path[0] === "replacementDeviceId") {
          form.setError("replacementDeviceId", { message: issue.message });
        }
      }
      return;
    }
    mutation.mutate(
      { id: request.id, body: parsed.data },
      { onSuccess: () => onClose() },
    );
  });

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Replace
          aria-hidden="true"
          className="h-4 w-4 text-muted-foreground"
        />
        <div>
          <p className="font-medium">Lên lịch thay thiết bị</p>
          <p className="text-xs text-muted-foreground">
            Chọn bộ kit thay thế từ kho và thời điểm ghé thay.
          </p>
        </div>
      </div>

      <div className="mb-3 rounded-md border bg-muted/30 p-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Thiết bị đang lỗi
        </p>
        {faultyDeviceQuery.isLoading ? (
          <Skeleton className="mt-1 h-5 w-2/3" />
        ) : faultyDevice ? (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="font-medium">
              {faultyDevice.label ?? faultyDevice.deviceName}
            </span>
            {faultyDevice.label &&
            faultyDevice.label !== faultyDevice.deviceName ? (
              <span className="text-sm text-muted-foreground">
                {faultyDevice.deviceName}
              </span>
            ) : null}
            {faultyDevice.farm?.name && (
              <span className="text-sm text-muted-foreground">
                · {faultyDevice.farm.name}
              </span>
            )}
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            Không tải được thông tin thiết bị
          </p>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-3"
      >
        <Controller
          control={form.control}
          name="replacementDeviceId"
          rules={{ required: "Vui lòng chọn bộ kit thay thế" }}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="replacement-device">
                Bộ kit thay thế
              </FieldLabel>
              <ReplacementDeviceSelect
                id="replacement-device"
                value={field.value}
                onChange={field.onChange}
                devices={replacements}
                isLoading={replacementQuery.isLoading}
                onGoToInventory={() => {
                  onClose();
                  navigate("/dashboard/admin/iot-devices");
                }}
              />
              {fieldState.error ? (
                <FieldError>{fieldState.error.message}</FieldError>
              ) : null}
            </Field>
          )}
        />
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
              <FieldLabel htmlFor="swap-time">Giờ hẹn</FieldLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger id="swap-time">
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
            disabled={mutation.isPending || replacements.length === 0}
          >
            <CalendarClock className="h-4 w-4" />
            {mutation.isPending ? "Đang lưu..." : "Lên lịch thay"}
          </Button>
        </div>
      </form>
    </div>
  );
}

interface ReplacementSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  devices: ReplacementDeviceItemType[];
  isLoading: boolean;
  onGoToInventory: () => void;
}

function ReplacementDeviceSelect({
  id,
  value,
  onChange,
  devices,
  isLoading,
  onGoToInventory,
}: ReplacementSelectProps) {
  if (isLoading) {
    return <Skeleton className="h-9 w-full" />;
  }
  if (devices.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4">
        <EmptyState
          icon={PackageOpen}
          title="Kho chưa có bộ kit thay thế"
          description="Thêm bộ kit mới vào kho trước khi lên lịch thay cho owner."
          action={{ label: "Vào quản lý thiết bị", onClick: onGoToInventory }}
        />
      </div>
    );
  }
  return (
    <Select
      value={value}
      onValueChange={onChange}
    >
      <SelectTrigger id={id}>
        <SelectValue placeholder="Chọn bộ kit từ kho" />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {devices.map((d) => (
          <SelectItem
            key={d.id}
            value={d.id}
          >
            <div className="flex flex-col">
              <span className="font-medium">{d.label ?? d.deviceName}</span>
              {d.label && d.label !== d.deviceName ? (
                <span className="text-xs text-muted-foreground">
                  {d.deviceName}
                </span>
              ) : null}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ── Hoàn tất thay ────────────────────────────────────────────────────────

function CompleteSwapCard({ request, faultyDeviceId, onClose }: Props) {
  const mutation = useCompleteSwap();
  const replacementId = request.metadata?.replacementDeviceId ?? null;

  const faultyDeviceQuery = useAdminIotDeviceDetail(
    faultyDeviceId ?? "",
    !!faultyDeviceId,
  );
  const faultyDevice = faultyDeviceQuery.data?.data ?? null;

  const replacementQuery = useAdminIotDeviceDetail(
    replacementId ?? "",
    !!replacementId,
  );
  const replacementDevice = replacementQuery.data?.data ?? null;

  const form = useForm<CompleteSwapBodyType>({
    resolver: zodResolver(completeSwapSchema),
    defaultValues: { oldBoardOutcome: "revoked", resolutionNote: "" },
  });

  const onSubmit = form.handleSubmit((values) =>
    mutation.mutate(
      { id: request.id, body: values },
      { onSuccess: () => onClose() },
    ),
  );

  // Guard match BE (SwapOldBoardNotInError): thiết bị cũ phải đang ở `error`.
  const faultyStatus = faultyDevice?.status;
  const isOldBoardReady = faultyStatus === "error";
  const isOldBoardLoaded = !faultyDeviceQuery.isLoading && !!faultyDevice;
  const canSubmit = !mutation.isPending && isOldBoardLoaded && isOldBoardReady;

  return (
    <div className="rounded-md border p-4">
      <div className="mb-3 flex items-center gap-2">
        <CheckCircle2
          aria-hidden="true"
          className="h-4 w-4 text-muted-foreground"
        />
        <div>
          <p className="font-medium">Hoàn tất thay thiết bị</p>
          <p className="text-xs text-muted-foreground">
            Xác nhận đã giao và lắp thiết bị thay thế — hai thiết bị đổi vai trò
            ngay, không thể hoàn tác.
          </p>
        </div>
      </div>

      <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
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

      {isOldBoardLoaded && !isOldBoardReady && (
        <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
          />
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-200">
              Chưa thể hoàn tất thay
            </p>
            <p className="text-amber-800/80 dark:text-amber-200/80">
              Thiết bị cũ đang ở trạng thái{" "}
              <strong>
                {faultyStatus
                  ? (DEVICE_STATUS_LABEL_ADMIN[faultyStatus] ?? faultyStatus)
                  : "không xác định"}
              </strong>
              . Chỉ thiết bị đang <strong>Lỗi</strong> mới thay được tại hiện
              trường. Đợi hệ thống cập nhật trạng thái trước khi tiếp tục.
            </p>
          </div>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="space-y-3"
      >
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
                  description="Đánh dấu hỏng vĩnh viễn, không tái dùng."
                  checked={field.value === "revoked"}
                  onSelect={() => field.onChange("revoked")}
                />
                <OutcomeOption
                  icon={PackageCheck}
                  label="Đưa về kho"
                  description="Còn dùng được, sẽ kiểm tra để dùng lại."
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
                rows={3}
                placeholder="VD: Đã thay xong, owner xác nhận thiết bị mới chạy ổn."
              />
              {fieldState.error ? (
                <FieldError>{fieldState.error.message}</FieldError>
              ) : null}
            </Field>
          )}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!canSubmit}
          >
            <CheckCircle2 className="h-4 w-4" />
            {mutation.isPending ? "Đang xử lý..." : "Xác nhận đã thay xong"}
          </Button>
        </div>
      </form>
    </div>
  );
}

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
