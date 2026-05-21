import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Tone = "default" | "primary" | "success" | "warn" | "danger";

const TONE_CLASSES: Record<Tone, string> = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-emerald-600 dark:text-emerald-400",
  warn: "text-amber-600 dark:text-amber-400",
  danger: "text-red-600 dark:text-red-400",
};

type Props = {
  label: string;
  value: number | string | null | undefined;
  unit?: string;
  icon?: LucideIcon;
  tone?: Tone;
  isLoading?: boolean;
};

export default function SensorStatBadge({
  label,
  value,
  unit,
  icon: Icon,
  tone = "default",
  isLoading,
}: Props) {
  return (
    <Card className="flex-1 min-w-0">
      <CardContent className="px-4 py-3 space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
          <span className="truncate">{label}</span>
        </div>
        {isLoading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <div className="flex items-baseline gap-1">
            <span
              className={`text-2xl font-bold tabular-nums ${TONE_CLASSES[tone]}`}
            >
              {value ?? "—"}
            </span>
            {unit && value != null && (
              <span className="text-sm text-muted-foreground">{unit}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
