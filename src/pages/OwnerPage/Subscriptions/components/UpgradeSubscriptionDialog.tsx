import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, ArrowUpCircle, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/common/EmptyState";
import { formatCurrencyVnd } from "@/lib/format";
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  useListSubscriptionPlans,
  useResolveActivePlanVersion,
} from "@/queries/useSubscriptionPlan";
import { useOwnerUpgradeSubscription } from "@/queries/useSubscription";
import type { PlanResType } from "@/schemaValidatation/subscriptionPlan";

interface UpgradeSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanId?: string;
  currentPlanName?: string;
}

function UpgradeSubscriptionDialog({
  open,
  onOpenChange,
  currentPlanId,
  currentPlanName,
}: UpgradeSubscriptionDialogProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const plansQuery = useListSubscriptionPlans({
    page: 1,
    limit: 50,
    search: undefined,
    status: "ACTIVE",
  });

  const resolveVersionMutation = useResolveActivePlanVersion();
  const upgradeMutation = useOwnerUpgradeSubscription();

  const otherPlans: PlanResType[] = useMemo(() => {
    const list = plansQuery.data?.data?.data ?? [];
    return list.filter((p) => p.id !== currentPlanId);
  }, [plansQuery.data, currentPlanId]);

  const isSubmitting =
    resolveVersionMutation.isPending || upgradeMutation.isPending;

  const handleConfirm = async () => {
    if (!selectedPlanId) return;
    try {
      const activeVersion =
        await resolveVersionMutation.mutateAsync(selectedPlanId);
      const result = await upgradeMutation.mutateAsync({
        planVersionId: activeVersion.id,
      });
      toast.success(
        `Đã tạo hóa đơn nâng gói ${result.data.invoiceNumber}. Thanh toán để kích hoạt gói mới.`,
      );
      onOpenChange(false);
      setSelectedPlanId(null);
      // Direct user to invoice detail to checkout
      window.location.href = `/dashboard/owner/payments/${result.data.invoiceId}`;
    } catch (error) {
      toast.error(getApiErrorMessageVi(error, "Nâng gói thất bại."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-primary" />
            Nâng gói đăng ký
          </DialogTitle>
          <DialogDescription>
            {currentPlanName
              ? `Bạn đang dùng gói "${currentPlanName}". Chọn gói cao hơn để nâng cấp — gói hiện tại sẽ bị huỷ ngay sau khi thanh toán gói mới.`
              : "Chọn gói cao hơn để nâng cấp."}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[420px] space-y-2 overflow-y-auto py-2">
          {plansQuery.isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang tải danh sách gói...
            </div>
          ) : otherPlans.length === 0 ? (
            <EmptyState
              icon={ArrowUpCircle}
              title="Không có gói nào khác"
              description="Hiện chưa có gói khác để nâng cấp."
            />
          ) : (
            otherPlans.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  disabled={isSubmitting}
                  className={`w-full rounded-lg border p-4 text-left transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{plan.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {plan.code}
                        </Badge>
                        {isSelected && (
                          <Badge className="bg-primary text-xs text-primary-foreground">
                            <Check className="mr-1 h-3 w-3" />
                            Đã chọn
                          </Badge>
                        )}
                      </div>
                      {plan.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {plan.description}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        Thời hạn: {plan.durationMonths} tháng
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        {formatCurrencyVnd(plan.listPrice)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        / {plan.durationMonths} tháng
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Huỷ
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedPlanId || isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Đang xử lý..." : "Nâng gói & thanh toán"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UpgradeSubscriptionDialog;
