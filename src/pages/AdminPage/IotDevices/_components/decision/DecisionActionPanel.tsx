import { CheckCircle2, RefreshCw, ShieldOff, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  SwapInfoType,
} from "@/schemaValidatation/iotDeviceAdminOps";
import type { DeviceStatusType } from "@/schemaValidatation/iotDevice";
import { DEVICE_STATUS_LABEL_ADMIN } from "@/constants/iotDeviceDisplay";
import { DecisionKitConstraintBox } from "./DecisionKitConstraintBox";
import { DecisionCandidateOption } from "./DecisionCandidateOption";

function getBlockedReason(
  deviceStatus: DeviceStatusType,
  swapPossible: boolean,
): string {
  // FE-level guard: chỉ cho phép thay vi xử lý khi thiết bị đang lỗi.
  // Ưu tiên kiểm tra status trước, bất kể BE trả `swap.possible` thế nào.
  if (deviceStatus === "revoked") {
    return "Thiết bị đã bị thu hồi — không thể thay thế.";
  }
  if (deviceStatus !== "error") {
    return `Thiết bị đang ở trạng thái "${DEVICE_STATUS_LABEL_ADMIN[deviceStatus]}" — chỉ có thể thay vi xử lý khi thiết bị đang lỗi.`;
  }
  if (!swapPossible) {
    return "Hiện chưa có vi xử lý thay thế phù hợp với bộ kit.";
  }
  return "";
}

interface Props {
  deviceStatus: DeviceStatusType;
  hasOwner: boolean;
  swap: SwapInfoType;
  selectedCandidateId: string | null;
  isSwapPending?: boolean;
  isRevokePending?: boolean;
  onSelectCandidate: (id: string) => void;
  onClickSwap: () => void;
  onClickRevoke: () => void;
}

export function DecisionActionPanel({
  deviceStatus,
  hasOwner,
  swap,
  selectedCandidateId,
  isSwapPending = false,
  isRevokePending = false,
  onSelectCandidate,
  onClickSwap,
  onClickRevoke,
}: Props) {
  const isPending = isSwapPending || isRevokePending;
  // Gate chính: kit phải đang lỗi VÀ BE báo có thể thay (có candidate).
  const isErrorStatus = deviceStatus === "error";
  const canShowSwapFlow = isErrorStatus && swap.possible;
  const canConfirmSwap = canShowSwapFlow && !!selectedCandidateId;
  const blockedReason = canShowSwapFlow
    ? ""
    : getBlockedReason(deviceStatus, swap.possible);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Hành động</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {deviceStatus === "error" ? (
          <p className="text-xs text-muted-foreground">
            Vi xử lý (board) là bộ điều khiển chính của bộ kit — chỉ thay khi thiết
            bị đang báo lỗi.
          </p>
        ) : null}

        {/* Banner trạng thái khả năng thay vi xử lý */}
        {canShowSwapFlow ? (
          <div
            role="status"
            className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50/60 p-3 text-sm dark:border-emerald-900/60 dark:bg-emerald-950/30"
          >
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
              aria-hidden
            />
            <p className="text-emerald-800 dark:text-emerald-200">
              Có thể thay thế — {swap.candidatesCount} vi xử lý khả dụng
              {swap.kitConstraint && (
                <>
                  {" "}phù hợp với bộ kit{" "}
                  <strong>{swap.kitConstraint.kitName}</strong>
                </>
              )}
              .
            </p>
          </div>
        ) : (
          <div
            role="status"
            className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/60 p-3 text-sm dark:border-amber-900/60 dark:bg-amber-950/30"
          >
            <XCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden
            />
            <div className="space-y-1 text-amber-800/90 dark:text-amber-200/90">
              <p className="font-medium text-amber-700 dark:text-amber-400">
                Chưa thể thay vi xử lý
              </p>
              <p>{blockedReason}</p>
            </div>
          </div>
        )}

        {canShowSwapFlow && swap.kitConstraint && (
          <DecisionKitConstraintBox kit={swap.kitConstraint} />
        )}

        {canShowSwapFlow && swap.topCandidates.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Chọn vi xử lý thay thế:</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {swap.topCandidates.map((c) => (
                <DecisionCandidateOption
                  key={c.id}
                  candidate={c}
                  selected={selectedCandidateId === c.id}
                  onSelect={() => c.isEligible && onSelectCandidate(c.id)}
                />
              ))}
            </div>
          </div>
        ) : canShowSwapFlow ? (
          <p className="text-sm text-muted-foreground">
            Hệ thống chưa tìm thấy vi xử lý thay thế phù hợp. Vui lòng thử lại
            sau.
          </p>
        ) : null}

        <div className="space-y-3 pt-1">
          {!canShowSwapFlow && !isErrorStatus && (
            <>
              <Separator />
              <p className="text-sm font-medium">Quản lý phân bổ</p>
              <p className="text-xs text-muted-foreground">
                Thiết bị không ở trạng thái lỗi — chỉ có thể gỡ phân bổ chủ
                trang trại.
              </p>
            </>
          )}
          {canShowSwapFlow && (
            <>
              <Separator />
              <p className="text-sm font-medium text-muted-foreground">
                Hoặc gỡ phân bổ
              </p>
            </>
          )}
          <div className="flex flex-wrap gap-2">
            {canShowSwapFlow && (
              <Button
                disabled={!canConfirmSwap || isPending}
                onClick={onClickSwap}
              >
                <RefreshCw
                  className="mr-1.5 h-4 w-4"
                  aria-hidden
                />
                {isSwapPending ? "Đang xử lý..." : "Thay vi xử lý ngay"}
              </Button>
            )}

            <Button
              variant="outline"
              disabled={!hasOwner || isPending}
              onClick={onClickRevoke}
            >
              <ShieldOff
                className="mr-1.5 h-4 w-4"
                aria-hidden
              />
              {isRevokePending ? "Đang xử lý..." : "Gỡ phân bổ chủ trang trại"}
            </Button>
          </div>

          {/*
            Helper text giải thích vì sao nút bị disable — tránh admin click
            không được mà không hiểu lý do.
          */}
          {(!canConfirmSwap || !hasOwner) && (
            <ul className="space-y-0.5 text-xs text-muted-foreground">
              {!isErrorStatus && (
                <li>
                  • Thay vi xử lý: chỉ áp dụng khi thiết bị đang lỗi (trạng
                  thái hiện tại: {DEVICE_STATUS_LABEL_ADMIN[deviceStatus]}).
                </li>
              )}
              {isErrorStatus && !swap.possible && (
                <li>
                  • Thay vi xử lý: hệ thống chưa có vi xử lý thay thế phù hợp.
                </li>
              )}
              {canShowSwapFlow && !selectedCandidateId && (
                <li>
                  • Thay vi xử lý: chọn 1 vi xử lý thay thế ở trên trước.
                </li>
              )}
              {!hasOwner && (
                <li>
                  • Gỡ phân bổ: thiết bị chưa có chủ trang trại để gỡ.
                </li>
              )}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
