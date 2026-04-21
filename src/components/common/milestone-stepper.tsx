import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepStatus = "completed" | "current" | "locked" | "upcoming";

export interface StepDefinition {
  label: string;
  description?: string;
}

interface MilestoneStepperProps {
  steps: StepDefinition[];
  currentStep: number;
  stepStatuses: StepStatus[];
  onStepClick?: (index: number) => void;
}

export function MilestoneStepper({
  steps,
  stepStatuses,
  onStepClick,
}: MilestoneStepperProps) {
  return (
    <nav aria-label="Tiến trình thiết lập mốc">
      <ol className="flex items-center w-full">
        {steps.map((step, index) => {
          const status = stepStatuses[index] ?? "upcoming";
          const isLast = index === steps.length - 1;

          return (
            <li
              key={index}
              className={cn("flex items-center", !isLast && "flex-1")}
            >
              <button
                type="button"
                disabled={status === "locked"}
                onClick={() => onStepClick?.(index)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors text-left",
                  status === "locked"
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer hover:bg-muted/50",
                  status === "current" && "bg-muted/60",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                    status === "completed" &&
                      "border-primary bg-primary text-primary-foreground",
                    status === "current" &&
                      "border-primary bg-background text-primary",
                    status === "upcoming" &&
                      "border-muted-foreground/30 bg-background text-muted-foreground",
                    status === "locked" &&
                      "border-muted-foreground/20 bg-muted text-muted-foreground/50",
                  )}
                >
                  {status === "completed" ? (
                    <Check className="h-4 w-4" />
                  ) : status === "locked" ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    index + 1
                  )}
                </span>
                <div className="hidden sm:block min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium leading-tight truncate",
                      status === "current" && "text-primary",
                      status === "locked" && "text-muted-foreground/50",
                      (status === "upcoming" || status === "completed") &&
                        "text-foreground",
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {step.description}
                    </p>
                  )}
                </div>
              </button>

              {!isLast && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2",
                    status === "completed"
                      ? "bg-primary"
                      : "bg-muted-foreground/20",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
