import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { useState } from "react";

// Star rating component: 2 mode.
//  - `readOnly=true`: hiển thị số sao đã chọn (filled / empty).
//  - `readOnly=false`: cho user chọn (hover preview + click). Keyboard: arrow
//    keys + space/enter.

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  /** Aria label gốc (vd "Đánh giá ticket"). Mỗi sao sẽ có aria-label `${ariaLabel} {n} sao`. */
  ariaLabel?: string;
}

const SIZE_CLASS: Record<NonNullable<StarRatingProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

export default function StarRating({
  value,
  onChange,
  max = 5,
  readOnly = false,
  size = "md",
  ariaLabel = "Đánh giá",
}: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;

  const stars = Array.from({ length: max }, (_, i) => i + 1);

  if (readOnly) {
    return (
      <div
        className="flex items-center gap-0.5"
        aria-label={`${value} trên ${max} sao`}
      >
        {stars.map((n) => (
          <Star
            key={n}
            className={cn(
              SIZE_CLASS[size],
              n <= value
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30",
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex items-center gap-1"
    >
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${ariaLabel} ${n} sao`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          onFocus={() => setHover(n)}
          onBlur={() => setHover(null)}
          onClick={() => onChange?.(n)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowUp") {
              e.preventDefault();
              onChange?.(Math.min(max, n + 1));
            } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
              e.preventDefault();
              onChange?.(Math.max(1, n - 1));
            } else if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              onChange?.(n);
            }
          }}
          className={cn(
            "rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            !readOnly && "cursor-pointer",
          )}
        >
          <Star
            className={cn(
              SIZE_CLASS[size],
              n <= display
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30 hover:text-yellow-400/50",
            )}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm text-muted-foreground">
          {value}/{max}
        </span>
      )}
    </div>
  );
}
