import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrencyVnd } from "@/lib/format";
import type { DailyPoint } from "@/types/dashboard";
import { format, parse } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function shortDate(value: string): string {
  try {
    return format(parse(value, "yyyy-MM-dd", new Date()), "dd/MM");
  } catch {
    return value;
  }
}

function compactVnd(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

interface RevenueTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: DailyPoint }>;
  label?: string;
}

function RevenueTooltip({ active, payload, label }: RevenueTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{label && shortDate(label)}</p>
      <p className="text-muted-foreground tabular-nums">
        {formatCurrencyVnd(point.value)}
      </p>
    </div>
  );
}

interface RevenueTrendChartProps {
  data: DailyPoint[];
  className?: string;
}

function RevenueTrendChart({ data, className }: RevenueTrendChartProps) {
  const total = data.reduce((acc, p) => acc + p.value, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Doanh thu 30 ngày</CardTitle>
        <CardDescription>
          Tổng cộng {formatCurrencyVnd(total)} trong kỳ.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient
                  id="revenueGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#10b981"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="100%"
                    stopColor="#10b981"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-border"
              />
              <XAxis
                dataKey="date"
                tickFormatter={shortDate}
                tickLine={false}
                axisLine={false}
                fontSize={11}
                stroke="currentColor"
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={compactVnd}
                tickLine={false}
                axisLine={false}
                fontSize={11}
                stroke="currentColor"
                className="text-muted-foreground"
                width={48}
              />
              <Tooltip
                content={<RevenueTooltip />}
                cursor={{ stroke: "currentColor", strokeOpacity: 0.1 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default RevenueTrendChart;
