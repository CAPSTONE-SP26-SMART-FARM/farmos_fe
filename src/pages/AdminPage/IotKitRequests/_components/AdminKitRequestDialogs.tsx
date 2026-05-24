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
import { Textarea } from "@/components/ui/textarea";
import { DEVICE_STATUS_LABEL_ADMIN } from "@/constants/iotDeviceDisplay";
import {
  useClaimKitRequest,
  useCompleteInstall,
  useRejectKitRequest,
  useResolveFault,
  useStartInstall,
} from "@/queries/useIotKitRequest";
import {
  completeInstallSchema,
  rejectRequestSchema,
  resolveFaultSchema,
  type CompleteInstallBodyType,
  type KitRequestDetailResType,
  type RejectRequestBodyType,
  type ResolveFaultBodyType,
} from "@/schemaValidatation/iotKitRequest";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

/**
 * Dialog admin cho 1 kit request — gom các dialog vào 1 file.
 *
 * INSTALL_SCHEDULE (flow auto-create mới):
 *   - StartInstallDialog: confirm + preview N device sẽ flip purchase→install
 *   - CompleteInstallDialog: confirm + preview N device sẽ flip install→inactive
 *
 * FAULT_REPORT (flow cũ giữ nguyên):
 *   - ClaimRequestDialog
 *   - ResolveFaultDialog
 *   - RejectRequestDialog
 */

// ── INSTALL_SCHEDULE — Start install (bulk purchase → install) ────────

interface StartInstallProps {
  open: boolean;
  requestId: string;
  /** Preview list device đang ở purchase — để admin xác nhận trước khi flip. */
  devices: KitRequestDetailResType["devices"];
  onClose: () => void;
}

