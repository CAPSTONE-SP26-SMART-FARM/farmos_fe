import { Check } from "lucide-react";

interface Props {
  step: 1 | 2;
}

const STEPS = [
  { id: 1 as const, label: "Tạo thiết bị" },
  { id: 2 as const, label: "Thêm cảm biến" },
];

export function StepIndicator({ step }: Props) {
  return (
    <div className="mt-4 flex items-center gap-3">
      {STEPS.map((s, i) => {
        const isActive = step === s.id;
        const isDone = step > s.id;
        return (
          <div
            key={s.id}
            className="flex items-center gap-3"
          >
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${
                isDone
                  ? "border-primary bg-primary text-primary-foreground"
                  : isActive
                    ? "border-primary text-primary"
                    : "border-muted-foreground/30 text-muted-foreground"
              }`}
            >
              {isDone ? <Check className="h-4 w-4" /> : s.id}
            </div>
            <span
              className={`text-sm ${
                isActive || isDone
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="h-px w-8 bg-border md:w-12" />
            )}
          </div>
        );
      })}
    </div>
  );
}
