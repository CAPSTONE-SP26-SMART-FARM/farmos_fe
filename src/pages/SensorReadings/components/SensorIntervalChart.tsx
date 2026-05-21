import { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  LatestSensorReadingResType,
  SensorIntervalType,
  SensorSeriesIntervalResType,
} from "@/schemaValidatation/sensorReading";

type Props = {
  interval: SensorIntervalType;
  series: SensorSeriesIntervalResType | undefined;
  reading: LatestSensorReadingResType;
  label: string;
  unit: string;
  isLoading?: boolean;
};

const INTERVAL_TICK_FMT: Record<SensorIntervalType, string> = {
  "10s": "HH:mm:ss",
  "1m": "HH:mm",
  "1h": "HH:mm",
  "1D": "dd/MM",
  "1W": "dd/MM",
  "1M": "MM/yyyy",
};

const INTERVAL_MS: Record<SensorIntervalType, number> = {
  "10s": 10_000,
  "1m": 60_000,
  "1h": 3_600_000,
  "1D": 86_400_000,
  "1W": 7 * 86_400_000,
  "1M": 30 * 86_400_000,
};

const VIEWPORT = 30;
const DRAG_THRESHOLD_PX = 4;

const SAFE_COLOR = "#16a34a"; // green-600
const UNSAFE_COLOR = "#dc2626"; // red-600
const LINE_COLOR = "#94a3b8"; // slate-400
const THRESHOLD_COLOR = "#dc2626";

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