export function StartInstallDialog({
  open,
  requestId,
  devices,
  onClose,
}: StartInstallProps) {
  const mutation = useStartInstall();
  const purchaseDevices = devices.filter((d) => d.status === "purchase");
  const handleConfirm = () =>
    mutation.mutate(requestId, { onSuccess: () => onClose() });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && !mutation.isPending && onClose()}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bắt đầu lắp đặt</DialogTitle>
          <DialogDescription>
            <strong>{purchaseDevices.length}</strong> thiết bị đang chờ xuất kho
            sẽ được chuyển sang trạng thái <strong>Đang lắp đặt</strong>. Yêu
            cầu sẽ chuyển sang <strong>Đang xử lý</strong> và bạn trở thành
            người phụ trách.
          </DialogDescription>
        </DialogHeader>

        {purchaseDevices.length > 0 && (
          <DevicePreviewList devices={purchaseDevices} />
        )}

        {purchaseDevices.length === 0 && (
          <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            Không có thiết bị nào đang ở trạng thái chờ xuất kho. Có thể đã được
            xử lý từ trước.
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Quay lại
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={mutation.isPending || purchaseDevices.length === 0}
          >
            {mutation.isPending ? "Đang xử lý..." : "Xác nhận lắp đặt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── INSTALL_SCHEDULE — Complete install (bulk install → inactive) ─────

interface CompleteInstallProps {
  open: boolean;
  requestId: string;
  devices: KitRequestDetailResType["devices"];
  onClose: () => void;
}

function CompleteInstallForm({
  requestId,
  devices,
  onClose,
}: {
  requestId: string;
  devices: KitRequestDetailResType["devices"];
  onClose: () => void;
}) {
  const mutation = useCompleteInstall();
  const installDevices = devices.filter((d) => d.status === "install");
  const form = useForm<CompleteInstallBodyType>({
    resolver: zodResolver(completeInstallSchema),
    defaultValues: { resolutionNote: "" },
  });

  const onSubmit = form.handleSubmit((data) =>
    mutation.mutate(
      { id: requestId, body: data },
      { onSuccess: () => onClose() },
    ),
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>Báo lắp đặt hoàn tất</DialogTitle>
        <DialogDescription>
          <strong>{installDevices.length}</strong> thiết bị đang lắp sẽ chuyển
          sang trạng thái <strong>Chờ kích hoạt</strong>. Khi tất cả thiết bị
          đã chuyển xong, yêu cầu sẽ tự đóng (Đã xử lý).
        </DialogDescription>
      </DialogHeader>

      {installDevices.length > 0 && (
        <DevicePreviewList devices={installDevices} />
      )}

      {installDevices.length === 0 && (
        <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
          Không có thiết bị nào đang ở trạng thái lắp đặt để báo xong.
        </p>
      )}

      <form
        onSubmit={onSubmit}
        className="space-y-3"
      >
        <FieldGroup>
          <Controller
            control={form.control}
            name="resolutionNote"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="complete-note">
                  Ghi chú (tùy chọn)
                </FieldLabel>
                <Textarea
                  id="complete-note"
                  {...field}
                  value={field.value ?? ""}
                  rows={3}
                  placeholder="VD: Đã lắp xong, đang kiểm tra kết nối WiFi cho từng kit."
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
            Quay lại
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending || installDevices.length === 0}
          >
            {mutation.isPending ? "Đang xử lý..." : "Xác nhận lắp xong"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function CompleteInstallDialog({
  open,
  requestId,
  devices,
  onClose,
}: CompleteInstallProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogContent className="max-w-lg">
        {open ? (
          <CompleteInstallForm
            key={requestId}
            requestId={requestId}
            devices={devices}
            onClose={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// ── FAULT_REPORT — Claim ────────────────────────────────────────────────

interface ClaimProps {
  open: boolean;
  requestId: string;
  onClose: () => void;
}

export function ClaimRequestDialog({ open, requestId, onClose }: ClaimProps) {
  const mutation = useClaimKitRequest();
  const handleConfirm = () =>
    mutation.mutate(requestId, { onSuccess: () => onClose() });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && !mutation.isPending && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nhận xử lý yêu cầu</DialogTitle>
          <DialogDescription>
            Yêu cầu sẽ được gán cho bạn và chuyển sang trạng thái{" "}
            <strong>Đang xử lý</strong>. Owner sẽ thấy bạn là người phụ trách.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Quay lại
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Đang xử lý..." : "Nhận xử lý"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── FAULT_REPORT — Resolve ──────────────────────────────────────────────

interface ResolveProps {
  open: boolean;
  requestId: string;
  onClose: () => void;
}

function ResolveFaultForm({
  requestId,
  onClose,
}: {
  requestId: string;
  onClose: () => void;
}) {
  const mutation = useResolveFault();
  const form = useForm<ResolveFaultBodyType>({
    resolver: zodResolver(resolveFaultSchema),
    defaultValues: { resolutionNote: "" },
  });

  const onSubmit = form.handleSubmit((data) =>
    mutation.mutate(
      { id: requestId, body: data },
      { onSuccess: () => onClose() },
    ),
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>Đánh dấu đã xử lý</DialogTitle>
        <DialogDescription>
          Sau khi xác nhận, owner sẽ nhận thông báo yêu cầu đã được giải quyết.
        </DialogDescription>
      </DialogHeader>
      <form
        onSubmit={onSubmit}
        className="space-y-3"
      >
        <FieldGroup>
          <Controller
            control={form.control}
            name="resolutionNote"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="resolve-note">Ghi chú xử lý</FieldLabel>
                <Textarea
                  id="resolve-note"
                  {...field}
                  rows={4}
                  placeholder="VD: Đã thay vi xử lý mới và kiểm tra hoạt động ổn định."
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
            Quay lại
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Đang xử lý..." : "Đánh dấu đã xử lý"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function ResolveFaultDialog({ open, requestId, onClose }: ResolveProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogContent>
        {open ? (
          <ResolveFaultForm
            key={requestId}
            requestId={requestId}
            onClose={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// ── FAULT_REPORT — Reject ───────────────────────────────────────────────

interface RejectProps {
  open: boolean;
  requestId: string;
  onClose: () => void;
}

function RejectRequestForm({
  requestId,
  onClose,
}: {
  requestId: string;
  onClose: () => void;
}) {
  const mutation = useRejectKitRequest();
  const form = useForm<RejectRequestBodyType>({
    resolver: zodResolver(rejectRequestSchema),
    defaultValues: { reason: "" },
  });

  const onSubmit = form.handleSubmit((data) =>
    mutation.mutate(
      { id: requestId, body: data },
      { onSuccess: () => onClose() },
    ),
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>Từ chối yêu cầu báo lỗi</DialogTitle>
        <DialogDescription>
          Cho owner biết lý do để họ điều chỉnh hoặc tạo yêu cầu mới phù hợp
          hơn.
        </DialogDescription>
      </DialogHeader>
      <form
        onSubmit={onSubmit}
        className="space-y-3"
      >
        <FieldGroup>
          <Controller
            control={form.control}
            name="reason"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="admin-reject-reason">Lý do</FieldLabel>
                <Textarea
                  id="admin-reject-reason"
                  {...field}
                  rows={4}
                  placeholder="VD: Yêu cầu trùng với yêu cầu trước, vui lòng theo dõi yêu cầu đó..."
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
            Quay lại
          </Button>
          <Button
            type="submit"
            variant="destructive"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Đang xử lý..." : "Từ chối yêu cầu"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function RejectRequestDialog({ open, requestId, onClose }: RejectProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogContent>
        {open ? (
          <RejectRequestForm
            key={requestId}
            requestId={requestId}
            onClose={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// ── Shared — Device preview list ────────────────────────────────────────

function DevicePreviewList({
  devices,
}: {
  devices: KitRequestDetailResType["devices"];
}) {
  const PREVIEW_MAX = 8;
  const previewItems = devices.slice(0, PREVIEW_MAX);
  const remaining = Math.max(0, devices.length - previewItems.length);
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">Xem trước thiết bị:</p>
      <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md border bg-muted/30 p-2 text-sm">
        {previewItems.map((d) => (
          <li
            key={d.id}
            className="flex flex-wrap items-center gap-2"
          >
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
          </li>
        ))}
      </ul>
      {remaining > 0 && (
        <p className="text-xs text-muted-foreground">
          ... và {remaining} thiết bị khác.
        </p>
      )}
    </div>
  );
}
