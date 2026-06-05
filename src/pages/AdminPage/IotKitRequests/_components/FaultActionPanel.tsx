import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClaimKitRequest } from "@/queries/useIotKitRequest";
import { type KitRequestDetailResType } from "@/schemaValidatation/iotKitRequest";
import { useAuthStore } from "@/stores/authStore";
import { SwapActionPanel } from "./SwapActionPanel";

/**
 * Panel inline cho toàn bộ vòng đời FAULT_REPORT — gom các dialog lồng
 * (Claim / Reject / Swap) vào card trong cùng dialog chi tiết.
 *
 *   - pending                   → card Tiếp nhận (nhận xử lý)
 *   - in_progress (mình)        → luồng thay thiết bị (lên lịch thay → hoàn tất thay)
 *   - terminal / không phụ trách → không render (readonly)
 */

interface Props {
  request: KitRequestDetailResType;
  onClose: () => void;
}

export function FaultActionPanel({ request, onClose }: Props) {
  const me = useAuthStore((s) => s.user);
  const isMyHandler = request.handlerId === me?.id;
  const faultyDeviceId = request.iotDeviceId ?? null;

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

  // Đang phụ trách → luồng thay thiết bị (lên lịch thay → hoàn tất thay).
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
