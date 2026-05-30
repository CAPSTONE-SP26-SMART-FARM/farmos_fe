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
import DatePickerField from "@/components/common/DatePickerField";
import { useScheduleInstall } from "@/queries/useIotKitRequest";
import {
  scheduleInstallSchema,
  type KitRequestDetailResType,
  type ScheduleInstallBodyType,
} from "@/schemaValidatation/iotKitRequest";
import { format, isValid, parse, startOfDay } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarClock } from "lucide-react";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";

interface Props {
  open: boolean;
  request: KitRequestDetailResType;
  onClose: () => void;
}

const TIME_SLOTS = generateTimeSlots();

export function ScheduleInstallDialog({ open, request, onClose }: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogContent className="flex max-h-[min(90vh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        {open ? (
          <ScheduleInstallForm
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

function ScheduleInstallForm({
  request,
  onClose,
}: {
  request: KitRequestDetailResType;
  onClose: () => void;
}) {
  const mutation = useScheduleInstall();

  const form = useForm<ScheduleFormValues>({
    defaultValues: { scheduledDate: "", scheduledTime: "" },
  });

  const today = useMemo(() => startOfDay(new Date()), []);
  const slaDeadlineDate = request.slaDeadline
    ? new Date(request.slaDeadline)
    : null;
  const maxDate = slaDeadlineDate ? startOfDay(slaDeadlineDate) : undefined;

  const onSubmit = form.handleSubmit((values) => {
    const composed = composeIso(values.scheduledDate, values.scheduledTime);
    const body: ScheduleInstallBodyType = { scheduledAt: composed };
    const parsed = scheduleInstallSchema.safeParse(body);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "scheduledAt") {
          form.setError("scheduledTime", { message: issue.message });
        }
      }
      return;
    }
    // Check không vượt slaDeadline
    if (slaDeadlineDate && new Date(composed) > slaDeadlineDate) {
      form.setError("scheduledTime", {
        message: "Thời gian hẹn không được vượt quá hạn chót",
      });
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
          Lên lịch lắp đặt thiết bị
        </DialogTitle>
        <DialogDescription>
          Chốt thời điểm kỹ thuật viên tới lắp để chủ trang trại biết. Có thể
          bỏ qua nếu lắp ngay.
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
        {slaDeadlineDate && (
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Hạn lắp đặt
            </p>
            <p className="mt-1 font-medium">
              {format(slaDeadlineDate, "HH:mm dd/MM/yyyy", { locale: vi })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Thời gian hẹn phải trước hạn này.
            </p>
          </div>
        )}

        <form
          id="schedule-install-form"
          onSubmit={onSubmit}
          className="space-y-4"
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
                maxDate={maxDate}
              />
            )}
          />

          <Controller
            control={form.control}
            name="scheduledTime"
            rules={{ required: "Vui lòng chọn giờ hẹn" }}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="install-time">Giờ hẹn</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="install-time">
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
          form="schedule-install-form"
          disabled={mutation.isPending}
        >
          <CalendarClock className="h-4 w-4" />
          {mutation.isPending ? "Đang lưu..." : "Lên lịch lắp"}
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
