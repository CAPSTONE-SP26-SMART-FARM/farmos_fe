// src/pages/OwnerPage/CropSeasons/components/KpiSummaryCards.tsx
import {
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Sparkles,
  Activity,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  computeTrackingStats,
  healthTone,
} from "./tracking-stats";
import type { TrackingDiffResType } from "@/schemaValidatation/tracking";

interface KpiSummaryCardsProps {
  diff: TrackingDiffResType;
}

const HEADLINE_TONE_CLASS: Record<
  ReturnType<typeof healthTone>,
  string
> = {
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-red-600",
  muted: "text-muted-foreground",
};

function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: "success" | "danger" | "warning" | "default";
}) {
  const toneClass = {
    success: "text-emerald-600 bg-emerald-50 border-emerald-200",
    danger: "text-red-600 bg-red-50 border-red-200",
    warning: "text-amber-600 bg-amber-50 border-amber-200",
    default: "text-muted-foreground bg-muted/50 border-border",
  }[tone];
  return (
    <div className="flex items-center gap-2.5 rounded-md border bg-background px-3 py-2 min-w-0">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${toneClass}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="leading-tight min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground truncate">
          {label}
        </p>
        <p className="text-base font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function LegendDot({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  const muted = value === 0;
  return (
    <span
      className={`flex items-center gap-1.5 ${
        muted ? "text-muted-foreground/60" : "text-muted-foreground"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${muted ? "bg-muted-foreground/30" : color}`}
      />
      {label} ({value})
    </span>
  );
}

export default function KpiSummaryCards({ diff }: KpiSummaryCardsProps) {
  const k = computeTrackingStats(diff);
  const tone = healthTone(k.onTimePct, k.total > 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-base">Tổng quan tiến độ</CardTitle>
            <CardDescription>
              {k.total > 0
                ? `${k.total} trường đã so sánh — ${k.onTime} đúng, ${k.late} trễ/vượt, ${k.early} sớm/thấp`
                : "Chưa có trường nào được so sánh"}
            </CardDescription>
          </div>
          <div className="flex items-baseline gap-1.5 shrink-0">
            <span
              className={`text-3xl font-bold tabular-nums ${HEADLINE_TONE_CLASS[tone]}`}
            >
              {k.onTimePct}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              % đúng kế hoạch
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Proportional health bar */}
        <div className="space-y-2">
          <div className="flex h-3 w-full overflow-hidden rounded-full border bg-muted">
            {k.total === 0 ? (
              <div className="flex-1" />
            ) : (
              <>
                {k.onTime > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        style={{ width: `${k.onTimePct}%` }}
                        className="bg-emerald-500 transition-all duration-500"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      Đúng kế hoạch: {k.onTime} ({k.onTimePct}%)
                    </TooltipContent>
                  </Tooltip>
                )}
                {k.late > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        style={{ width: `${k.latePct}%` }}
                        className="bg-red-500 transition-all duration-500"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      Trễ / Vượt: {k.late} ({k.latePct}%)
                    </TooltipContent>
                  </Tooltip>
                )}
                {k.early > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        style={{ width: `${k.earlyPct}%` }}
                        className="bg-amber-500 transition-all duration-500"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      Sớm / Thấp hơn: {k.early} ({k.earlyPct}%)
                    </TooltipContent>
                  </Tooltip>
                )}
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <LegendDot
              color="bg-emerald-500"
              label="Đúng"
              value={k.onTime}
            />
            <LegendDot
              color="bg-red-500"
              label="Trễ / Vượt"
              value={k.late}
            />
            <LegendDot
              color="bg-amber-500"
              label="Sớm / Thấp"
              value={k.early}
            />
          </div>
        </div>

        {/* Inline mini stats */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
          <MiniStat
            icon={CheckCircle2}
            label="Đúng"
            value={k.onTime}
            tone={k.onTime > 0 ? "success" : "default"}
          />
          <MiniStat
            icon={AlertTriangle}
            label="Trễ / Vượt"
            value={k.late}
            tone={k.late > 0 ? "danger" : "default"}
          />
          <MiniStat
            icon={TrendingDown}
            label="Sớm / Thấp"
            value={k.early}
            tone={k.early > 0 ? "warning" : "default"}
          />
          <MiniStat
            icon={Sparkles}
            label="Phát sinh"
            value={k.unplanned}
            tone={k.unplanned > 0 ? "warning" : "default"}
          />
          <MiniStat
            icon={Activity}
            label="Thay đổi"
            value={k.totalChanges}
            tone="default"
          />
        </div>
      </CardContent>
    </Card>
  );
}