export default function SensorIntervalChart({
  interval,
  series,
  reading,
  label,
  unit,
  isLoading,
}: Props) {
  const points = useMemo(
    () =>
      (series?.data ?? []).map((p) => ({
        t: new Date(p.timestamp).getTime(),
        iso: p.timestamp,
        value: p.value,
      })),
    [series],
  );

  // ── Pan state ────────────────────────────────────────────────────────
  // `anchorIso === null` ⇒ live (theo dõi viewport bên phải).
  // Khi user pan, lưu ISO timestamp của dot leftmost-visible để re-locate
  // sau mỗi lần refetch.
  const [anchorIso, setAnchorIso] = useState<string | null>(null);
  const [dragPx, setDragPx] = useState(0);
  const dragStartRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Chụp length tại thời điểm user bắt đầu pan → đếm "X dot mới".
  const [panStartLength, setPanStartLength] = useState<number | null>(null);

  // Đổi interval / sensor → reset về live mode.
  useEffect(() => {
    setAnchorIso(null);
    setPanStartLength(null);
    setDragPx(0);
    dragStartRef.current = null;
  }, [interval, reading.sensorId]);

  const maxStartIdx = Math.max(0, points.length - VIEWPORT);
  const canPan = points.length > VIEWPORT;
  const isLive = anchorIso === null;

  // Đo width container để tính dot-width khi drag.
  const [containerWidth, setContainerWidth] = useState(0);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.clientWidth);
    const ro = new ResizeObserver(() => setContainerWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const baseStartIdx = useMemo(() => {
    if (isLive) return maxStartIdx;
    const found = points.findIndex((p) => p.iso === anchorIso);
    if (found < 0) return 0; // anchor đã rơi khỏi 300-cap
    return clamp(found, 0, maxStartIdx);
  }, [isLive, anchorIso, points, maxStartIdx]);

  // Trong lúc drag: ước lượng số dot đã shift theo dragPx.
  // Drag phải (dragPx > 0) ⇒ lùi thời gian ⇒ startIdx giảm.
  const dragDotShift =
    containerWidth > 0 && dragPx !== 0
      ? Math.round(-dragPx / (containerWidth / VIEWPORT))
      : 0;

  const startIdx = clamp(baseStartIdx + dragDotShift, 0, maxStartIdx);

  const visiblePoints = useMemo(
    () => points.slice(startIdx, startIdx + VIEWPORT),
    [points, startIdx],
  );

  const newDotsSincePan =
    !isLive && panStartLength != null
      ? Math.max(0, points.length - panStartLength)
      : 0;

  // ── Drag handlers ────────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canPan) return;
    dragStartRef.current = e.clientX;
    setDragPx(0);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current == null) return;
    setDragPx(e.clientX - dragStartRef.current);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current == null) return;
    const delta = e.clientX - dragStartRef.current;
    dragStartRef.current = null;

    if (Math.abs(delta) < DRAG_THRESHOLD_PX) {
      setDragPx(0);
      return;
    }

    // startIdx hiện tại đã phản ánh kết quả pan trong lúc drag (qua dragDotShift).
    const newIdx = startIdx;
    if (newIdx >= maxStartIdx) {
      setAnchorIso(null);
      setPanStartLength(null);
    } else {
      if (panStartLength == null) setPanStartLength(points.length);
      setAnchorIso(points[newIdx]?.iso ?? null);
    }
    setDragPx(0);
  };

  const goLive = () => {
    setAnchorIso(null);
    setPanStartLength(null);
  };

  // ── Visual config ────────────────────────────────────────────────────
  const tickFmt = INTERVAL_TICK_FMT[interval];
  const yDomain = useMemo<[number, number]>(() => {
    const lo = Number(reading.minValue);
    const hi = Number(reading.maxValue);
    if (Number.isFinite(lo) && Number.isFinite(hi) && hi > lo) return [lo, hi];
    return [0, 100];
  }, [reading.minValue, reading.maxValue]);

  // X-domain padding khi data sparse để dot không dính mép.
  const xDomain = useMemo<[number, number] | undefined>(() => {
    if (visiblePoints.length === 0) return undefined;
    if (visiblePoints.length === 1) {
      const t = visiblePoints[0].t;
      const pad = INTERVAL_MS[interval];
      return [t - pad, t + pad];
    }
    return [visiblePoints[0].t, visiblePoints[visiblePoints.length - 1].t];
  }, [visiblePoints, interval]);

  const dotRadius =
    visiblePoints.length <= 30 ? 3.5 : visiblePoints.length <= 100 ? 2.5 : 1.8;

  const inSafeRange = (v: number) => {
    if (!reading.threshold) return true;
    return (
      v >= reading.threshold.optimalMin && v <= reading.threshold.optimalMax
    );
  };

  type DotProps = {
    cx?: number;
    cy?: number;
    payload?: { value: number };
    index?: number;
  };
  const renderDot = ({ cx, cy, payload, index }: DotProps) => {
    if (cx == null || cy == null || !payload) return <g key={index} />;
    const color = inSafeRange(payload.value) ? SAFE_COLOR : UNSAFE_COLOR;
    return (
      <circle
        key={index}
        cx={cx}
        cy={cy}
        r={dotRadius}
        fill={color}
        stroke="white"
        strokeWidth={dotRadius >= 3 ? 1 : 0.5}
      />
    );
  };

  const atOldestEdge = !isLive && startIdx === 0;

  return (
    <div className="space-y-2">
      {/* Overlay controls */}
      <div className="flex items-center justify-between gap-2 min-h-7">
        <div className="flex items-center gap-2">
          {atOldestEdge && (
            <span className="text-[11px] text-muted-foreground">
              Hết dữ liệu cũ
            </span>
          )}
        </div>
        {!isLive && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={goLive}
          >
            <RotateCcw className="h-3 w-3" /> Về hiện tại
          </Button>
        )}
      </div>

      {/* Chart container — drag bắt trên đây */}
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`h-80 w-full rounded-md border bg-muted/10 relative overflow-hidden touch-none ${
          canPan ? "cursor-grab active:cursor-grabbing select-none" : ""
        }`}
      >
        {isLoading ? (
          <Skeleton className="absolute inset-2" />
        ) : points.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Không có dữ liệu trong khoảng này
          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={visiblePoints}
              margin={{ top: 16, right: 20, left: 4, bottom: 8 }}
            >
              <CartesianGrid
                stroke="hsl(var(--border))"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={xDomain ?? ["dataMin", "dataMax"]}
                tickFormatter={(ms) => format(ms, tickFmt)}
                tick={{ fontSize: 11 }}
                minTickGap={32}
              />
              <YAxis
                domain={yDomain}
                tick={{ fontSize: 11 }}
                width={44}
                unit={unit}
              />
              <Tooltip
                labelFormatter={(v) =>
                  typeof v === "number"
                    ? format(v, "dd/MM/yyyy HH:mm:ss", { locale: vi })
                    : ""
                }
                formatter={(v) => [`${v} ${unit}`, label]}
                contentStyle={{ fontSize: 12 }}
              />
              {reading.threshold && (
                <>
                  <ReferenceLine
                    y={reading.threshold.optimalMin}
                    stroke={THRESHOLD_COLOR}
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                    label={{
                      value: `Min ${reading.threshold.optimalMin}`,
                      fontSize: 10,
                      position: "insideTopLeft",
                    }}
                  />
                  <ReferenceLine
                    y={reading.threshold.optimalMax}
                    stroke={THRESHOLD_COLOR}
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                    label={{
                      value: `Max ${reading.threshold.optimalMax}`,
                      fontSize: 10,
                      position: "insideBottomLeft",
                    }}
                  />
                </>
              )}
              <Line
                type="linear"
                dataKey="value"
                stroke={LINE_COLOR}
                strokeWidth={1.5}
                dot={renderDot}
                activeDot={{ r: 5, fill: LINE_COLOR }}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
