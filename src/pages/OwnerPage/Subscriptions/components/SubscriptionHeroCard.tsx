import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import SubscriptionStatusBadge from "@/components/common/SubscriptionStatusBadge";
import { formatDateVi, formatRelativeVi } from "@/lib/format";
import type { SubscriptionResType } from "@/schemaValidatation/subscription";
import {
  ArrowRight,
  ArrowUpCircle,
  CreditCard,
  LifeBuoy,
  RotateCcw,
  ShoppingBag,
  Sparkle,
} from "lucide-react";

interface SubscriptionHeroCardProps {
  subscription: SubscriptionResType;
  onToggleAutoRenew: (next: boolean) => void;
  toggleAutoRenewLoading?: boolean;
  onRenew?: () => void;
  renewLoading?: boolean;
  onUpgrade?: () => void;
  onResubscribe?: () => void;
  onPayPending?: () => void;
  onContactSupport?: () => void;
}

function SubscriptionHeroCard({
  subscription,
  onToggleAutoRenew,
  toggleAutoRenewLoading,
  onRenew,
  renewLoading,
  onUpgrade,
  onResubscribe,
  onPayPending,
  onContactSupport,
}: SubscriptionHeroCardProps) {
  const { status } = subscription;
  const showAutoRenewSwitch = status === "ACTIVE" || status === "PENDING";
  const autoRenewSwitchDisabled = status === "PENDING" || toggleAutoRenewLoading;

  const renderActions = () => {
    if (status === "ACTIVE") {
      return (
        <div className="flex flex-wrap gap-2">
          {onRenew && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRenew}
              disabled={renewLoading}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {renewLoading ? "Đang gia hạn..." : "Gia hạn ngay"}
            </Button>
          )}
          {onUpgrade && (
            <Button size="sm" onClick={onUpgrade}>
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              Nâng gói
            </Button>
          )}
        </div>
      );
    }

    if (status === "PENDING" && onPayPending) {
      return (
        <Button
          size="sm"
          onClick={onPayPending}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Thanh toán ngay
        </Button>
      );
    }

    if (status === "EXPIRED") {
      return (
        <div className="flex flex-wrap gap-2">
          {onRenew && (
            <Button
              size="sm"
              onClick={onRenew}
              disabled={renewLoading}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {renewLoading ? "Đang gia hạn..." : "Gia hạn gói này"}
            </Button>
          )}
          {onResubscribe && (
            <Button
              size="sm"
              variant="outline"
              onClick={onResubscribe}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Đăng ký gói khác
            </Button>
          )}
        </div>
      );
    }

    if (status === "CANCELLED" && onResubscribe) {
      return (
        <Button
          size="sm"
          onClick={onResubscribe}
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          Đăng ký gói mới
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      );
    }

    if (status === "SUSPENDED" && onContactSupport) {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={onContactSupport}
        >
          <LifeBuoy className="mr-2 h-4 w-4" />
          Liên hệ hỗ trợ
        </Button>
      );
    }

    return null;
  };

  return (
    <Card>
      <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkle className="h-4 w-4 text-primary" />
            <CardTitle className="text-lg">
              {subscription.plan?.name ?? "Gói đăng ký"}
            </CardTitle>
            <SubscriptionStatusBadge status={subscription.status} />
          </div>
          <CardDescription>
            Mã đăng ký: {subscription.id.slice(0, 8)}…
          </CardDescription>
        </div>
        <div className="shrink-0">{renderActions()}</div>
      </CardHeader>

      <CardContent className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Bắt đầu</p>
          <p className="font-medium">{formatDateVi(subscription.startedAt)}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Hết hạn</p>
          <p className="font-medium">{formatDateVi(subscription.expiresAt)}</p>
          {subscription.expiresAt && (
            <p className="text-xs text-muted-foreground">
              {formatRelativeVi(subscription.expiresAt)}
            </p>
          )}
        </div>
        {showAutoRenewSwitch ? (
          <div className="flex flex-col justify-between rounded-lg border p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">
                  Tự động gia hạn
                </p>
                <p className="font-medium">
                  {subscription.autoRenew ? "Đang bật" : "Đang tắt"}
                </p>
              </div>
              <Switch
                checked={subscription.autoRenew}
                onCheckedChange={onToggleAutoRenew}
                disabled={autoRenewSwitchDisabled}
                aria-label="Bật/tắt tự động gia hạn"
              />
            </div>
            {status === "PENDING" && (
              <p className="mt-2 text-xs text-muted-foreground">
                Có thể chỉnh sau khi thanh toán hoàn tất.
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-3">
            <p className="text-xs text-muted-foreground">Gói đã kết thúc</p>
            <p className="text-sm">
              {status === "CANCELLED"
                ? "Bạn có thể đăng ký gói mới bất cứ lúc nào."
                : status === "EXPIRED"
                  ? "Gia hạn để tiếp tục sử dụng, hoặc chọn gói khác."
                  : "Liên hệ hỗ trợ để biết thêm thông tin."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SubscriptionHeroCard;
