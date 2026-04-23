import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
} from "lucide-react";

type StatusBannerVariant = "info" | "warning" | "danger" | "success";

interface StatusBannerProps {
  variant: StatusBannerVariant;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; loading?: boolean };
  icon?: LucideIcon;
  className?: string;
}

const VARIANT_STYLES: Record<
  StatusBannerVariant,
  { wrapper: string; icon: string; button: string; defaultIcon: LucideIcon }
> = {
  info: {
    wrapper: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100",
    icon: "text-blue-600 dark:text-blue-400",
    button: "border-blue-300 bg-white text-blue-900 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-100 dark:hover:bg-blue-900",
    defaultIcon: Info,
  },
  warning: {
    wrapper: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
    icon: "text-amber-600 dark:text-amber-400",
    button: "border-amber-300 bg-white text-amber-900 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-100 dark:hover:bg-amber-900",
    defaultIcon: AlertTriangle,
  },
  danger: {
    wrapper: "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100",
    icon: "text-red-600 dark:text-red-400",
    button: "border-red-300 bg-white text-red-900 hover:bg-red-100 dark:bg-red-950 dark:text-red-100 dark:hover:bg-red-900",
    defaultIcon: ShieldAlert,
  },
  success: {
    wrapper: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
    icon: "text-emerald-600 dark:text-emerald-400",
    button: "border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-100 dark:hover:bg-emerald-900",
    defaultIcon: CheckCircle2,
  },
};

function StatusBanner({
  variant,
  title,
  description,
  action,
  icon,
  className,
}: StatusBannerProps) {
  const styles = VARIANT_STYLES[variant];
  const Icon = icon ?? styles.defaultIcon;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4",
        styles.wrapper,
        className,
      )}
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", styles.icon)} />
      <div className="flex-1 space-y-1">
        <p className="font-medium leading-tight">{title}</p>
        {description && <p className="text-sm opacity-90">{description}</p>}
      </div>
      {action && (
        <Button
          size="sm"
          variant="outline"
          className={cn("shrink-0", styles.button)}
          onClick={action.onClick}
          disabled={action.loading}
        >
          {action.loading ? "Đang xử lý..." : action.label}
        </Button>
      )}
    </div>
  );
}

export default StatusBanner;
export type { StatusBannerVariant };
