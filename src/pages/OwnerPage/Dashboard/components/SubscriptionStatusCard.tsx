import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatCurrencyVnd, formatDateVi } from "@/lib/format";
import type {
  OwnerCreditBalance as CreditBalanceMock,
  OwnerSubscriptionStatus as SubscriptionStatusMock,
} from "@/types/dashboard";
import {
  CheckCircle2,
  CreditCard,
  RefreshCcw,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router";

const STATUS_META: Record<
  SubscriptionStatusMock["status"],
  { label: string; tone: string; icon: LucideIcon }
> = {
  active: {
    label: "Đang hoạt động",
    tone: "bg-emerald-500/10 text-emerald-700 border-transparent",
    icon: CheckCircle2,
  },
  expiring: {
    label: "Sắp hết hạn",
    tone: "bg-amber-500/10 text-amber-700 border-transparent",
    icon: RefreshCcw,
  },
  expired: {
    label: "Đã hết hạn",
    tone: "bg-red-500/10 text-red-700 border-transparent",
    icon: XCircle,
  },
};

interface SubscriptionStatusCardProps {
  subscription: SubscriptionStatusMock;
  credits: CreditBalanceMock;
  className?: string;
}

function SubscriptionStatusCard({
  subscription,
  credits,
  className,
}: SubscriptionStatusCardProps) {
  const subMeta = STATUS_META[subscription.status];
  const SubIcon = subMeta.icon;

  const daysWarn =
    subscription.daysRemaining <= 7 && subscription.status !== "expired";

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Gói dịch vụ & Ví</CardTitle>
        <CardDescription>Trạng thái thanh toán hiện tại.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subscription block */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Gói hiện tại</p>
              </div>
              <p className="text-2xl font-semibold">{subscription.planName}</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrencyVnd(subscription.monthlyPriceVnd)} / tháng ·
                {subscription.currentPeriodEnd ? `Hết hạn ${formatDateVi(subscription.currentPeriodEnd)}` : "Chưa có ngày hết hạn"}
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn("gap-1.5", subMeta.tone)}
            >
              <SubIcon className="h-3 w-3" />
              {subMeta.label}
            </Badge>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span
              className={cn(
                "tabular-nums",
                daysWarn ? "text-amber-600 font-medium" : "text-muted-foreground",
              )}
            >
              Còn {subscription.daysRemaining} ngày
            </span>
          </div>
        </div>

        <Separator />

        {/* Credits */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" />
              Credit bác sĩ
            </div>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {credits.doctorCredits}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" />
              Lượt tư vấn bác sĩ
            </div>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {credits.ticketCredits}
            </p>
          </div>
        </div>

        <div className="pt-1">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Link to="/dashboard/owner/payments">Xem tất cả hoá đơn</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default SubscriptionStatusCard;
