import { useCallback, useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled,
  invalid,
  autoFocus,
  className,
  ariaLabel = "Mã OTP gồm 6 chữ số",
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocus) {
      inputsRef.current[0]?.focus();
    }
  }, [autoFocus]);

  const focusIndex = useCallback((index: number) => {
    const target = inputsRef.current[index];
    if (target) {
      target.focus();
      target.select();
    }
  }, []);

  const handleChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return;

    const chars = value.split("");
    digits.split("").forEach((digit, offset) => {
      const pos = index + offset;
      if (pos < length) chars[pos] = digit;
    });
    const next = chars.join("").slice(0, length);
    onChange(next);

    const nextFocus = Math.min(index + digits.length, length - 1);
    focusIndex(nextFocus);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;

    if (key === "Backspace") {
      e.preventDefault();
      const chars = value.split("");
      if (chars[index]) {
        chars[index] = "";
        onChange(chars.join(""));
      } else if (index > 0) {
        chars[index - 1] = "";
        onChange(chars.join(""));
        focusIndex(index - 1);
      }
      return;
    }

    if (key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusIndex(index - 1);
    }
    if (key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      focusIndex(index + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    focusIndex(Math.min(pasted.length, length - 1));
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("flex items-center gap-2", className)}
    >
      {Array.from({ length }).map((_, index) => {
        const char = value[index] ?? "";
        return (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            disabled={disabled}
            aria-invalid={invalid}
            aria-label={`Chữ số thứ ${index + 1}`}
            value={char}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.currentTarget.select()}
            className={cn(
              "h-12 w-11 rounded-md border border-input bg-transparent text-center text-lg font-semibold shadow-xs transition-[color,box-shadow] outline-none",
              "dark:bg-background",
              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
              "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
              "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            )}
          />
        );
      })}
    </div>
  );
}
