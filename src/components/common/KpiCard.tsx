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
        "h-full",
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
