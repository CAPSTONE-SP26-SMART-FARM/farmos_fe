import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatCurrencyVnd } from "@/lib/format";
import { getApiErrorMessageVi } from "@/lib/error-message";
import { cn } from "@/lib/utils";
import { useOwnerUpgradeSubscription } from "@/queries/useSubscription";
import {
  useListSubscriptionPlanVersions,
  useResolveActivePlanVersion,
} from "@/queries/useSubscriptionPlan";
import type { PlanResType } from "@/schemaValidatation/subscriptionPlan";
import { Check, PackageX, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

interface UpgradePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  higherPlans: PlanResType[];
}

function formatFeatureValue(value: string): string {
  const lower = value.trim().toLowerCase();
  if (lower === "true") return "Có";
  if (lower === "false") return "Không";
  if (lower === "unlimited" || lower === "-1") return "Không giới hạn";
  return value.trim();
}

function PlanFeatureList({ planId }: { planId: string }) {
  const versionsQuery = useListSubscriptionPlanVersions(
    planId,
    { page: 1, limit: 20, search: undefined },
    Boolean(planId),
  );

  const activeVersion = versionsQuery.data?.data?.data?.find((v) => v.isActive);
  const features = activeVersion?.features ?? [];

  return (
    <div
      className={cn(
        "transition-opacity duration-150",
        versionsQuery.isFetching ? "opacity-50" : "opacity-100",
      )}
    >
      {features.length === 0 && !versionsQuery.isFetching ? (
        <p className="text-sm text-muted-foreground">
          Chi tiết tính năng sẽ được cập nhật.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {features.map((f) => {
            const label = f.featureName ?? f.featureCode;
            const unit = f.featureUnit;
            const formattedValue = formatFeatureValue(f.value);
            const isBoolean =
              formattedValue === "Có" || formattedValue === "Không";
            return (
              <li key={f.id} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  <span className="font-medium">
                    {isBoolean
                      ? label
                      : `${formattedValue}${unit ? ` ${unit}` : ""}`}
                  </span>
                  {!isBoolean && (
                    <span className="text-muted-foreground"> {label}</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function UpgradePlanDialog({
  open,
  onOpenChange,
  higherPlans,
}: UpgradePlanDialogProps) {
  const navigate = useNavigate();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const upgradeMutation = useOwnerUpgradeSubscription();
  const resolveVersionMutation = useResolveActivePlanVersion();

  const isLoading =
    upgradeMutation.isPending || resolveVersionMutation.isPending;

  useEffect(() => {
    if (open && higherPlans.length > 0) {
      const firstInStock = higherPlans.find((p) => p.inStock);
      setSelectedPlanId((firstInStock ?? higherPlans[0]).id);
    }
  }, [open, higherPlans]);

  const selectedPlan = higherPlans.find((p) => p.id === selectedPlanId);
  const isOutOfStock = selectedPlan ? !selectedPlan.inStock : false;

  const handleConfirm = async () => {
    if (!selectedPlanId || isOutOfStock) return;
    try {
      const planVersion =
        await resolveVersionMutation.mutateAsync(selectedPlanId);
      const result = await upgradeMutation.mutateAsync({
        planVersionId: planVersion.id,
      });
      toast.success(
        `Nâng cấp thành công! Hóa đơn ${result.data.invoiceNumber} đã được tạo.`,
      );
      onOpenChange(false);
      navigate(`/dashboard/owner/payments/${result.data.invoiceId}`);
    } catch (error) {
      toast.error(getApiErrorMessageVi(error, "Nâng cấp gói thất bại."));
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!isLoading) {
      if (!open) setSelectedPlanId(null);
      onOpenChange(open);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Nâng cấp gói đăng ký
          </DialogTitle>
          <DialogDescription>
            Chọn gói phù hợp để nâng cấp. Gói hiện tại sẽ bị hủy và gói mới
            sẽ có hiệu lực ngay sau khi thanh toán.
          </DialogDescription>
        </DialogHeader>

        {/* Plan selector — horizontal row */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {higherPlans.map((plan) => {
            const outOfStock = !plan.inStock;
            const isSelected = selectedPlanId === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className={cn(
                  "flex min-w-35 flex-col gap-1 rounded-lg border px-4 py-3 text-left transition-all duration-150",
                  outOfStock
                    ? isSelected
                      ? "border-muted-foreground/40 bg-muted/30 ring-1 ring-muted-foreground/30"
                      : "border-muted hover:border-muted-foreground/40 hover:bg-muted/20"
                    : isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/50 hover:bg-accent/40",
                )}
              >
                <span className="text-sm font-semibold leading-tight">
                  {plan.name}
                </span>
                <span
                  className={cn(
                    "text-base font-bold",
                    outOfStock ? "text-muted-foreground" : "text-primary",
                  )}
                >
                  {formatCurrencyVnd(plan.listPrice)}
                </span>
                <span className="text-xs text-muted-foreground">
                  / {plan.durationMonths} tháng
                </span>
                {outOfStock && (
                  <span className="mt-1 flex items-center gap-1 text-xs font-medium text-destructive">
                    <PackageX className="h-3 w-3" />
                    Hết hàng
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <Separator />

        {/* Selected plan detail */}
        {selectedPlan && (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{selectedPlan.name}</p>
                  {isOutOfStock && (
                    <Badge
                      variant="outline"
                      className="gap-1 border-destructive/40 text-destructive"
                    >
                      <PackageX className="h-3 w-3" />
                      Tạm hết hàng
                    </Badge>
                  )}
                </div>
                {selectedPlan.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedPlan.description}
                  </p>
                )}
              </div>
              <Badge variant="secondary" className="shrink-0">
                {selectedPlan.durationMonths} tháng
              </Badge>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Quyền lợi gói
              </p>
              <PlanFeatureList planId={selectedPlan.id} />
            </div>

            {isOutOfStock && (
              <p className="text-sm text-muted-foreground">
                Kho thiết bị IoT đang hết. Vui lòng thử lại sau hoặc chọn gói
                khác.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedPlanId || isOutOfStock || isLoading}
          >
            {isLoading ? "Đang xử lý..." : "Xác nhận nâng cấp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UpgradePlanDialog;
