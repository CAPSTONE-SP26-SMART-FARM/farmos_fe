import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TicketDailyPoint } from "../_mocks/ticketAnalytics.mock";
import { format, parse } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
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

interface TicketTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}

function TicketTooltip({ active, payload, label }: TicketTooltipProps) {
  if (!active || !payload?.length) return null;
  const labelMap: Record<string, string> = {
    created: "Vé tạo mới",
    resolved: "Vé đã xử lý",
  };
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{label && shortDate(label)}</p>
      {payload.map((p) => (
        <p
          key={p.dataKey}
          className="tabular-nums"
          style={{ color: p.color }}
        >
          {labelMap[p.dataKey] ?? p.dataKey}: {p.value}
        </p>
      ))}
    </div>
  );
}

interface TicketsOverTimeChartProps {
  data: TicketDailyPoint[];
  className?: string;
}

function TicketsOverTimeChart({ data, className }: TicketsOverTimeChartProps) {
  const totalCreated = data.reduce((acc, p) => acc + p.created, 0);
  const totalResolved = data.reduce((acc, p) => acc + p.resolved, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Số vé theo ngày (30 ngày)</CardTitle>
        <CardDescription>
          {totalCreated} vé tạo mới · {totalResolved} vé đã xử lý
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
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
                  id="createdGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#0ea5e9"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="100%"
                    stopColor="#0ea5e9"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient
                  id="resolvedGradient"
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
                tickLine={false}
                axisLine={false}
                fontSize={11}
                stroke="currentColor"
                className="text-muted-foreground"
                width={32}
              />
              <Tooltip
                content={<TicketTooltip />}
                cursor={{ stroke: "currentColor", strokeOpacity: 0.1 }}
              />
              <Legend
                verticalAlign="top"
                height={28}
                iconType="circle"
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value: string) =>
                  value === "created" ? "Vé tạo mới" : "Vé đã xử lý"
                }
              />
              <Area
                type="monotone"
                dataKey="created"
                stroke="#0ea5e9"
                strokeWidth={2}
                fill="url(#createdGradient)"
              />
              <Area
                type="monotone"
                dataKey="resolved"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#resolvedGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default TicketsOverTimeChart;
