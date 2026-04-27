import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DailyPoint } from "../_mocks/adminDashboard.mock";
import { format, parse } from "date-fns";
import {
  Bar,
  BarChart,
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

interface UsersTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function UsersTooltip({ active, payload, label }: UsersTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{label && shortDate(label)}</p>
      <p className="text-muted-foreground tabular-nums">
        {payload[0].value} người mới
      </p>
    </div>
  );
}

interface NewUsersChartProps {
  data: DailyPoint[];
  className?: string;
}

function NewUsersChart({ data, className }: NewUsersChartProps) {
  const total = data.reduce((acc, p) => acc + p.value, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Người dùng mới 30 ngày</CardTitle>
        <CardDescription>
          {total.toLocaleString("vi-VN")} đăng ký trong kỳ.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
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
                allowDecimals={false}
              />
              <Tooltip
                content={<UsersTooltip />}
                cursor={{ fill: "currentColor", fillOpacity: 0.06 }}
              />
              <Bar
                dataKey="value"
                fill="#3b82f6"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default NewUsersChart;
