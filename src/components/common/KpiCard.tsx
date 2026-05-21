import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type KpiCardTone = "default" | "success" | "warning" | "danger";

const TONE_CLASS: Record<KpiCardTone, string> = {
  default: "text-foreground",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-destructive",
};

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: KpiCardTone;
  className?: string;
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
  className,
}: KpiCardProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-[11px] font-medium text-muted-foreground leading-tight">
            {label}
          </p>
          <div className="rounded-md border bg-muted p-1.5 text-muted-foreground shrink-0">
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </div>
        </div>
        <p
          className={cn(
            "text-2xl font-bold tabular-nums leading-none",
            TONE_CLASS[tone],
          )}
        >
          {value}
        </p>
        {hint && (
          <p className="text-[11px] text-muted-foreground mt-2 leading-snug">
            {hint}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default KpiCard;
