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
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground line-clamp-2">
              {label}
            </p>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-xl font-semibold tabular-nums truncate xl:text-2xl 2xl:text-3xl">
                {value}
              </p>
            )}
            {hint &&
              (isLoading ? (
                <Skeleton className="h-3 w-24" />
              ) : (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {hint}
                </p>
              ))}
          </div>
          {Icon && (
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full xl:h-10 xl:w-10",
                TONE_STYLES[tone],
              )}
              aria-hidden="true"
            >
              <Icon className="h-4 w-4 xl:h-5 xl:w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default StatCard;
