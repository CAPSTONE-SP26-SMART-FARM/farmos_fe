import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TicketByTypeSlice } from "../_mocks/adminDashboardOverlay";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TicketTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TicketByTypeSlice }>;
}

function TicketTooltip({ active, payload }: TicketTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium" style={{ color: item.color }}>
        {item.label}
      </p>
      <p className="text-muted-foreground tabular-nums">
        {item.count.toLocaleString("vi-VN")} ticket
      </p>
    </div>
  );
}

interface TicketsByTypeCardProps {
  data: TicketByTypeSlice[];
  className?: string;
}

function TicketsByTypeCard({ data, className }: TicketsByTypeCardProps) {
  const total = data.reduce((acc, t) => acc + t.count, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Ticket ghi nhận theo loại</CardTitle>
        <CardDescription>
          {total.toLocaleString("vi-VN")} ticket trong kỳ
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
            >
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={88}
                stroke="currentColor"
                className="text-muted-foreground"
              />
              <Tooltip
                content={<TicketTooltip />}
                cursor={{ fill: "currentColor", fillOpacity: 0.06 }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.type} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default TicketsByTypeCard;
