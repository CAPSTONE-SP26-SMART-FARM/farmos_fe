import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrencyVnd } from "@/lib/format";
import type { PlatformWallet } from "@/types/dashboard";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const REVENUE_COLOR = "#10b981";
const COST_COLOR = "#f43f5e";

interface WalletTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { label: string; value: number; color: string } }>;
}

function WalletTooltip({ active, payload }: WalletTooltipProps) {
  if (!active || !payload?.length) return null;
  const slice = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium" style={{ color: slice.color }}>
        {slice.label}
      </p>
      <p className="text-muted-foreground tabular-nums">
        {formatCurrencyVnd(slice.value)}
      </p>
    </div>
  );
}

interface PlatformWalletChartProps {
  data: PlatformWallet;
  className?: string;
}

function PlatformWalletChart({ data, className }: PlatformWalletChartProps) {
  const slices = [
    { key: "revenue", label: "Tổng doanh thu", value: data.revenueVnd, color: REVENUE_COLOR },
    { key: "cost", label: "Tổng chi phí", value: data.costVnd, color: COST_COLOR },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Ví tiền nền tảng</CardTitle>
        <CardDescription>
          Số dư hiện tại: doanh thu trừ chi phí toàn bộ thời gian.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="label"
                innerRadius={50}
                outerRadius={78}
                paddingAngle={2}
                stroke="none"
              >
                {slices.map((s) => (
                  <Cell key={s.key} fill={s.color} />
                ))}
              </Pie>
              <Tooltip content={<WalletTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 space-y-2">
          <div className="flex items-baseline justify-between rounded-md bg-muted/40 px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">
              Số dư trong ví
            </span>
            <span
              className="text-base font-semibold tabular-nums"
              style={{ color: data.netVnd >= 0 ? REVENUE_COLOR : COST_COLOR }}
            >
              {formatCurrencyVnd(data.netVnd)}
            </span>
          </div>
          <ul className="space-y-1.5">
            <li className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: REVENUE_COLOR }}
                  aria-hidden="true"
                />
                <span>Tổng doanh thu</span>
              </div>
              <span className="text-muted-foreground tabular-nums">
                {formatCurrencyVnd(data.revenueVnd)}
              </span>
            </li>
            <li className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COST_COLOR }}
                  aria-hidden="true"
                />
                <span>Tổng chi phí</span>
              </div>
              <span className="text-muted-foreground tabular-nums">
                {formatCurrencyVnd(data.costVnd)}
              </span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default PlatformWalletChart;
