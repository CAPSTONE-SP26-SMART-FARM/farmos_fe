import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SubscriptionSummaryResType } from "@/schemaValidatation/subscription";
import {
  AlarmClock,
  Award,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

interface Props {
  summary?: SubscriptionSummaryResType;
  loading?: boolean;
}

function MetricTile({
  icon: Icon,
  label,
  value,
  description,
  accent,
  loading,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  description: string;
  accent: string;
  loading?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
      <div className={`rounded-md p-2 ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight">
          {loading ? "…" : value.toLocaleString("vi-VN")}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function SubscriptionsLifecycleInsights({ summary, loading }: Props) {
  const newLast30Days = summary?.newLast30Days ?? 0;
  const expiringNext7Days = summary?.expiringNext7Days ?? 0;
  const topPlans = summary?.topPlans ?? [];
  const topMaxCount = topPlans[0]?.activeCount ?? 0;

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-base">Chỉ số vòng đời</CardTitle>
          <CardDescription>
            Các tín hiệu vận hành cho admin theo dõi tăng trưởng và rủi ro.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <MetricTile
            icon={Sparkles}
            label="Đăng ký mới"
            value={newLast30Days}
            description="Trong 30 ngày qua"
            accent="bg-emerald-100 text-emerald-700"
            loading={loading}
          />
          <MetricTile
            icon={AlarmClock}
            label="Sắp hết hạn"
            value={expiringNext7Days}
            description="Hết hạn trong 7 ngày"
            accent="bg-amber-100 text-amber-700"
            loading={loading}
          />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4 text-primary" />
            Gói phổ biến
          </CardTitle>
          <CardDescription>
            Top 5 gói có nhiều đăng ký đang hoạt động nhất.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Đang tải…</p>
          ) : topPlans.length === 0 ? (
            <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              Chưa có đăng ký đang hoạt động.
            </p>
          ) : (
            <ul className="space-y-3">
              {topPlans.map((plan, index) => {
                const percent =
                  topMaxCount > 0
                    ? Math.round((plan.activeCount / topMaxCount) * 100)
                    : 0;
                return (
                  <li key={plan.planId} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                          {index + 1}
                        </span>
                        <span className="truncate font-medium">
                          {plan.planName}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {plan.planCode}
                        </span>
                      </div>
                      <span className="shrink-0 text-sm tabular-nums font-semibold">
                        {plan.activeCount.toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <Progress value={percent} className="h-1.5" />
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SubscriptionsLifecycleInsights;
