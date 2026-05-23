import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, startOfDay, endOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, RefreshCcw } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import type {
  ListSensorReadingsQueryType,
  ListSensorReadingsResType,
} from "@/schemaValidatation/sensorReading";
import { getSensorMeta } from "@/pages/SensorReadings/utils/sensorDashboard";

type SeriesHook = (
  assignmentId: string,
  sensorId: string,
  query: ListSensorReadingsQueryType,
  enabled?: boolean,
) => UseQueryResult<ListSensorReadingsResType, unknown>;

interface Props {
  assignmentId: string;
  sensorId: string;
  sensorType: string;
  sensorName?: string;
  unit?: string | null;
  threshold?: { optimalMin: number | null; optimalMax: number | null } | null;
  useSeries: SeriesHook;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function SensorChart({
  assignmentId,
  sensorId,
  sensorType,
  sensorName,
  unit,
  threshold,
  useSeries,
}: Props) {
  const meta = getSensorMeta(sensorType);
  const displayUnit = unit?.trim() || meta.unit || "";

  // Filter state: pick a date + a "from" hour + "to" hour. Default: today, 00–23.
  const [date, setDate] = useState<Date>(() => new Date());
  const [fromHour, setFromHour] = useState<number>(0);
  const [toHour, setToHour] = useState<number>(23);

  const { fromIso, toIso } = useMemo(() => {
    const base = startOfDay(date);
    const f = new Date(base);
    f.setHours(fromHour, 0, 0, 0);
    const t = new Date(base);
    // include the whole `toHour` slot
    t.setHours(toHour, 59, 59, 999);
    // Clamp `t` to endOfDay
    const eod = endOfDay(date);
    if (t > eod) t.setTime(eod.getTime());
    return { fromIso: f.toISOString(), toIso: t.toISOString() };
  }, [date, fromHour, toHour]);

  const query = useSeries(assignmentId, sensorId, {
    from: fromIso,
    to: toIso,
    limit: 50,
  });

  const points = query.data?.data ?? [];
  const chartData = useMemo(
    () =>
      points.map((p) => ({
        ts: p.timestamp,
        timeLabel: format(new Date(p.timestamp), "HH:mm"),
        value: p.value,
      })),
    [points],
  );

  const oMin = threshold?.optimalMin ?? null;
  const oMax = threshold?.optimalMax ?? null;
  const hasBand = oMin !== null && oMax !== null;

  return (
    <div className="rounded-md border bg-background p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <meta.icon className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm font-medium truncate">
            {sensorName?.trim() || meta.label}
          </p>
          {displayUnit && (
            <span className="text-[10px] text-muted-foreground">
              ({displayUnit})
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
        >
          <RefreshCcw
            className={`h-3.5 w-3.5 ${query.isFetching ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5"
            >
              <CalendarIcon className="h-3 w-3" />
              {format(date, "dd/MM/yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0"
            align="start"
          >
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <div className="flex items-center gap-1 text-xs">
          <span className="text-muted-foreground">Từ</span>
          <Input
            type="number"
            min={0}
            max={23}
            value={fromHour}
            onChange={(e) =>
              setFromHour(
                Math.max(0, Math.min(23, Number(e.target.value) || 0)),
              )
            }
            className="h-7 w-14 text-xs"
          />
          <span className="text-muted-foreground">giờ</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <span className="text-muted-foreground">đến</span>
          <Input
            type="number"
            min={0}
            max={23}
            value={toHour}
            onChange={(e) =>
              setToHour(Math.max(0, Math.min(23, Number(e.target.value) || 0)))
            }
            className="h-7 w-14 text-xs"
          />
          <span className="text-muted-foreground">giờ</span>
        </div>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {points.length}/50 điểm
        </span>
      </div>

      {query.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : chartData.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
          Không có dữ liệu trong khoảng {pad2(fromHour)}:00–{pad2(toHour)}:59
        </div>
      ) : (
        <div className="h-40">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id={`grad-${sensorId}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                opacity={0.3}
              />
              <XAxis
                dataKey="timeLabel"
                tick={{ fontSize: 10 }}
              />
              <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
              {hasBand && (
                <ReferenceArea
                  y1={oMin ?? undefined}
                  y2={oMax ?? undefined}
                  fill="hsl(var(--primary))"
                  fillOpacity={0.06}
                />
              )}
              <Tooltip
                contentStyle={{ fontSize: 11 }}
                labelFormatter={(_, payload) => {
                  const ts = payload?.[0]?.payload?.ts;
                  return ts ? format(new Date(ts), "dd/MM HH:mm:ss") : "";
                }}
                formatter={(v) => [
                  `${v}${displayUnit ? ` ${displayUnit}` : ""}`,
                  meta.label,
                ]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill={`url(#grad-${sensorId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
