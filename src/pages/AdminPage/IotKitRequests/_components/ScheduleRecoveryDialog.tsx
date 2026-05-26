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
import DatePickerField from "@/components/common/DatePickerField";
import { useScheduleRecovery } from "@/queries/useIotKitRequest";
import {
  scheduleRecoverySchema,
  type KitRequestDetailResType,
  type ScheduleRecoveryBodyType,
} from "@/schemaValidatation/iotKitRequest";
import { DEVICE_STATUS_LABEL_ADMIN } from "@/constants/iotDeviceDisplay";
import { isValid, parse, startOfDay } from "date-fns";
import { CalendarClock, PackageOpen } from "lucide-react";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";

interface Props {
  open: boolean;
  request: KitRequestDetailResType;
  onClose: () => void;
}

const TIME_SLOTS = generateTimeSlots();

export function ScheduleRecoveryDialog({ open, request, onClose }: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        {open ? (
          <ScheduleRecoveryForm
            key={request.id}
            request={request}
            onClose={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface ScheduleFormValues {
  scheduledDate: string;
  scheduledTime: string;
}

function ScheduleRecoveryForm({
  request,
  onClose,
}: {
  request: KitRequestDetailResType;
  onClose: () => void;
}) {
  const mutation = useScheduleRecovery();
  const boards = request.devices ?? [];

  const form = useForm<ScheduleFormValues>({
    defaultValues: { scheduledDate: "", scheduledTime: "" },
  });

  const today = useMemo(() => startOfDay(new Date()), []);

  const onSubmit = form.handleSubmit((values) => {
    const composed = composeIso(values.scheduledDate, values.scheduledTime);
    const body: ScheduleRecoveryBodyType = { scheduledAt: composed };
    const parsed = scheduleRecoverySchema.safeParse(body);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "scheduledAt") {
          form.setError("scheduledTime", { message: issue.message });
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
    <>
      <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4 pr-12 text-left">
        <DialogTitle className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4" />
          Lên lịch thu hồi thiết bị
        </DialogTitle>
        <DialogDescription>
          Chọn thời điểm kỹ thuật viên ghé thu kit về kho.
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
        {/* ① List board cần thu */}
        <div className="rounded-md border bg-muted/30 p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <PackageOpen
              aria-hidden="true"
              className="h-3.5 w-3.5"
            />
            Thiết bị cần thu hồi ({boards.length})
          </p>
          {boards.length === 0 ? (
            <Skeleton className="mt-2 h-12 w-full" />
          ) : (
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">
              {boards.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center gap-2"
                >
                  <span className="font-medium">{d.label ?? d.deviceName}</span>
                  {d.label && d.label !== d.deviceName ? (
                    <span className="text-xs text-muted-foreground">
                      {d.deviceName}
                    </span>
                  ) : null}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {DEVICE_STATUS_LABEL_ADMIN[d.status] ?? d.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form
          id="schedule-recovery-form"
          onSubmit={onSubmit}
          className="space-y-4"
        >
          {/* ② Ngày */}
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

          {/* ③ Giờ */}
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
          form="schedule-recovery-form"
          disabled={mutation.isPending || boards.length === 0}
        >
          <CalendarClock className="h-4 w-4" />
          {mutation.isPending ? "Đang lưu..." : "Lên lịch thu hồi"}
        </Button>
      </DialogFooter>
    </>
  );
}

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
  const parsed = parse(`${date} ${time}`, "yyyy-MM-dd HH:mm", new Date());
  if (!isValid(parsed)) return "";
  return parsed.toISOString();
}
