import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { IotFleetSlice } from "@/types/dashboard";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface FleetTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: IotFleetSlice }>;
}

function FleetTooltip({ active, payload }: FleetTooltipProps) {
  if (!active || !payload?.length) return null;
  const slice = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{slice.label}</p>
      <p className="text-muted-foreground tabular-nums">
        {slice.count.toLocaleString("vi-VN")} thiết bị
      </p>
    </div>
  );
}

interface IotFleetStatusCardProps {
  data: IotFleetSlice[];
  className?: string;
}

function IotFleetStatusCard({ data, className }: IotFleetStatusCardProps) {
  const total = data.reduce((acc, s) => acc + s.count, 0);
  const active = data.find((s) => s.status === "active")?.count ?? 0;
  const activePct = total > 0 ? Math.round((active / total) * 100) : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Tình trạng thiết bị IoT</CardTitle>
        <CardDescription>
          {total.toLocaleString("vi-VN")} thiết bị · {activePct}% đang hoạt động
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
              <Tooltip content={<FleetTooltip />} />
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

export default IotFleetStatusCard;
