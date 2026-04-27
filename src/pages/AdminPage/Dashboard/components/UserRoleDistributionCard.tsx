import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UserRoleShare } from "../_mocks/adminDashboard.mock";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const ROLE_COLORS: Record<string, string> = {
  owner: "#34d399",
  manager: "#60a5fa",
  farmer: "#fbbf24",
  doctor: "#a78bfa",
  admin: "#f472b6",
};

interface RoleTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: UserRoleShare }>;
}

function RoleTooltip({ active, payload }: RoleTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{item.label}</p>
      <p className="text-muted-foreground tabular-nums">
        {item.count.toLocaleString("vi-VN")} người dùng
      </p>
    </div>
  );
}

interface UserRoleDistributionCardProps {
  data: UserRoleShare[];
  className?: string;
}

function UserRoleDistributionCard({
  data,
  className,
}: UserRoleDistributionCardProps) {
  const total = data.reduce((acc, r) => acc + r.count, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Phân bổ vai trò</CardTitle>
        <CardDescription>
          {total.toLocaleString("vi-VN")} người dùng theo vai trò
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
              />
              <YAxis
                type="category"
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={72}
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
                    fill={ROLE_COLORS[entry.role] ?? "#94a3b8"}
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

export default UserRoleDistributionCard;
