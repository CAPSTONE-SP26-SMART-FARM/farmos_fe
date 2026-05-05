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

interface SpendTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function SpendTooltip({ active, payload, label }: SpendTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{label && shortDate(label)}</p>
      <p className="text-muted-foreground tabular-nums">
        {formatCurrencyVnd(payload[0].value)}
      </p>
    </div>
  );
}

interface MonthlySpendChartProps {
  data: DailyPoint[];
  className?: string;
}

function MonthlySpendChart({ data, className }: MonthlySpendChartProps) {
  const total = data.reduce((acc, p) => acc + p.value, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Chi tiêu 30 ngày</CardTitle>
        <CardDescription>
          Tổng cộng {formatCurrencyVnd(total)} trong kỳ.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-56 w-full">
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
                  id="ownerSpendGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#3b82f6"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="100%"
                    stopColor="#3b82f6"
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
                content={<SpendTooltip />}
                cursor={{ stroke: "currentColor", strokeOpacity: 0.1 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#ownerSpendGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default MonthlySpendChart;
