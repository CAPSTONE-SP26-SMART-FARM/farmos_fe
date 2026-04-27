import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type StatTone = "default" | "success" | "warning" | "danger";

const TONE_STYLES: Record<StatTone, string> = {
  default: "bg-muted text-muted-foreground",
  success: "bg-emerald-500/10 text-emerald-600",
  warning: "bg-amber-500/10 text-amber-600",
  danger: "bg-red-500/10 text-red-600",
};

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: StatTone;
  isLoading?: boolean;
  className?: string;
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  isLoading = false,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("transition-shadow hover:shadow-sm", className)}>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl font-semibold tabular-nums">{value}</p>
            )}
            {hint &&
              (isLoading ? (
                <Skeleton className="h-3 w-24" />
              ) : (
                <p className="text-xs text-muted-foreground">{hint}</p>
              ))}
          </div>
          {Icon && (
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                TONE_STYLES[tone],
              )}
              aria-hidden="true"
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default StatCard;
