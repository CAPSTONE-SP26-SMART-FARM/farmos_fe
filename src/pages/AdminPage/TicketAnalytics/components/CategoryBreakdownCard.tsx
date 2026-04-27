import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CategoryShare } from "../_mocks/ticketAnalytics.mock";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: CategoryShare }>;
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

interface CategoryBreakdownCardProps {
  data: CategoryShare[];
  className?: string;
}

function CategoryBreakdownCard({
  data,
  className,
}: CategoryBreakdownCardProps) {
  const total = data.reduce((acc, p) => acc + p.count, 0);
  const top = [...data].sort((a, b) => b.count - a.count)[0];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Phân loại sự cố</CardTitle>
        <CardDescription>
          Nhóm phổ biến nhất: {top.label} ({top.count})
        </CardDescription>
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
                outerRadius={80}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.category}
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
              key={slice.category}
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
                {((slice.count / total) * 100).toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default CategoryBreakdownCard;
