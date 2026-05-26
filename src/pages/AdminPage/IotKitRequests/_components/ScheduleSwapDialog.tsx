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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EmptyState from "@/components/common/EmptyState";
import DatePickerField from "@/components/common/DatePickerField";
import {
  useReplacementDevices,
  useScheduleSwap,
} from "@/queries/useIotKitRequest";
import { useAdminIotDeviceDetail } from "@/queries/useIotDevice";
import {
  scheduleSwapSchema,
  type ReplacementDeviceItemType,
  type ScheduleSwapBodyType,
} from "@/schemaValidatation/iotKitRequest";
import { isValid, parse, startOfDay } from "date-fns";
import { CalendarClock, PackageOpen, Replace } from "lucide-react";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router";

interface Props {
  open: boolean;
  requestId: string;
  /** ID của thiết bị đang lỗi — fetch detail trong dialog để hiện context. */
  faultyDeviceId: string | null;
  farmId: string | null;
  onClose: () => void;
}

const TIME_SLOTS = generateTimeSlots();

export function ScheduleSwapDialog({
  open,
  requestId,
  faultyDeviceId,
  farmId,
  onClose,
}: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        {open ? (
          <ScheduleSwapForm
            key={requestId}
            requestId={requestId}
            faultyDeviceId={faultyDeviceId}
            farmId={farmId}
            onClose={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface FormProps {
  requestId: string;
  faultyDeviceId: string | null;
  farmId: string | null;
  onClose: () => void;
}

interface ScheduleFormValues {
  scheduledDate: string; // yyyy-MM-dd
  scheduledTime: string; // HH:mm
  replacementDeviceId: string;
}

function ScheduleSwapForm({
  requestId,
  faultyDeviceId,
  farmId,
  onClose,
}: FormProps) {
  const navigate = useNavigate();
  const mutation = useScheduleSwap();

  const faultyDeviceQuery = useAdminIotDeviceDetail(
    faultyDeviceId ?? "",
    !!faultyDeviceId,
  );
  const faultyDevice = faultyDeviceQuery.data?.data ?? null;

  // Không filter theo farmId — board kho thường có farmId=null (chưa gán
  // farm), BE filter `where.farmId = farmId` sẽ loại hết. Admin tự pick từ
  // toàn bộ board available.
  void farmId;
  const replacementQuery = useReplacementDevices(
    { page: 1, limit: 50 },
    true,
  );
  const replacements = replacementQuery.data?.data?.data ?? [];

  const form = useForm<ScheduleFormValues>({
    defaultValues: {
      scheduledDate: "",
      scheduledTime: "",
      replacementDeviceId: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    // Compose ISO datetime từ date + time slot rồi validate qua schema BE
    const composed = composeIso(values.scheduledDate, values.scheduledTime);
    const body: ScheduleSwapBodyType = {
      scheduledAt: composed,
      replacementDeviceId: values.replacementDeviceId,
    };
    const parsed = scheduleSwapSchema.safeParse(body);
    if (!parsed.success) {
      // Map lỗi về field hiển thị
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (path === "scheduledAt") {
          form.setError("scheduledTime", { message: issue.message });
        } else if (path === "replacementDeviceId") {
          form.setError("replacementDeviceId", { message: issue.message });
        }
      }
      return;
    }
    mutation.mutate(
      { id: requestId, body: parsed.data },
      { onSuccess: () => onClose() },
    );
  });

  const today = useMemo(() => startOfDay(new Date()), []);

  return (
    <>
      <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4 pr-12 text-left">
        <DialogTitle className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4" />
          Lên lịch thay thiết bị
        </DialogTitle>
        <DialogDescription>
          Chọn bộ kit thay thế từ kho và thời điểm kỹ thuật viên ghé thay tại
          hiện trường.
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
        {/* ① Thiết bị đang lỗi (context) */}
        <div className="rounded-md border bg-muted/30 p-3">
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
          className="space-y-4"
          id="schedule-swap-form"
        >
          {/* ② Thiết bị thay thế */}
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

          {/* ③ Ngày */}
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

          {/* ④ Giờ */}
          <Controller
            control={form.control}
            name="scheduledTime"
            rules={{ required: "Vui lòng chọn giờ hẹn" }}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="schedule-time">Giờ hẹn</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="schedule-time">
                    <SelectValue placeholder="Chọn giờ (mỗi 15 phút)" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {TIME_SLOTS.map((slot) => (
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
          form="schedule-swap-form"
          disabled={mutation.isPending || replacements.length === 0}
        >
          <Replace className="h-4 w-4" />
          {mutation.isPending ? "Đang lưu..." : "Lên lịch thay"}
        </Button>
      </DialogFooter>
    </>
  );
}

// ── Replacement device select (combobox simplified — dùng Select shadcn) ────

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
          action={{
            label: "Vào quản lý thiết bị",
            onClick: onGoToInventory,
          }}
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

// ── Helpers ─────────────────────────────────────────────────────────────────

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 7; h <= 18; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

function composeIso(date: string, time: string): string {
  if (!date || !time) return "";
  const parsed = parse(
    `${date} ${time}`,
    "yyyy-MM-dd HH:mm",
    new Date(),
  );
  if (!isValid(parsed)) return "";
  return parsed.toISOString();
}

