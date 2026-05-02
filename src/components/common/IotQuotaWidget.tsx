import EmptyState from "@/components/common/EmptyState";
import KpiCard from "@/components/common/KpiCard";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyIotQuota } from "@/queries/useIotKit";
import { formatDateVi } from "@/lib/format";
import { cn } from "@/lib/utils";
import { isApiErrorResponse } from "@/lib/utils";
import { CircleSlash, Cpu, Package, PackagePlus, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router";

interface IotQuotaWidgetProps {
  variant?: "full" | "compact";
  className?: string;
}

export default function IotQuotaWidget({
  variant = "full",
  className,
}: IotQuotaWidgetProps) {
  const navigate = useNavigate();
  const quotaQuery = useMyIotQuota();

  if (quotaQuery.isLoading) {
    if (variant === "compact") {
      return (
        <div
          className={cn(
            "flex items-center gap-3 rounded-md border bg-card p-3 text-sm",
            className,
          )}
        >
          <Skeleton className="h-4 w-40" />
        </div>
      );
    }
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (quotaQuery.isError) {
    const noActiveSub =
      isApiErrorResponse(quotaQuery.error) &&
      quotaQuery.error.response?.status === 422;

    if (variant === "compact") {
      return (
        <div
          className={cn(
            "flex items-center gap-3 rounded-md border bg-card p-3 text-sm",
            className,
          )}
        >
          <Badge variant="outline">Hạn mức IoT</Badge>
          <span className="text-muted-foreground">
            {noActiveSub
              ? "Chưa có gói đăng ký active."
              : "Không tải được hạn mức."}
          </span>
          {noActiveSub && (
            <Link
              to="/dashboard/owner/subscription-plans"
              className="text-primary hover:underline"
            >
              Xem gói
            </Link>
          )}
        </div>
      );
    }

    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Hạn mức thiết bị IoT</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={CircleSlash}
            title={
              noActiveSub
                ? "Chưa có hạn mức để hiển thị"
                : "Không tải được hạn mức"
            }
            description={
              noActiveSub
                ? "Bạn cần có gói đăng ký đang hoạt động để xem hạn mức thiết bị IoT."
                : "Vui lòng tải lại trang hoặc thử lại sau."
            }
            action={
              noActiveSub
                ? {
                    label: "Xem gói đăng ký",
                    onClick: () =>
                      navigate("/dashboard/owner/subscription-plans"),
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>
    );
  }

  const quota = quotaQuery.data?.data;
  if (!quota) return null;

  const totalCapacity = quota.subscriptionMax + quota.kitBonus;
  const usageRatio = totalCapacity > 0 ? quota.used / totalCapacity : 0;

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-3 rounded-md border bg-card p-3 text-sm",
          className,
        )}
      >
        <Badge variant="outline">Hạn mức IoT</Badge>
        <span>
          <span className="font-semibold">{quota.remaining}</span>
          <span className="text-muted-foreground"> / {totalCapacity} còn lại</span>
        </span>
        <span className="text-muted-foreground">·</span>
        <Link
          to="/dashboard/owner/iot-kits"
          className="text-primary hover:underline"
        >
          Mua thêm
        </Link>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Hạn mức thiết bị IoT</CardTitle>
        <CardDescription>
          Đồng pha hạn với gói đăng ký
          {quota.expiresAt
            ? ` · hết hạn ${formatDateVi(quota.expiresAt)}`
            : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={Package}
            label="Hạn mức gói"
            value={quota.subscriptionMax}
          />
          <KpiCard
            icon={PackagePlus}
            label="Bộ kit cộng thêm"
            value={quota.kitBonus}
            tone="success"
            hint={
              quota.kitBonus > 0
                ? `+${quota.kitBonus} từ kit đã mua`
                : undefined
            }
          />
          <KpiCard
            icon={Cpu}
            label="Đang sử dụng"
            value={quota.used}
            tone={usageRatio >= 0.8 ? "warning" : "default"}
          />
          <KpiCard
            icon={Zap}
            label="Còn lại"
            value={quota.remaining}
            tone={quota.remaining <= 0 ? "danger" : "success"}
          />
        </div>
      </CardContent>
    </Card>
  );
}
