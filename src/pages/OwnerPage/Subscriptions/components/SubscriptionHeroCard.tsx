import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SubscriptionStatusBadge from "@/components/common/SubscriptionStatusBadge";
import { formatDateVi, formatRelativeVi } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SubscriptionResType } from "@/schemaValidatation/subscription";
import {
  ArrowRight,
  CreditCard,
  LifeBuoy,
  RotateCcw,
  ShoppingBag,
  Sparkle,
  Zap,
} from "lucide-react";

interface SubscriptionHeroCardProps {
  subscription: SubscriptionResType;
  onRenew?: () => void;
  renewLoading?: boolean;
  onUpgrade?: () => void;
  upgradeLoading?: boolean;
  onResubscribe?: () => void;
  onPayPending?: () => void;
  onContactSupport?: () => void;
}

function SubscriptionHeroCard({
  subscription,
  onRenew,
  renewLoading,
  onUpgrade,
  upgradeLoading,
  onResubscribe,
  onPayPending,
  onContactSupport,
}: SubscriptionHeroCardProps) {
  const { status } = subscription;
  const isActiveOrPending = status === "ACTIVE" || status === "PENDING";

  const renderActions = () => {
    if (status === "ACTIVE") {
      return (
        <div className="flex flex-wrap gap-2">
          {onUpgrade && (
            <Button
              size="sm"
              onClick={onUpgrade}
              disabled={upgradeLoading}
            >
              <Zap className="mr-2 h-4 w-4" />
              {upgradeLoading ? "Đang kiểm tra..." : "Nâng gói"}
            </Button>
          )}
          {onRenew && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRenew}
              disabled={renewLoading}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {renewLoading ? "Đang gia hạn..." : "Gia hạn ngay"}
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

    if ((status === "EXPIRED" || status === "CANCELLED") && onResubscribe) {
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
        </div>
        <div className="shrink-0">{renderActions()}</div>
      </CardHeader>

      <CardContent
        className={cn(
          "grid gap-4",
          isActiveOrPending ? "md:grid-cols-2" : "md:grid-cols-3",
        )}
      >
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
        {!isActiveOrPending && (
          <div className="rounded-lg border border-dashed p-3">
            <p className="text-xs text-muted-foreground">Gói đã kết thúc</p>
            <p className="text-sm">
              {status === "CANCELLED"
                ? "Bạn có thể đăng ký gói mới bất cứ lúc nào."
                : status === "EXPIRED"
                  ? "Đăng ký gói mới để tiếp tục sử dụng dịch vụ."
                  : "Liên hệ hỗ trợ để biết thêm thông tin."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SubscriptionHeroCard;
