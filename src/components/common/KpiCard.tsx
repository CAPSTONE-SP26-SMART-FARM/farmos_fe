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
  onClick?: () => void;
  active?: boolean;
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
  className,
  onClick,
  active,
}: KpiCardProps) {
  const interactive = typeof onClick === "function";
  return (
    <Card
      className={cn(
        interactive &&
          "cursor-pointer transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active && "ring-2 ring-primary/60 ring-inset",
        className,
      )}
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive ? !!active : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground min-h-10">
              {label}
            </p>
            <p className={cn("text-2xl font-semibold", TONE_CLASS[tone])}>
              {value}
            </p>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          </div>
          <div className="rounded-md border bg-muted p-2 text-muted-foreground">
            <Icon className="h-4 w-4" aria-hidden />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default KpiCard;
