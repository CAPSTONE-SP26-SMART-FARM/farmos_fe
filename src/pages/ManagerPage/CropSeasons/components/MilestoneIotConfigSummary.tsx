import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, Radio, XCircle } from "lucide-react";
import { getSensorMeta } from "@/pages/SensorReadings/utils/sensorDashboard";
import type { IotConfigResType } from "@/schemaValidatation/productionMilestone";

interface Props {
  config: IotConfigResType | undefined;
  isLoading: boolean;
  isWizardState?: boolean;
  onGoConfig?: () => void;
}

function formatInterval(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds % 60 === 0) return `${seconds / 60} phút`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}p${s}s`;
}

export function MilestoneIotConfigSummary({
  config,
  isLoading,
  isWizardState,
  onGoConfig,
}: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!config || !config.isConfigured) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 px-3 py-2.5 text-sm">
        <XCircle className="h-4 w-4 text-amber-500 shrink-0" />
        <span className="text-amber-700 dark:text-amber-400">
          Chưa cấu hình IoT cho mốc này
        </span>
        {isWizardState && onGoConfig && (
          <Button
            size="sm"
            variant="outline"
            onClick={onGoConfig}
            className="ml-auto h-7 text-xs"
          >
            Cấu hình IoT
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border bg-background p-3 space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <p className="text-sm font-semibold">Đã cấu hình</p>
        </div>
        <Separator className="opacity-50" />
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Tần suất ghi:</span>
            <span className="font-medium">
              {formatInterval(config.readingIntervalSeconds)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-muted-foreground opacity-60" />
            <span className="text-muted-foreground">Ngưỡng mất tín hiệu:</span>
            <span className="font-medium">
              {formatInterval(config.staleThresholdSeconds)}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-background p-3 space-y-2">
        <p className="text-xs font-semibold flex items-center gap-1.5">
          <Radio className="h-3.5 w-3.5" />
          Cảm biến trong kế hoạch ({config.sensorTypes.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {config.sensorTypes.map((t) => {
            const meta = getSensorMeta(t);
            const Icon = meta.icon;
            return (
              <Badge
                key={t}
                variant="secondary"
                className="text-[11px] inline-flex items-center gap-1"
              >
                <Icon className="h-3 w-3" />
                {meta.label}
              </Badge>
            );
          })}
        </div>
      </div>
    </div>
  );
}
