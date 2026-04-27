import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StatusDistribution } from "../_mocks/ticketAnalytics.mock";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: StatusDistribution }>;
}

function PieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload?.length) return null;
  const slice = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{slice.label}</p>
      <p className="text-muted-foreground tabular-nums">
        {slice.count.toLocaleString("vi-VN")} vé
      </p>
    </div>
  );
}

interface StatusDistributionCardProps {
  data: StatusDistribution[];
  className?: string;
}

function StatusDistributionCard({
  data,
  className,
}: StatusDistributionCardProps) {
  const total = data.reduce((acc, p) => acc + p.count, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Phân bổ theo trạng thái</CardTitle>
        <CardDescription>{total} vé trong kỳ</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-48 w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="label"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={entry.color}
                  />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-3 space-y-1.5">
          {data.map((slice) => (
            <li
              key={slice.status}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: slice.color }}
                  aria-hidden="true"
                />
                <span>{slice.label}</span>
              </div>
              <span className="text-muted-foreground tabular-nums">
                {slice.count}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default StatusDistributionCard;
