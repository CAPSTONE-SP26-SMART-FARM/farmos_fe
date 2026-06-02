import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Cpu, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useCompleteSwapInstall,
  useStartSwapInstall,
} from "@/queries/useIotKitRequest";
import { useAdminIotDeviceDetail } from "@/queries/useIotDevice";
import {
  completeSwapInstallSchema,
  type CompleteSwapInstallBodyType,
  type KitRequestDetailResType,
} from "@/schemaValidatation/iotKitRequest";

/**
 * 2 card cho luồng lắp board mới SAU swap — tách khỏi "xác nhận đã thay" để
 * đổi trạng thái thiết bị thành bước riêng. Panel cha chọn card theo trạng thái
 * board mới: purchase → bắt đầu lắp; install → hoàn tất lắp.
 */

interface Props {
  request: KitRequestDetailResType;
  onClose: () => void;
}

function ReplacementDeviceBox({ replacementId }: { replacementId: string }) {
  const query = useAdminIotDeviceDetail(replacementId, !!replacementId);
  const device = query.data?.data ?? null;
  return (
    <div className="mb-3 rounded-md border bg-emerald-50/40 p-3 dark:bg-emerald-950/20">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        Thiết bị mới
      </p>
      {query.isLoading ? (
        <Skeleton className="mt-1 h-5 w-2/3" />
      ) : device ? (
        <div className="mt-1 flex items-center gap-2">
          <Cpu
            aria-hidden="true"
            className="h-4 w-4 text-muted-foreground"
          />
          <span className="font-medium">{device.label ?? device.deviceName}</span>
          {device.label && device.label !== device.deviceName ? (
            <span className="text-sm text-muted-foreground">
              {device.deviceName}
            </span>
          ) : null}
        </div>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">
          Đã đặt riêng cho yêu cầu này
        </p>
      )}
    </div>
  );
}

// ── Bắt đầu lắp board mới (purchase → install) ───────────────────────────

export function StartSwapInstallCard({ request, onClose }: Props) {
  const mutation = useStartSwapInstall();
  const replacementId = request.metadata?.replacementDeviceId ?? null;

  return (
    <div className="rounded-md border p-4">
      <div className="mb-3 flex items-center gap-2">
        <PackagePlus
          aria-hidden="true"
          className="h-4 w-4 text-muted-foreground"
        />
        <div>
          <p className="font-medium">Bắt đầu lắp thiết bị mới</p>
          <p className="text-xs text-muted-foreground">
            Đã thay xong tại hiện trường. Bấm để bắt đầu lắp đặt thiết bị mới
            cho khu vực.
          </p>
        </div>
      </div>

      {replacementId && <ReplacementDeviceBox replacementId={replacementId} />}

      <div className="flex justify-end">
        <Button
          type="button"
          disabled={mutation.isPending}
          onClick={() =>
            mutation.mutate({ id: request.id }, { onSuccess: () => onClose() })
          }
        >
          <PackagePlus className="h-4 w-4" />
          {mutation.isPending ? "Đang xử lý..." : "Bắt đầu lắp"}
        </Button>
      </div>
    </div>
  );
}

// ── Hoàn tất lắp board mới (install → inactive) ──────────────────────────

export function CompleteSwapInstallCard({ request, onClose }: Props) {
  const mutation = useCompleteSwapInstall();
  const replacementId = request.metadata?.replacementDeviceId ?? null;

  const form = useForm<CompleteSwapInstallBodyType>({
    resolver: zodResolver(completeSwapInstallSchema),
    defaultValues: { resolutionNote: "" },
  });

  const onSubmit = form.handleSubmit((values) =>
    mutation.mutate(
      { id: request.id, body: values },
      { onSuccess: () => onClose() },
    ),
  );

  return (
    <div className="rounded-md border p-4">
      <div className="mb-3 flex items-center gap-2">
        <CheckCircle2
          aria-hidden="true"
          className="h-4 w-4 text-muted-foreground"
        />
        <div>
          <p className="font-medium">Hoàn tất lắp thiết bị mới</p>
          <p className="text-xs text-muted-foreground">
            Xác nhận đã lắp xong. Thiết bị sẽ tự kích hoạt khi gửi dữ liệu đầu
            tiên.
          </p>
        </div>
      </div>

      {replacementId && <ReplacementDeviceBox replacementId={replacementId} />}

      <form
        onSubmit={onSubmit}
        className="space-y-3"
      >
        <Controller
          control={form.control}
          name="resolutionNote"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="complete-swap-install-note">
                Ghi chú xử lý (tùy chọn)
              </FieldLabel>
              <Textarea
                id="complete-swap-install-note"
                {...field}
                value={field.value ?? ""}
                rows={3}
                placeholder="VD: Đã lắp xong, thiết bị mới chạy ổn."
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
            disabled={mutation.isPending}
          >
            <CheckCircle2 className="h-4 w-4" />
            {mutation.isPending ? "Đang xử lý..." : "Hoàn tất lắp đặt"}
          </Button>
        </div>
      </form>
    </div>
  );
}
