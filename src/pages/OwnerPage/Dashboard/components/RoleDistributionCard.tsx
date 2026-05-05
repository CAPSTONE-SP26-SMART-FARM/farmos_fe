import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { OwnerRoleShare as RoleShare } from "@/types/dashboard";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface RoleTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: RoleShare }>;
}

function RoleTooltip({ active, payload }: RoleTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{item.label}</p>
      <p className="text-muted-foreground tabular-nums">
        {item.count.toLocaleString("vi-VN")} người
      </p>
    </div>
  );
}

interface RoleDistributionCardProps {
  data: RoleShare[];
  className?: string;
}

function RoleDistributionCard({ data, className }: RoleDistributionCardProps) {
  const total = data.reduce((acc, r) => acc + r.count, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Cơ cấu nhân sự</CardTitle>
        <CardDescription>
          {total} người trong trang trại của bạn.
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
              layout="vertical"
              margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
            >
              <XAxis
                type="number"
                hide
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={80}
                stroke="currentColor"
                className="text-muted-foreground"
              />
              <Tooltip
                content={<RoleTooltip />}
                cursor={{ fill: "currentColor", fillOpacity: 0.06 }}
              />
              <Bar
                dataKey="count"
                radius={[0, 4, 4, 0]}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.role}
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

export default RoleDistributionCard;
