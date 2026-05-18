import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number;
  tone: "default" | "success" | "danger";
}

export function SummaryStat({ label, value, tone }: Props) {
  return (
    <div
      className={cn(
        "rounded-md border p-2 text-center",
        tone === "success" &&
          "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30",
        tone === "danger" &&
          "border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/30",
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-2xl font-semibold tabular-nums",
          tone === "success" && "text-emerald-700 dark:text-emerald-400",
          tone === "danger" && "text-destructive",
        )}
      >
        {value}
      </p>
    </div>
  );
}
