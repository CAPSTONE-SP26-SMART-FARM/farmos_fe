import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ClipboardCheck, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import {
  useClaimKitRequest,
  useResolveFault,
} from "@/queries/useIotKitRequest";
import {
  resolveFaultSchema,
  type KitRequestDetailResType,
  type ResolveFaultBodyType,
} from "@/schemaValidatation/iotKitRequest";
import { useAuthStore } from "@/stores/authStore";
import { SwapActionPanel } from "./SwapActionPanel";

/**
 * Panel inline cho toàn bộ vòng đời FAULT_REPORT — gom các dialog lồng
 * (Claim / Reject / Resolve / Swap) vào card trong cùng dialog chi tiết.
 *
 *   - pending                          → card Tiếp nhận (nhận xử lý)
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
      <Wrapper sectionTitle="Xử lý báo lỗi">
        <ClaimCard
          request={request}
          onClose={onClose}
        />
      </Wrapper>
    );
  }

  if (request.status !== "in_progress") return null;

  if (!isMyHandler) {
    return (
      <Wrapper sectionTitle="Xử lý báo lỗi">
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          Yêu cầu này do người khác phụ trách — chỉ người phụ trách mới xử lý
          được.
        </p>
      </Wrapper>
    );
  }

  // Đã lên lịch thay → một cột, chỉ luồng thay thiết bị.
  if (hasSwapScheduled) {
    return (
      <Wrapper sectionTitle="Thay thiết bị">
        <SwapActionPanel
          request={request}
          faultyDeviceId={faultyDeviceId}
          onClose={onClose}
        />
      </Wrapper>
    );
  }

  // Chưa lên lịch thay → xử lý nhanh hoặc lên lịch thay (2 cột desktop).
  return (
    <Wrapper sectionTitle="Xử lý báo lỗi">
      <div className="divide-y overflow-hidden rounded-md border md:grid md:grid-cols-2 md:items-start md:divide-x md:divide-y-0">
        <div className="min-w-0 p-4">
          <ResolveCard
            request={request}
            onClose={onClose}
          />
        </div>
        <div className="min-w-0 p-4">
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

function Wrapper({
  sectionTitle,
  children,
}: {
  sectionTitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 space-y-3 border-t pt-4">
      <p className="text-sm font-medium">{sectionTitle}</p>
      {children}
    </div>
  );
}

// ── Card: Tiếp nhận (nhận xử lý) ──────────────────────────────────────────

function ClaimCard({ request, onClose }: Props) {
  const claimMutation = useClaimKitRequest();

  const handleClaim = () =>
    claimMutation.mutate(request.id, { onSuccess: () => onClose() });

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
            Nhận xử lý để được gán phụ trách yêu cầu này.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          disabled={claimMutation.isPending}
          onClick={handleClaim}
        >
          <ClipboardCheck className="h-4 w-4" />
          {claimMutation.isPending ? "Đang xử lý..." : "Nhận xử lý"}
        </Button>
      </div>
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
