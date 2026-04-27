import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SeverityBreakdown } from "../_mocks/ticketAnalytics.mock";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface BarTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: SeverityBreakdown }>;
}

function BarTooltip({ active, payload }: BarTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{item.label}</p>
      <p className="text-muted-foreground tabular-nums">
        {item.count.toLocaleString("vi-VN")} vé sự cố
      </p>
    </div>
  );
}

interface SeverityBreakdownCardProps {
  data: SeverityBreakdown[];
  className?: string;
}

function SeverityBreakdownCard({
  data,
  className,
}: SeverityBreakdownCardProps) {
  const critical = data.find((d) => d.severity === "critical")?.count ?? 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Mức độ sự cố</CardTitle>
        <CardDescription>
          {critical} vé nghiêm trọng cần ưu tiên
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-48 w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              <XAxis
                dataKey="label"
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
                content={<BarTooltip />}
                cursor={{ fill: "currentColor", fillOpacity: 0.05 }}
              />
              <Bar
                dataKey="count"
                radius={[6, 6, 0, 0]}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.severity}
                    fill={entry.color}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default SeverityBreakdownCard;
