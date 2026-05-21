import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, ExternalLink, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingCard from "@/components/common/LoadingCard";
import ErrorState from "@/components/common/ErrorState";
import { DEVICE_TYPE_LABEL, STATUS_META } from "@/constants/iotDeviceDisplay";
import {
  useAdminDecisionContext,
  useAdminSwapBoard,
} from "@/queries/useIotDeviceAdminOps";
import { useAdminUnassignIotOwner } from "@/queries/useIotDevice";
import { cn } from "@/lib/utils";
import { DecisionOwnerCard } from "./_components/decision/DecisionOwnerCard";
import { DecisionActionPanel } from "./_components/decision/DecisionActionPanel";
import { DecisionSwapConfirm } from "./_components/decision/DecisionSwapConfirm";
import { DecisionRevokeOwnerAlert } from "./_components/decision/DecisionRevokeOwnerAlert";
import { DecisionLocationHeader } from "./_components/decision/DecisionLocationHeader";
import {
  DecisionCompletionBanner,
  type DecisionCompletedAction,
} from "./_components/decision/DecisionCompletionBanner";

export default function AdminIotDeviceDecisionPage() {
  const navigate = useNavigate();
  const { deviceId = "" } = useParams<{ deviceId: string }>();

  const ctxQuery = useAdminDecisionContext(deviceId);
  const ctx = ctxQuery.data?.data;

  const swapMutation = useAdminSwapBoard();
  const unassignMutation = useAdminUnassignIotOwner();

  const firstEligibleId = useMemo(
    () => ctx?.swap.topCandidates.find((c) => c.isEligible)?.id ?? null,
    [ctx?.swap.topCandidates],
  );

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
    null,
  );
  const [swapOpen, setSwapOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [completedAction, setCompletedAction] =
    useState<DecisionCompletedAction | null>(null);

  // Khi data load xong, default chọn candidate đủ điều kiện đầu tiên.
  // Trước đây dùng useMemo cho side-effect — sai pattern.
  useEffect(() => {
    if (!selectedCandidateId && firstEligibleId) {
      setSelectedCandidateId(firstEligibleId);
    }
  }, [firstEligibleId, selectedCandidateId]);

  if (ctxQuery.isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <LoadingCard rows={4} />
        <LoadingCard rows={6} />
      </div>
    );
  }

  if (ctxQuery.isError || !ctx) {
    return (
      <div className="p-4 md:p-6">
        <ErrorState
          message="Không thể tải dữ liệu thiết bị. Vui lòng thử lại."
          onRetry={() => ctxQuery.refetch()}
        />
      </div>
    );
  }

  const statusMeta = STATUS_META[ctx.device.status];
  const deviceTypeLabel =
    DEVICE_TYPE_LABEL[ctx.device.deviceType] ?? ctx.device.deviceType;
  const deviceIdentity =
    ctx.device.label ?? ctx.device.deviceName ?? "Thiết bị";

  const selectedCandidate =
    ctx.swap.topCandidates.find((c) => c.id === selectedCandidateId) ?? null;

  const handleConfirmSwap = () => {
    if (!selectedCandidateId) return;
    swapMutation.mutate(
      { oldBoardId: deviceId, newBoardId: selectedCandidateId },
      {
        onSuccess: () => {
          setSwapOpen(false);
          setCompletedAction("swap");
          ctxQuery.refetch();
        },
      },
    );
  };

  const handleConfirmRevoke = () => {
    unassignMutation.mutate(
      {
        iotDeviceId: deviceId,
        reason: "Admin gỡ phân bổ qua trang quyết định",
      },
      {
        onSuccess: () => {
          setRevokeOpen(false);
          setCompletedAction("revoke");
          ctxQuery.refetch();
        },
      },
    );
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* ── Top nav ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard/admin/iot-devices")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
          Quay lại danh sách
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={`/dashboard/admin/iot-devices/${deviceId}`}>
              <ExternalLink className="mr-1 h-4 w-4" aria-hidden />
              Chi tiết thiết bị
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link
              to={`/dashboard/admin/iot-devices/${deviceId}/timeline`}
              aria-label="Xem lịch sử thiết bị"
            >
              <History className="mr-1 h-4 w-4" aria-hidden />
              Xem lịch sử
            </Link>
          </Button>
        </div>
      </div>

      {completedAction && (
        <DecisionCompletionBanner
          action={completedAction}
          deviceId={deviceId}
          onDismiss={() => setCompletedAction(null)}
        />
      )}

      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">
          Quyết định xử lý thiết bị
        </p>
        <p className="text-sm text-muted-foreground">
          Đọc mùa vụ và chủ trang trại bị ảnh hưởng trước, sau đó thay vi xử lý
          khi thiết bị lỗi hoặc gỡ phân bổ nếu cần.
        </p>
      </div>

      {/* ── Header rich (gom mọi meta — không lặp ở card khác) ─── */}
      {/*
        Trước đây có thêm DeviceInfoCard render lại name/label/status/error —
        cùng dữ liệu hiển thị 2-3 lần. Gom toàn bộ về header này:
          - Mã ngắn (label) như badge nổi bật
          - Tên thiết bị
          - Loại thiết bị
          - Status badge có icon
          - Tuổi lỗi (chỉ khi status=error)
      */}
      <div className="flex flex-wrap items-center gap-2">
        {ctx.device.label && (
          <span className="inline-flex items-center rounded-md border-2 border-primary bg-primary px-2 py-0.5 font-mono text-base font-extrabold tracking-wider text-primary-foreground shadow-sm">
            {ctx.device.label}
          </span>
        )}
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          {ctx.device.deviceName}
        </h1>
        <span className="text-sm text-muted-foreground">{deviceTypeLabel}</span>
        <Badge
          variant="outline"
          className={cn("ml-2 gap-1", statusMeta.badgeClass)}
        >
          <statusMeta.icon className="h-3.5 w-3.5" aria-hidden />
          {statusMeta.labelAdmin}
        </Badge>
        {ctx.device.status === "error" && ctx.errorContext && (
          <span className="text-sm font-medium text-destructive">
            đã lỗi {ctx.errorContext.ageDays} ngày
          </span>
        )}
      </div>

      {/*
        Vị trí/nông trại là ngữ cảnh phân bổ HIỆN TẠI. Khi thiết bị không còn
        chủ trang trại (status `available` — đã trả về kho cho thuê tiếp),
        `deviceLocation` mà BE trả về chỉ là nông trại cũ → ẩn để tránh hiểu
        nhầm thiết bị vẫn đang ở farm đó.
      */}
      {ctx.owner && ctx.deviceLocation && (
        <DecisionLocationHeader
          location={ctx.deviceLocation}
          ownerName={ctx.owner.fullName}
        />
      )}

      {/* ── 2 cột: mobile owner trước, desktop action trái ───────── */}
      {/*
        Mobile (order-1): chủ trang trại & mùa vụ trước — ngữ cảnh trước hành động.
        Desktop (lg): cột trái hành động, cột phải ngữ cảnh.
      */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <DecisionActionPanel
            deviceStatus={ctx.device.status}
            hasOwner={!!ctx.owner}
            swap={ctx.swap}
            selectedCandidateId={selectedCandidateId}
            isSwapPending={swapMutation.isPending}
            isRevokePending={unassignMutation.isPending}
            onSelectCandidate={setSelectedCandidateId}
            onClickSwap={() => setSwapOpen(true)}
            onClickRevoke={() => setRevokeOpen(true)}
          />
        </div>
        <div className="order-1 lg:order-2">
          <DecisionOwnerCard
            owner={ctx.owner}
            milestones={ctx.activeMilestones}
          />
        </div>
      </div>

      <DecisionSwapConfirm
        open={swapOpen}
        deviceLabel={deviceIdentity}
        candidate={selectedCandidate}
        isPending={swapMutation.isPending}
        onCancel={() => setSwapOpen(false)}
        onConfirm={handleConfirmSwap}
      />

      <DecisionRevokeOwnerAlert
        open={revokeOpen}
        deviceLabel={deviceIdentity}
        ownerName={ctx.owner?.fullName ?? null}
        milestoneCount={ctx.activeMilestones.length}
        isPending={unassignMutation.isPending}
        onCancel={() => setRevokeOpen(false)}
        onConfirm={handleConfirmRevoke}
      />
    </div>
  );
}
