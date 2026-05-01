import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  Clock,
  PauseCircle,
  Users,
  XCircle,
} from "lucide-react";

interface KpiCounts {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  cancelled: number;
  expired: number;
}

interface SubscriptionsKpiStripProps {
  counts: KpiCounts;
  loading?: boolean;
}

function KpiTile({
  icon: Icon,
  label,
  value,
  hint,
  loading,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  hint?: string;
  loading?: boolean;
  accent?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon className={`h-4 w-4 ${accent ?? "text-primary"}`} />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">
          {loading ? "…" : value.toLocaleString("vi-VN")}
        </p>
        {hint && (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        )}
      </CardContent>
    </Card>
  );
}

function SubscriptionsKpiStrip({ counts, loading }: SubscriptionsKpiStripProps) {
  const closedCount = counts.cancelled + counts.expired;
  const activeShare =
    counts.total > 0 ? Math.round((counts.active / counts.total) * 100) : 0;

  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
      <KpiTile
        icon={Users}
        label="Tổng đăng ký"
        value={counts.total}
        loading={loading}
      />
      <KpiTile
        icon={CheckCircle2}
        label="Đang hoạt động"
        value={counts.active}
        hint={counts.total > 0 ? `${activeShare}% tổng đăng ký` : undefined}
        loading={loading}
        accent="text-emerald-600"
      />
      <KpiTile
        icon={Clock}
        label="Chờ thanh toán"
        value={counts.pending}
        loading={loading}
        accent="text-blue-600"
      />
      <KpiTile
        icon={PauseCircle}
        label="Tạm ngưng"
        value={counts.suspended}
        loading={loading}
        accent="text-amber-600"
      />
      <KpiTile
        icon={XCircle}
        label="Đã hủy / hết hạn"
        value={closedCount}
        hint={`${counts.cancelled.toLocaleString("vi-VN")} hủy · ${counts.expired.toLocaleString("vi-VN")} hết hạn`}
        loading={loading}
        accent="text-muted-foreground"
      />
    </div>
  );
}

export default SubscriptionsKpiStrip;
export type { KpiCounts };
