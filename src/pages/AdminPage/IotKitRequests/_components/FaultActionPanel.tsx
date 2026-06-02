import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ClipboardCheck, Wrench, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import {
  useClaimKitRequest,
  useRejectKitRequest,
  useResolveFault,
} from "@/queries/useIotKitRequest";
import {
  rejectRequestSchema,
  resolveFaultSchema,
  type KitRequestDetailResType,
  type RejectRequestBodyType,
  type ResolveFaultBodyType,
} from "@/schemaValidatation/iotKitRequest";
import { useAuthStore } from "@/stores/authStore";
import { SwapActionPanel } from "./SwapActionPanel";

/**
 * Panel inline cho toàn bộ vòng đời FAULT_REPORT — gom các dialog lồng
 * (Claim / Reject / Resolve / Swap) vào card trong cùng dialog chi tiết.
 *
 *   - pending                          → card Tiếp nhận (nhận xử lý / từ chối)
 *   - in_progress (mình) + chưa lên lịch thay → card Xử lý nhanh + card Thay thiết bị
 *   - in_progress (mình) + đã lên lịch thay   → card Hoàn tất thay
 *   - terminal / không phụ trách        → không render (readonly)
 */

interface Props {
  request: KitRequestDetailResType;
  onClose: () => void;
}

export function FaultActionPanel({ request, onClose }: Props) {
  const me = useAuthStore((s) => s.user);
  const isMyHandler = request.handlerId === me?.id;
  const faultyDeviceId = request.iotDeviceId ?? null;
  const hasSwapScheduled = !!request.metadata?.replacementDeviceId;

  if (request.status === "pending") {
    return (
      <Wrapper>
        <ClaimRejectCard
          request={request}
          onClose={onClose}
        />
      </Wrapper>
    );
  }

  if (request.status !== "in_progress") return null;

  if (!isMyHandler) {
    return (
      <Wrapper>
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          Yêu cầu này do người khác phụ trách — chỉ người phụ trách mới xử lý
          được.
        </p>
      </Wrapper>
    );
  }

  // Đã lên lịch thay → bắt buộc hoàn tất thay (không cho resolve thường).
  if (hasSwapScheduled) {
    return (
      <Wrapper>
        <SwapActionPanel
          request={request}
          faultyDeviceId={faultyDeviceId}
          onClose={onClose}
        />
      </Wrapper>
    );
  }

  // Chưa lên lịch thay → 2 lựa chọn: xử lý nhanh hoặc lên lịch thay thiết bị.
  return (
    <Wrapper>
      <div className="divide-y overflow-hidden rounded-md border md:grid md:grid-cols-2 md:divide-x md:divide-y-0">
        <div className="p-4">
          <ResolveCard
            request={request}
            onClose={onClose}
          />
        </div>
        <div className="p-4">
          <SwapActionPanel
            request={request}
            faultyDeviceId={faultyDeviceId}
            onClose={onClose}
          />
        </div>
      </div>
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 space-y-3 border-t pt-4">
      <p className="text-sm font-medium">Xử lý báo lỗi</p>
      {children}
    </div>
  );
}

// ── Card: Tiếp nhận (nhận xử lý / từ chối) ────────────────────────────────

function ClaimRejectCard({ request, onClose }: Props) {
  const claimMutation = useClaimKitRequest();
  const rejectMutation = useRejectKitRequest();
  const [mode, setMode] = useState<"idle" | "rejecting">("idle");

  const form = useForm<RejectRequestBodyType>({
    resolver: zodResolver(rejectRequestSchema),
    defaultValues: { reason: "" },
  });

  const handleClaim = () =>
    claimMutation.mutate(request.id, { onSuccess: () => onClose() });

  const handleReject = form.handleSubmit((data) =>
    rejectMutation.mutate(
      { id: request.id, body: data },
      { onSuccess: () => onClose() },
    ),
  );

  const busy = claimMutation.isPending || rejectMutation.isPending;

  return (
    <div className="rounded-md border p-4">
      <div className="mb-3 flex items-center gap-2">
        <ClipboardCheck
          aria-hidden="true"
          className="h-4 w-4 text-muted-foreground"
        />
        <div>
          <p className="font-medium">Tiếp nhận yêu cầu</p>
          <p className="text-xs text-muted-foreground">
            Nhận xử lý để được gán phụ trách, hoặc từ chối nếu yêu cầu không hợp
            lệ.
          </p>
        </div>
      </div>

      {mode === "idle" ? (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => setMode("rejecting")}
          >
            <XCircle className="h-4 w-4" />
            Từ chối
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={handleClaim}
          >
            <ClipboardCheck className="h-4 w-4" />
            {claimMutation.isPending ? "Đang xử lý..." : "Nhận xử lý"}
          </Button>
        </div>
      ) : (
        <form
          onSubmit={handleReject}
          className="space-y-3"
        >
          <Controller
            control={form.control}
            name="reason"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="reject-reason">Lý do từ chối</FieldLabel>
                <Textarea
                  id="reject-reason"
                  {...field}
                  rows={3}
                  placeholder="VD: Yêu cầu trùng với yêu cầu trước, vui lòng theo dõi yêu cầu đó."
                />
                {fieldState.error ? (
                  <FieldError>{fieldState.error.message}</FieldError>
                ) : null}
              </Field>
            )}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                form.reset();
                setMode("idle");
              }}
            >
              Quay lại
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={busy}
            >
              {rejectMutation.isPending ? "Đang xử lý..." : "Từ chối yêu cầu"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Card: Xử lý nhanh (resolve không thay thiết bị) ───────────────────────

function ResolveCard({ request, onClose }: Props) {
  const mutation = useResolveFault();
  const form = useForm<ResolveFaultBodyType>({
    resolver: zodResolver(resolveFaultSchema),
    defaultValues: { resolutionNote: "" },
  });

  const onSubmit = form.handleSubmit((data) =>
    mutation.mutate(
      { id: request.id, body: data },
      { onSuccess: () => onClose() },
    ),
  );

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Wrench
          aria-hidden="true"
          className="h-4 w-4 text-muted-foreground"
        />
        <div>
          <p className="font-medium">Xử lý nhanh tại chỗ</p>
          <p className="text-xs text-muted-foreground">
            Đã khắc phục mà không cần thay thiết bị — ghi chú rồi đánh dấu xong.
          </p>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-3"
      >
        <Controller
          control={form.control}
          name="resolutionNote"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="resolve-note">Ghi chú xử lý</FieldLabel>
              <Textarea
                id="resolve-note"
                {...field}
                rows={3}
                placeholder="VD: Đã khởi động lại và kiểm tra kết nối, thiết bị hoạt động ổn định."
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
            {mutation.isPending ? "Đang xử lý..." : "Đánh dấu đã xử lý"}
          </Button>
        </div>
      </form>
    </div>
  );
}
