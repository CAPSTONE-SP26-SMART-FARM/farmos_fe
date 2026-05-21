import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<Option<T>>;
  size?: "sm" | "md";
  disabled?: boolean;
};

export default function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  size = "sm",
  disabled,
}: Props<T>) {
  const pad = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";
  return (
    <div
      role="tablist"
      className="inline-flex items-center gap-0.5 rounded-md border bg-muted/40 p-0.5"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-sm font-medium transition-colors",
              pad,
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
