import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrencyVnd } from "@/lib/format";
import { getApiErrorMessageVi } from "@/lib/error-message";
import { isApiErrorResponse } from "@/lib/utils";
import {
  useListSubscriptionPlanVersions,
  useResolveActivePlanVersion,
} from "@/queries/useSubscriptionPlan";
import { useOwnerCreateSubscription } from "@/queries/useSubscription";
import type { PlanResType } from "@/schemaValidatation/subscriptionPlan";
import { Check, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

interface SubscribeReviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PlanResType | null;
}

const FEATURE_PREVIEW_LIMIT = 8;

function formatFeatureValue(value: string): string {
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "true") return "Có";
  if (lower === "false") return "Không";
  if (lower === "unlimited" || lower === "-1") return "Không giới hạn";
  return trimmed;
}

function SubscribeReviewSheet({
  open,
  onOpenChange,
  plan,
}: SubscribeReviewSheetProps) {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  const versionsQuery = useListSubscriptionPlanVersions(
    plan?.id ?? "",
    { page: 1, limit: 20, search: undefined },
    Boolean(plan?.id) && open,
  );
  const activeVersion = versionsQuery.data?.data?.data?.find((v) => v.isActive);

  const resolveActiveVersion = useResolveActivePlanVersion();
  const createSubscription = useOwnerCreateSubscription();

  const isSubmitting =
    resolveActiveVersion.isPending || createSubscription.isPending;

  const handleOpenChange = (next: boolean) => {
    if (!next) setAgreed(false);
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    if (!plan) return;
    try {
      const version = await resolveActiveVersion.mutateAsync(plan.id);
      const result = await createSubscription.mutateAsync({
        planVersionId: version.id,
      });
      handleOpenChange(false);
      navigate(`/dashboard/owner/payments/${result.data.invoiceId}`);
    } catch (error) {
      if (isApiErrorResponse(error)) {
        toast.error(error.response?.data.message ?? "Đăng ký gói thất bại.");
        return;
      }
      toast.error(getApiErrorMessageVi(error, "Đăng ký gói thất bại."));
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={handleOpenChange}
    >
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Xác nhận đăng ký</SheetTitle>
          <SheetDescription>
            Kiểm tra thông tin gói. Sau khi xác nhận, bạn sẽ được chuyển đến
            trang thanh toán.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4">
          {!plan ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <>
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {plan.code}
                </p>
                <p className="mt-1 text-lg font-semibold">{plan.name}</p>
                {plan.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                )}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Thời hạn</p>
                    <p className="font-medium">{plan.durationMonths} tháng</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tổng tiền</p>
                    <p className="font-semibold text-primary">
                      {formatCurrencyVnd(plan.listPrice)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <p className="mb-2 text-sm font-medium">Bao gồm</p>
                {versionsQuery.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                ) : !activeVersion ||
                  activeVersion.features.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Chi tiết tính năng sẽ được cập nhật.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {activeVersion.features
                      .slice(0, FEATURE_PREVIEW_LIMIT)
                      .map((f) => (
                        <li
                          key={f.id}
                          className="flex items-start gap-2 text-sm"
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>
                            <span className="font-medium">
                              {formatFeatureValue(f.value)}
                            </span>{" "}
                            <span className="text-muted-foreground">
                              {f.featureCode}
                            </span>
                          </span>
                        </li>
                      ))}
                    {activeVersion.features.length > FEATURE_PREVIEW_LIMIT && (
                      <li className="text-xs text-muted-foreground">
                        +
                        {activeVersion.features.length - FEATURE_PREVIEW_LIMIT}{" "}
                        tính năng khác
                      </li>
                    )}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border bg-primary/5 p-4 text-sm">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium">Thanh toán qua PayOS</p>
                    <p className="text-xs text-muted-foreground">
                      Hoá đơn sẽ được tạo và bạn có thể thanh toán ngay. Gói sẽ
                      kích hoạt sau khi PayOS xác nhận giao dịch.
                    </p>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span>
                  Tôi đã đọc và đồng ý với điều khoản dịch vụ của gói đăng ký.
                </span>
              </label>
            </>
          )}
        </div>

        <SheetFooter className="gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Huỷ
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!plan || !agreed || isSubmitting}
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận & thanh toán"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default SubscribeReviewSheet;
