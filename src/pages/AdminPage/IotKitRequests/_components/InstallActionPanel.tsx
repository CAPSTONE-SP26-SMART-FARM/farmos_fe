import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { startOfDay, format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarClock, PackageCheck, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
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
import {
  useCompleteInstall,
  useScheduleInstall,
  useStartInstall,
} from "@/queries/useIotKitRequest";
import {
  scheduleInstallSchema,
  type KitRequestDetailResType,
} from "@/schemaValidatation/iotKitRequest";
import { useAuthStore } from "@/stores/authStore";
import {
  KIT_TIME_SLOTS,
  ScheduledSummary,
  StepBadge,
  composeKitScheduleIso,
} from "./kitActionPanelShared";

/**
 * Panel inline (trong detail dialog) cho flow INSTALL_SCHEDULE — 3 bước tuần tự,
 * mỗi lúc chỉ hiện đúng thẻ của bước đang tới:
 *
 *   1. "Đặt lịch": chọn ngày/giờ hẹn → scheduleInstall (chỉ chốt giờ, chưa đụng
 *      thiết bị).
 *   2. "Bắt đầu lắp": đã có lịch → chọn thiết bị → startInstall (flip thiết bị
 *      sang Đang lắp đặt).
 *   3. "Báo lắp xong": chọn thiết bị đã lắp xong → completeInstall.
 */

type DeviceItem = KitRequestDetailResType["devices"][number];

interface Props {
  request: KitRequestDetailResType;
  onClose: () => void;
}

export function InstallActionPanel({ request, onClose }: Props) {
  const devices = useMemo(() => request.devices ?? [], [request.devices]);

  const purchaseDevices = useMemo(
    () => devices.filter((d) => d.status === "purchase"),
    [devices],
  );
  const installDevices = useMemo(
    () => devices.filter((d) => d.status === "install"),
    [devices],
  );

  if (purchaseDevices.length === 0 && installDevices.length === 0) return null;

  // Còn thiết bị chờ lắp: chưa hẹn giờ → 'schedule', đã hẹn → 'start'.
  // Hết thiết bị chờ lắp → 'complete'.
  const stage: "schedule" | "start" | "complete" =
    purchaseDevices.length > 0
      ? request.scheduledAt
        ? "start"
        : "schedule"
      : "complete";

  return (
    <div className="mt-4 space-y-3 border-t pt-4">
      <p className="text-sm font-medium">Lắp đặt thiết bị</p>
      {stage === "schedule" && <ScheduleInstallCard request={request} />}
      {stage === "start" && (
        <StartInstallCard
          key={`start:${purchaseDevices.map((d) => d.id).join(",")}`}
          request={request}
          devices={purchaseDevices}
        />
      )}
      {stage === "complete" && (
        <CompleteInstallCard
          key={`complete:${installDevices.map((d) => d.id).join(",")}`}
          request={request}
          devices={installDevices}
          onClose={onClose}
        />
      )}
    </div>
  );
}

// ── Bước 1: Đặt lịch — chỉ chốt giờ hẹn, chưa đụng thiết bị ───────────────

function ScheduleInstallCard({
  request,
}: {
  request: KitRequestDetailResType;
}) {
  const scheduleMutation = useScheduleInstall();
  const isPending = scheduleMutation.isPending;

  const form = useForm<{ scheduledDate: string; scheduledTime: string }>({
    defaultValues: { scheduledDate: "", scheduledTime: "" },
  });

  const today = useMemo(() => startOfDay(new Date()), []);
  const slaDeadlineDate = request.slaDeadline
    ? new Date(request.slaDeadline)
    : null;
  const maxDate = slaDeadlineDate ? startOfDay(slaDeadlineDate) : undefined;

  // Submit: chốt giờ hẹn. Không đóng panel — sau khi có lịch request refetch
  // sang bước "Bắt đầu lắp".
  const onSubmit = form.handleSubmit(async (values) => {
    const composed = composeKitScheduleIso(
      values.scheduledDate,
      values.scheduledTime,
    );
    const parsed = scheduleInstallSchema.safeParse({ scheduledAt: composed });
    if (!parsed.success) {
      form.setError("scheduledTime", {
        message: parsed.error.issues[0]?.message ?? "Thời gian hẹn không hợp lệ",
      });
      return;
    }
    if (slaDeadlineDate && new Date(composed) > slaDeadlineDate) {
      form.setError("scheduledTime", {
        message: "Thời gian hẹn không được vượt quá hạn chót",
      });
      return;
    }
    try {
      await scheduleMutation.mutateAsync({ id: request.id, body: parsed.data });
    } catch {
      // Toast lỗi đã do hook xử lý.
    }
  });

  return (
    <div className="rounded-md border p-4">
      <div className="mb-3 flex items-center gap-2">
        <StepBadge active>1</StepBadge>
        <div>
          <p className="font-medium">Đặt lịch lắp đặt</p>
          <p className="text-xs text-muted-foreground">
            Chốt ngày giờ hẹn lắp đặt trước khi tiến hành.
          </p>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-3"
      >
        {slaDeadlineDate && (
          <p className="text-xs text-muted-foreground">
            Hạn lắp đặt:{" "}
            {format(slaDeadlineDate, "HH:mm dd/MM/yyyy", { locale: vi })} — hẹn
            phải trước hạn này.
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2 md:items-start">
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
              <div className="space-y-1">
                <Label htmlFor="install-time">Giờ hẹn</Label>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="install-time"
                    className="w-full"
                  >
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
                  <p className="text-destructive text-xs">
                    {fieldState.error.message}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Khung giờ làm việc 07:00 – 18:00, cách 15 phút.
                  </p>
                )}
              </div>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isPending}
          >
            <CalendarClock className="h-4 w-4" />
            {isPending ? "Đang xử lý..." : "Lên lịch lắp đặt"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ── Bước 2: Bắt đầu lắp — đã có lịch, chỉ flip thiết bị sang Đang lắp ──────

function StartInstallCard({
  request,
  devices,
}: {
  request: KitRequestDetailResType;
  devices: DeviceItem[];
}) {
  const startMutation = useStartInstall();
  const isPending = startMutation.isPending;

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(devices.map((d) => d.id)),
  );

  const allChecked =
    devices.length > 0 && devices.every((d) => selected.has(d.id));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(devices.map((d) => d.id)));

  // Submit: flip thiết bị đã chọn sang Đang lắp đặt. Không đóng panel — request
  // refetch sang bước "Báo lắp xong".
  const handleSubmit = () => {
    const deviceIds = devices
      .filter((d) => selected.has(d.id))
      .map((d) => d.id);
    if (deviceIds.length === 0) return;
    startMutation.mutate({ id: request.id, body: { deviceIds } });
  };

  return (
    <div className="rounded-md border p-4">
      <div className="mb-3 flex items-center gap-2">
        <StepBadge active>2</StepBadge>
        <div>
          <p className="font-medium">Bắt đầu lắp đặt</p>
          <p className="text-xs text-muted-foreground">
            Chọn thiết bị để chuyển sang Đang lắp đặt.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {request.scheduledAt && (
          <ScheduledSummary
            title="Đã hẹn lắp đặt"
            scheduledAt={request.scheduledAt}
          />
        )}

        <DeviceChecklist
          devices={devices}
          selected={selected}
          allChecked={allChecked}
          onToggle={toggle}
          onToggleAll={toggleAll}
        />

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || selected.size === 0}
          >
            <Wrench className="h-4 w-4" />
            {isPending
              ? "Đang xử lý..."
              : `Bắt đầu lắp đặt (${selected.size})`}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Bước 3: Báo lắp xong ─────────────────────────────────────────────────

function CompleteInstallCard({
  request,
  devices,
  onClose,
}: {
  request: KitRequestDetailResType;
  devices: DeviceItem[];
  onClose: () => void;
}) {
  const me = useAuthStore((s) => s.user);
  const completeMutation = useCompleteInstall();
  const isMyHandler = request.handlerId === me?.id;

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(devices.map((d) => d.id)),
  );
  const [note, setNote] = useState("");

  const allChecked =
    devices.length > 0 && devices.every((d) => selected.has(d.id));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(devices.map((d) => d.id)));

  const handleSubmit = () => {
    const deviceIds = devices
      .filter((d) => selected.has(d.id))
      .map((d) => d.id);
    if (deviceIds.length === 0) return;
    completeMutation.mutate(
      { id: request.id, body: { deviceIds, resolutionNote: note || undefined } },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <div className="rounded-md border p-4">
      <div className="mb-3 flex items-center gap-2">
        <StepBadge active>3</StepBadge>
        <div>
          <p className="font-medium">Báo lắp đặt hoàn tất</p>
          <p className="text-xs text-muted-foreground">
            Chọn thiết bị đã lắp xong để chốt.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid gap-4 md:grid-cols-2 md:items-start">
          <DeviceChecklist
            devices={devices}
            selected={selected}
            allChecked={allChecked}
            onToggle={toggle}
            onToggleAll={toggleAll}
          />

          <div className="space-y-3">
            <Field>
              <FieldLabel htmlFor="complete-note">Ghi chú (tùy chọn)</FieldLabel>
              <Textarea
                id="complete-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={5}
                placeholder="VD: Đã lắp xong, đang kiểm tra kết nối WiFi cho từng kit."
              />
            </Field>

            {!isMyHandler && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Chỉ người phụ trách yêu cầu mới được báo lắp xong.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              completeMutation.isPending || selected.size === 0 || !isMyHandler
            }
          >
            <PackageCheck className="h-4 w-4" />
            {completeMutation.isPending
              ? "Đang xử lý..."
              : `Xác nhận lắp xong (${selected.size})`}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Danh sách checkbox thiết bị (dùng chung 2 bước) ───────────────────────

function DeviceChecklist({
  devices,
  selected,
  allChecked,
  onToggle,
  onToggleAll,
}: {
  devices: DeviceItem[];
  selected: Set<string>;
  allChecked: boolean;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
}) {
  return (
    <div className="space-y-2">
      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-medium">
        <Checkbox
          checked={allChecked}
          onCheckedChange={onToggleAll}
          aria-label="Chọn tất cả thiết bị"
        />
        Chọn tất cả ({selected.size}/{devices.length})
      </label>

      <ul className="max-h-52 space-y-0.5 overflow-y-auto rounded-md border bg-muted/30 p-2">
        {devices.map((d) => (
          <li key={d.id}>
            <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-muted/60">
              <Checkbox
                checked={selected.has(d.id)}
                onCheckedChange={() => onToggle(d.id)}
                aria-label={`Chọn ${d.label ?? d.deviceName}`}
              />
              <span className="font-mono font-medium">
                {d.label ?? d.deviceName}
              </span>
              {d.zoneName && (
                <span className="text-xs text-muted-foreground">
                  · {d.zoneName}
                </span>
              )}
              <span className="ml-auto text-xs text-muted-foreground">
                {DEVICE_STATUS_LABEL_ADMIN[d.status] ?? d.status}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
